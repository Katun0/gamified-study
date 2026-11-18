"""Adaptador HTTP local. Processa uma execução por vez."""

import hmac
import json
import os
import re
from pathlib import Path
from http.server import BaseHTTPRequestHandler, HTTPServer

from app.api.routes import execute
from app.sandbox.runner import ExecutionUnavailable
from app.schemas.execution import ExecutionRequest


class Handler(BaseHTTPRequestHandler):
    timeout = 10

    def reply(self, status, data):
        body = json.dumps(data).encode()
        self.send_response(status)
        self.send_header("Content-Type", "application/json")
        self.send_header("Content-Length", str(len(body)))
        self.end_headers()
        self.wfile.write(body)

    def do_POST(self):
        if self.path != "/v1/executions":
            return self.reply(404, {})
        supplied = self.headers.get("Authorization", "").encode()
        if not hmac.compare_digest(supplied, self.server.authorization):
            return self.reply(401, {})
        try:
            size = int(self.headers.get("Content-Length", "0"))
            if not 0 < size <= 800_000:
                return self.reply(413, {})
            payload = json.loads(self.rfile.read(size))
            if not isinstance(payload, dict) or not isinstance(payload.get("code"), str):
                return self.reply(422, {})
            result = execute(ExecutionRequest(
                code=payload["code"],
                stdin=payload.get("stdin", ""),
                mode=payload.get("mode", "stdin_stdout"),
                func_args=payload.get("func_args")
            ))
        except (ValueError, TypeError):
            return self.reply(422, {})
        except ExecutionUnavailable as exc:
            self.log_error("Executor indisponível: %s", exc)
            return self.reply(503, {"error": "execution_unavailable"})
        self.reply(200, {
            "status": result.status,
            "stdout": result.stdout,
            "stderr": result.stderr,
            "exitCode": result.exit_code,
            "result": result.result
        })


def configured_token():
    token = os.environ.get("EXECUTOR_API_TOKEN", "").strip()
    if token:
        return token

    # Em desenvolvimento os dois serviços compartilham o segredo local do Symfony.
    path = Path(__file__).resolve().parents[3] / "backend" / ".env.local"
    if path.is_file():
        for line in reversed(path.read_text(encoding="utf-8-sig").splitlines()):
            match = re.fullmatch(
                r"""\s*(?:export\s+)?EXECUTOR_API_TOKEN\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s'"]+))(?:\s+#.*)?\s*""",
                line,
            )
            if match:
                return next(value for value in match.groups() if value is not None)
    return None


if __name__ == "__main__":
    token = configured_token()
    if not token:
        raise SystemExit("Defina EXECUTOR_API_TOKEN no ambiente ou em backend/.env.local.")
    with HTTPServer((os.environ.get("EXECUTOR_HOST", "127.0.0.1"), int(os.environ.get("EXECUTOR_PORT", "8001"))), Handler) as server:
        server.authorization = ("Bearer " + token).encode()
        server.serve_forever()
