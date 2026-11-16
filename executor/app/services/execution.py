from app.config import ExecutionLimits
from app.sandbox.runner import SandboxRunner
from app.schemas.execution import ExecutionRequest, ExecutionResult


class ExecutionService:
    def __init__(self, runner: SandboxRunner, limits: ExecutionLimits) -> None:
        self.runner = runner
        self.limits = limits

    def execute(self, request: ExecutionRequest) -> ExecutionResult:
        # A camada HTTP futura deverá autenticar antes de chamar este serviço.
        return self.runner.run(request, self.limits)
