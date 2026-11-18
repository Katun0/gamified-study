"""Executar explicitamente com RUN_SANDBOX_INTEGRATION=1 e Docker Linux preparado."""

import os
import unittest

from app.config import ExecutionLimits
from app.sandbox.docker_runner import DockerSandboxRunner
from app.schemas.execution import ExecutionRequest


@unittest.skipUnless(os.environ.get("RUN_SANDBOX_INTEGRATION") == "1", "Requer Docker Linux e imagem construída")
class SandboxIntegrationTest(unittest.TestCase):
    def setUp(self):
        self.runner = DockerSandboxRunner()

    def run_code(self, code, stdin="", **limits):
        return self.runner.run(ExecutionRequest(code, stdin), ExecutionLimits(**limits))

    def test_print_and_input(self):
        result = self.run_code("print(input())", "Olá na tela\n")
        self.assertEqual(result.status, "completed")
        self.assertEqual(result.stdout, "Olá na tela\n")

    def test_syntax_error(self):
        self.assertEqual(self.run_code("if :").status, "runtime_error")

    def test_infinite_loop(self):
        self.assertEqual(self.run_code("while True: pass", wall_time_seconds=1).status, "time_limit")

    def test_output_flood(self):
        result = self.run_code("while True: print('x' * 4096)", output_bytes=1000)
        self.assertEqual(result.status, "output_limit")
        self.assertLessEqual(len(result.stdout.encode()), 1000)

    def test_memory_limit(self):
        self.assertEqual(self.run_code("a = bytearray(512 * 1024 * 1024)").status, "memory_limit")

    def run_function(self, code, args=None, **limits):
        return self.runner.run(ExecutionRequest(code, mode="function", func_args=args), ExecutionLimits(**limits))

    def test_function_return_is_separate_from_prints(self):
        result = self.run_function('print("---RESULT_START---")\ndef solution():\n print("debug")\n return "João"', [])
        self.assertEqual(result.status, "completed", result.stderr)
        self.assertEqual(result.result, "João")
        self.assertEqual(result.stdout, "---RESULT_START---\ndebug\n")

    def test_function_arguments_and_json_returns(self):
        for value in [None, True, 42, 1.5, "Olá", [1, 2], {"a": 1}]:
            with self.subTest(value=value):
                result = self.run_function('def solution(value):\n return value', [value])
                self.assertEqual(result.status, "completed", result.stderr)
                self.assertEqual(result.result, value)
        result = self.run_function('def solution(a, b):\n return a + b', [2, 3])
        self.assertEqual(result.result, 5)

    def test_function_errors_and_missing_result(self):
        for code in ['x = 1', 'def solution(x): return x', 'async def solution(): pass',
                     'def solution(): return {1, 2}', 'def solution(): return float("nan")',
                     'def solution(): raise ValueError("erro")', 'import sys; sys.exit(0)']:
            with self.subTest(code=code):
                self.assertEqual(self.run_function(code, []).status, "runtime_error")

    def test_function_resource_limits(self):
        self.assertEqual(self.run_function('def solution(): return bytearray(512 * 1024 * 1024)').status, "memory_limit")
        self.assertEqual(self.run_function('def solution():\n while True: pass', wall_time_seconds=1).status, "time_limit")
        self.assertEqual(self.run_function('def solution(): return "x" * 10000', output_bytes=1000).status, "output_limit")

    def test_no_external_network(self):
        code = "import socket\nsocket.create_connection(('1.1.1.1', 443), timeout=1)"
        self.assertEqual(self.run_code(code).status, "runtime_error")

    def test_unprivileged_and_readonly(self):
        result = self.run_code("import os\nprint(os.getuid())\nopen('/etc/forbidden', 'w')")
        self.assertEqual(result.status, "runtime_error")
        self.assertEqual(result.stdout, "65534\n")

    def test_runs_do_not_share_files(self):
        self.assertEqual(self.run_code("open('/tmp/marker', 'w').write('private')").status, "completed")
        self.assertEqual(self.run_code("import os\nprint(os.path.exists('/tmp/marker'))").stdout, "False\n")

    def test_process_limit(self):
        code = "import subprocess\np = []\ntry:\n while True: p.append(subprocess.Popen(['sleep', '30']))\nexcept OSError:\n print('limited')\nfinally:\n for child in p: child.kill()"
        result = self.run_code(code, processes=8)
        self.assertEqual(result.status, "completed")
        self.assertEqual(result.stdout, "limited\n")
