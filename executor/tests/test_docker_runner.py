import io
import json
import subprocess
import unittest
from unittest.mock import patch

from app.config import ExecutionLimits
from app.sandbox.docker_runner import DockerSandboxRunner
from app.sandbox.runner import ExecutionUnavailable
from app.schemas.execution import ExecutionRequest


class FakeProcess:
    def __init__(self, stdout=b"", stderr=b"", running=False):
        self.stdout = io.BytesIO(stdout)
        self.stderr = io.BytesIO(stderr)
        self.stdin = io.BytesIO()
        self.running = running

    def poll(self):
        return None if self.running else 0

    def wait(self, timeout=None):
        self.running = False
        return 0

    def kill(self):
        self.running = False


class DockerRunnerTest(unittest.TestCase):
    def setUp(self):
        self.runner = DockerSandboxRunner()
        self.limits = ExecutionLimits()

    def collect(self, process, state=None, limits=None):
        state = state or {"Status": "exited", "ExitCode": 0, "OOMKilled": False}
        with patch.object(self.runner, "_command", return_value=json.dumps(state)):
            return self.runner._collect(process, "unit-test", ExecutionRequest("print('Olá')"), limits or self.limits)

    def test_success_preserves_unicode_and_newlines(self):
        result = self.collect(FakeProcess("Olá\n".encode()))
        self.assertEqual((result.status, result.stdout, result.exit_code), ("completed", "Olá\n", 0))

    def test_runtime_error(self):
        result = self.collect(FakeProcess(stderr=b"ValueError"), {"Status": "exited", "ExitCode": 1})
        self.assertEqual(result.status, "runtime_error")

    def test_oom_is_not_wrong_answer(self):
        result = self.collect(FakeProcess(), {"Status": "exited", "ExitCode": 137, "OOMKilled": True})
        self.assertEqual(result.status, "memory_limit")

    def test_python_memory_error_is_memory_limit_without_oom_flag(self):
        result = self.collect(FakeProcess(), {"Status": "exited", "ExitCode": 120, "OOMKilled": False})
        self.assertEqual(result.status, "memory_limit")

    def test_function_result_envelope_and_debug_output(self):
        for envelope, status in [(b'{"result": null}', 'completed'), (b'{}', 'runtime_error'), (b'', 'runtime_error')]:
            with self.subTest(envelope=envelope), patch.object(self.runner, '_command', return_value='{"Status":"exited","ExitCode":0}'):
                result = self.runner._collect(FakeProcess(envelope, b'debug\n'), 'test', ExecutionRequest('def solution(): pass', mode='function'), self.limits)
                self.assertEqual(result.status, status)
                if status == 'completed':
                    self.assertIsNone(result.result)
                    self.assertEqual(result.stdout, 'debug\n')

    def test_combined_output_is_bounded(self):
        result = self.collect(FakeProcess(b"a" * 9000, b"b" * 9000), limits=ExecutionLimits(output_bytes=100))
        self.assertEqual(result.status, "output_limit")
        self.assertEqual(len(result.stdout) + len(result.stderr), 100)

    def test_wall_timeout_kills_container(self):
        with patch("app.sandbox.docker_runner.time.monotonic", side_effect=[0, 10]), patch.object(self.runner, "_command", return_value='{"Status":"exited","ExitCode":137}') as command:
            result = self.runner._collect(FakeProcess(running=True), "unit-test", ExecutionRequest("while True: pass"), self.limits)
        self.assertEqual(result.status, "time_limit")
        command.assert_any_call("kill", "unit-test")

    def test_hardening_flags_and_no_host_mount(self):
        args = self.runner._create_args("test", self.limits)
        for flag in ["--network=none", "--read-only", "--cap-drop=ALL", "--user=65534:65534", "--security-opt=no-new-privileges:true", "--log-driver=none", "--pull=never"]:
            self.assertIn(flag, args)
        self.assertNotIn("--privileged", args)
        self.assertNotIn("--volume", args)
        self.assertNotIn("--mount", args)
        self.assertNotIn("--env-file", args)

    def test_invalid_requests_do_not_start_docker(self):
        with patch.object(self.runner, "check_available") as check:
            for request in [ExecutionRequest(" "), ExecutionRequest("x" * 65537), ExecutionRequest("x", "x" * 65537), ExecutionRequest(None)]:
                with self.assertRaises(ValueError):
                    self.runner.run(request, self.limits)
            check.assert_not_called()

    def test_invalid_limits(self):
        for kwargs in [{"wall_time_seconds": 0}, {"memory_megabytes": -1}, {"processes": 10000}, {"output_bytes": True}]:
            with self.assertRaises(ValueError):
                ExecutionLimits(**kwargs)

    def test_bootstrap_is_valid_python(self):
        from app.sandbox.bootstrap import BOOTSTRAP
        compile(BOOTSTRAP, '<sandbox-bootstrap>', 'exec')

    def test_missing_docker_is_infrastructure_error(self):
        with patch("app.sandbox.docker_runner.subprocess.run", side_effect=FileNotFoundError):
            with self.assertRaises(ExecutionUnavailable):
                self.runner.check_available()

    def test_rejects_daemon_without_limits(self):
        with patch.object(self.runner, "_command", return_value='{"OSType":"linux","MemoryLimit":false}'):
            with self.assertRaises(ExecutionUnavailable):
                self.runner.check_available()

    def test_cleanup_on_attach_failure(self):
        with patch.object(self.runner, "check_available"), patch.object(self.runner, "_command"), patch.object(self.runner, "_remove") as remove, patch("app.sandbox.docker_runner.subprocess.Popen", side_effect=OSError):
            with self.assertRaises(ExecutionUnavailable):
                self.runner.run(ExecutionRequest("print(1)"), self.limits)
            remove.assert_called_once()

    def test_cleanup_on_collection_failure(self):
        process = FakeProcess()
        with patch.object(self.runner, "check_available"), patch.object(self.runner, "_command"), patch.object(self.runner, "_remove") as remove, patch("app.sandbox.docker_runner.subprocess.Popen", return_value=process), patch.object(self.runner, "_collect", side_effect=ExecutionUnavailable):
            with self.assertRaises(ExecutionUnavailable):
                self.runner.run(ExecutionRequest("print(1)"), self.limits)
            remove.assert_called_once()

    def test_stuck_cleanup_fails_closed(self):
        with patch.object(self.runner, "_command", side_effect=[ExecutionUnavailable(), "container-id"]):
            with self.assertRaises(ExecutionUnavailable):
                self.runner._remove("test")

    def test_docker_timeout_is_infrastructure_error(self):
        with patch("app.sandbox.docker_runner.subprocess.run", side_effect=subprocess.TimeoutExpired("docker", 15)):
            with self.assertRaises(ExecutionUnavailable):
                self.runner.check_available()
