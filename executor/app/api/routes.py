"""Ponto de integração futuro de POST /v1/executions.

A camada HTTP deverá autenticar e validar a requisição antes de chamar o serviço.
ExecutionUnavailable deverá resultar em HTTP 503, nunca em resposta incorreta.
Nenhuma rota HTTP está registrada nesta etapa.
"""

from app.config import ExecutionLimits
from app.sandbox.docker_runner import DockerSandboxRunner
from app.schemas.execution import ExecutionRequest, ExecutionResult
from app.services.execution import ExecutionService


def execute(request: ExecutionRequest) -> ExecutionResult:
    service = ExecutionService(DockerSandboxRunner(), ExecutionLimits())
    return service.execute(request)
