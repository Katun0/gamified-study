"""Docker Linux: um container por chamada, sem executar Python do aluno no host."""

import json
import os
import shutil
from pathlib import Path
import subprocess
import threading
import time
import uuid

from app.config import ExecutionLimits
from app.sandbox.bootstrap import BOOTSTRAP
from app.sandbox.runner import ExecutionUnavailable
from app.schemas.execution import ExecutionRequest, ExecutionResult


class DockerSandboxRunner:
    def __init__(self, image: str = "gamified-study-python:local", docker: str = "docker",
                 runtime: str | None = None) -> None:
        self.image = image
        self.docker = docker
        if os.name == "nt" and docker == "docker" and not shutil.which("docker"):
            for root, relative in (("LOCALAPPDATA", "Programs/DockerDesktop"),
                                   ("ProgramFiles", "Docker/Docker")):
                if base := os.environ.get(root):
                    cli = Path(base) / relative / "resources/bin/docker.exe"
                    if cli.is_file():
                        self.docker = str(cli)
                        break
        self.runtime = runtime

    def _command(self, *args: str) -> str:
        try:
            result = subprocess.run([self.docker, *args], capture_output=True,
                                    timeout=15, check=False)
        except FileNotFoundError as exc:
            raise ExecutionUnavailable("A CLI docker não foi encontrada no PATH do executor.") from exc
        except (OSError, subprocess.TimeoutExpired) as exc:
            raise ExecutionUnavailable("Docker indisponível ou sem resposta.") from exc
        if result.returncode:
            if args[0] == "info":
                raise ExecutionUnavailable("docker info falhou. Verifique o daemon e o contexto Docker deste terminal.")
            if args[:2] == ("image", "inspect"):
                raise ExecutionUnavailable(f"Não foi possível inspecionar a imagem {self.image}. Verifique se ela foi construída neste contexto.")
            # Não expor diagnósticos do daemon ou caminhos internos ao aluno.
            raise ExecutionUnavailable(f"Falha na operação Docker: {args[0]}.")
        return result.stdout.decode("utf-8")

    def check_available(self) -> None:
        try:
            info = json.loads(self._command("info", "--format", "{{json .}}"))
            if (info.get("OSType") != "linux" or not info.get("MemoryLimit")
                    or not info.get("PidsLimit") or not (info.get("CpuCfsQuota") or info.get("CPUCfsQuota"))
                    or not info.get("SwapLimit")):
                raise ExecutionUnavailable("Docker Linux com limites de recursos é obrigatório.")
            security = info.get("SecurityOptions", [])
            if not any("seccomp" in option for option in security):
                raise ExecutionUnavailable("O filtro seccomp do Docker deve estar habilitado.")
            image = json.loads(self._command("image", "inspect", self.image))[0]
            if image.get("Os") != "linux" or image.get("Config", {}).get("Volumes"):
                raise ExecutionUnavailable("Imagem Linux sem volumes declarados é obrigatória.")
        except (ValueError, KeyError, IndexError, TypeError) as exc:
            raise ExecutionUnavailable("Resposta inválida do Docker.") from exc

    def _create_args(self, name: str, limits: ExecutionLimits) -> list[str]:
        args = ["create", "--name", name, "--pull=never", "--label", "gamified-study.sandbox=true",
                "--network=none", "--read-only", "--cap-drop=ALL",
                "--security-opt=no-new-privileges:true", "--user=65534:65534",
                "--pids-limit", str(limits.processes), "--cpus=1",
                "--memory", f"{limits.memory_megabytes}m",
                "--memory-swap", f"{limits.memory_megabytes}m",
                "--ulimit=nofile=64:64", "--ulimit=core=0:0",
                "--tmpfs=/tmp:rw,noexec,nosuid,nodev,size=16m,mode=1777",
                "--ipc=none", "--log-driver=none", "--restart=no",
                "--workdir=/tmp", "--entrypoint=python", "-i"]
        if self.runtime:
            args.extend(["--runtime", self.runtime])
        return [*args, self.image, "-I", "-B", "-u", "-c", BOOTSTRAP]

    def run(self, request: ExecutionRequest, limits: ExecutionLimits) -> ExecutionResult:
        if not isinstance(request.code, str) or not isinstance(request.stdin, str):
            raise ValueError("Código e entrada devem ser textos.")
        if not request.code.strip():
            raise ValueError("Informe o código.")
        if len(request.code.encode("utf-8")) > limits.code_bytes:
            raise ValueError("Código excede o limite permitido.")
        if len(request.stdin.encode("utf-8")) > limits.input_bytes:
            raise ValueError("Entrada excede o limite permitido.")
        self.check_available()
        name = "study-sandbox-" + uuid.uuid4().hex
        process = None
        try:
            self._command(*self._create_args(name, limits))
            try:
                process = subprocess.Popen([self.docker, "start", "--attach", "--interactive", name],
                                           stdin=subprocess.PIPE, stdout=subprocess.PIPE,
                                           stderr=subprocess.PIPE, bufsize=0)
            except OSError as exc:
                raise ExecutionUnavailable("Não foi possível iniciar a sandbox.") from exc
            return self._collect(process, name, request, limits)
        finally:
            # Também executado em cancelamento, falha no attach ou timeout.
            # Não usar --rm: precisamos consultar OOMKilled antes de remover.
            try:
                self._remove(name)
            finally:
                if process is not None:
                    if process.poll() is None:
                        process.kill()
                    process.wait(timeout=5)
                    for stream in (process.stdin, process.stdout, process.stderr):
                        if stream:
                            stream.close()

    def _remove(self, name: str) -> None:
        try:
            self._command("rm", "--force", name)
        except ExecutionUnavailable:
            # Create pode falhar antes de criar o container. Só tolerar ausência
            # confirmada; falha de limpeza deve impedir um resultado de sucesso.
            existing = self._command("ps", "-aq", "--filter", f"name=^/{name}$")
            if existing.strip():
                raise ExecutionUnavailable("Não foi possível remover a sandbox.")

    def _collect(self, process, name: str, request: ExecutionRequest,
                 limits: ExecutionLimits) -> ExecutionResult:
        output = [bytearray(), bytearray()]
        lock = threading.Lock()
        exceeded = threading.Event()
        io_failed = threading.Event()

        def read(stream, index):
            try:
                while chunk := stream.read(4096):
                    with lock:
                        remaining = limits.output_bytes - sum(map(len, output))
                        output[index].extend(chunk[:remaining])
                        if len(chunk) > remaining:
                            exceeded.set()
            except (OSError, ValueError):
                io_failed.set()

        def write():
            try:
                payload_data = {
                    "code": request.code,
                    "mode": request.mode
                }
                if request.mode == "function":
                    payload_data["func_args"] = request.func_args
                else:
                    payload_data["stdin"] = request.stdin
                
                payload = json.dumps(payload_data).encode("utf-8")
                view = memoryview(payload)
                while view:
                    written = process.stdin.write(view)
                    if not written:
                        raise OSError("stdin fechado")
                    view = view[written:]
                process.stdin.close()
            except (OSError, ValueError):
                io_failed.set()

        threads = [threading.Thread(target=read, args=(process.stdout, 0), daemon=True),
                   threading.Thread(target=read, args=(process.stderr, 1), daemon=True),
                   threading.Thread(target=write, daemon=True)]
        for thread in threads:
            thread.start()
        deadline = time.monotonic() + limits.wall_time_seconds
        forced_status = None
        while process.poll() is None:
            if exceeded.is_set():
                forced_status = "output_limit"
                break
            if time.monotonic() >= deadline:
                forced_status = "time_limit"
                break
            time.sleep(0.01)
        if forced_status:
            try:
                self._command("kill", name)
            except ExecutionUnavailable:
                # O programa pode terminar entre poll() e kill().
                state = json.loads(self._command("inspect", "--format", "{{json .State}}", name))
                if state.get("Status") != "exited":
                    raise
        try:
            process.wait(timeout=5)
        except subprocess.TimeoutExpired as exc:
            raise ExecutionUnavailable("A sandbox não encerrou corretamente.") from exc
        for thread in threads:
            thread.join(timeout=2)
        if any(thread.is_alive() for thread in threads):
            raise ExecutionUnavailable("Falha ao encerrar os canais da sandbox.")
        try:
            state = json.loads(self._command("inspect", "--format", "{{json .State}}", name))
            if state.get("Error") or state.get("Status") != "exited":
                raise ExecutionUnavailable("O container não executou corretamente.")
            exit_code = state["ExitCode"]
        except (ValueError, KeyError, TypeError) as exc:
            raise ExecutionUnavailable("Resultado inválido do container.") from exc
        if io_failed.is_set() and not forced_status:
            raise ExecutionUnavailable("Falha na comunicação com o container.")
        status = forced_status or ("output_limit" if exceeded.is_set() else
                                  "memory_limit" if state.get("OOMKilled") else
                                  "completed" if exit_code == 0 else "runtime_error")
        
        stdout_str = output[0].decode("utf-8", errors="replace")
        stderr_str = output[1].decode("utf-8", errors="replace")
        result_value = None
        
        if request.mode == "function" and status == "completed":
            marker = "\n---RESULT_START---\n"
            if marker in stdout_str:
                parts = stdout_str.split(marker)
                stdout_str = parts[0]
                try:
                    result_data = json.loads(parts[1])
                    result_value = result_data.get("result")
                except (json.JSONDecodeError, KeyError, IndexError):
                    status = "runtime_error"
                    stderr_str += "\nErro ao decodificar o resultado da função."
            else:
                # Se não encontrar o marcador mas completou, talvez não tenha prints e o marcador esteja no início
                marker_start = "---RESULT_START---\n"
                if stdout_str.startswith(marker_start):
                    parts = stdout_str.split(marker_start)
                    stdout_str = ""
                    try:
                        result_data = json.loads(parts[1])
                        result_value = result_data.get("result")
                    except (json.JSONDecodeError, KeyError, IndexError):
                        status = "runtime_error"
                        stderr_str += "\nErro ao decodificar o resultado da função."
                else:
                    status = "runtime_error"
                    stderr_str += "\nErro: O marcador de resultado da função não foi encontrado."

        return ExecutionResult(status, stdout_str, stderr_str,
                               None if forced_status else exit_code,
                               result_value)
