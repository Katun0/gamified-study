"""CLI de diagnóstico local; a API HTTP ainda não está habilitada."""

import argparse
import json
import sys
from dataclasses import asdict

from app.config import ExecutionLimits
from app.sandbox.docker_runner import DockerSandboxRunner
from app.sandbox.runner import ExecutionUnavailable
from app.schemas.execution import ExecutionRequest


def main() -> None:
    parser = argparse.ArgumentParser(description="Executar JSON recebido por stdin em sandbox Docker")
    parser.add_argument("--check", action="store_true", help="Verificar Docker e imagem")
    args = parser.parse_args()
    runner = DockerSandboxRunner()
    try:
        if args.check:
            runner.check_available()
            print(json.dumps({"available": True}))
            return
        limits = ExecutionLimits()
        max_payload = (limits.code_bytes + limits.input_bytes) * 6 + 1024
        raw = sys.stdin.buffer.read(max_payload + 1)
        if len(raw) > max_payload:
            raise ValueError("Requisição excede o limite permitido.")
        payload = json.loads(raw)
        if not isinstance(payload, dict) or set(payload) - {"code", "stdin"}:
            raise ValueError("Informe somente code e stdin.")
        result = runner.run(ExecutionRequest(payload.get("code"), payload.get("stdin", "")), limits)
        data = asdict(result)
        data["exitCode"] = data.pop("exit_code")
        print(json.dumps(data, ensure_ascii=True))
    except ExecutionUnavailable as exc:
        print(json.dumps({"error": "execution_unavailable", "message": str(exc)}))
        raise SystemExit(2)
    except (ValueError, UnicodeError) as exc:
        print(json.dumps({"error": "invalid_request", "message": str(exc)}))
        raise SystemExit(1)


if __name__ == "__main__":
    main()
