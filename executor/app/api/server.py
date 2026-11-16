"""Adaptador HTTP local. Processa uma execução por vez."""

import hmac
import json
import os
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
            result = execute(ExecutionRequest(payload["code"], payload.get("stdin", "")))
        except (ValueError, TypeError):
            return self.reply(422, {})
        except ExecutionUnavailable as exc:
            self.log_error("Executor indisponível: %s", exc)
            return self.reply(503, {"error": "execution_unavailable"})
        self.reply(200, {"status": result.status, "stdout": result.stdout,
                         "stderr": result.stderr, "exitCode": result.exit_code})


if __name__ == "__main__":
    token = os.environ.get("EXECUTOR_API_TOKEN")
    if not token:
        raise SystemExit("Defina EXECUTOR_API_TOKEN antes de iniciar.")
    with HTTPServer(("127.0.0.1", int(os.environ.get("EXECUTOR_PORT", "8001"))), Handler) as server:
        server.authorization = ("Bearer " + token).encode()
        server.serve_forever()
