from typing import Protocol

from app.config import ExecutionLimits
from app.schemas.execution import ExecutionRequest, ExecutionResult


class ExecutionUnavailable(RuntimeError):
    """A infraestrutura não pode executar código; não é erro do aluno."""


class SandboxRunner(Protocol):
    def run(self, request: ExecutionRequest, limits: ExecutionLimits) -> ExecutionResult: ...


class UnavailableRunner:
    def run(self, request: ExecutionRequest, limits: ExecutionLimits) -> ExecutionResult:
        raise ExecutionUnavailable("A execução está desabilitada nesta configuração.")
