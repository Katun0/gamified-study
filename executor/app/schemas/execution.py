from dataclasses import dataclass
from typing import Literal


@dataclass(frozen=True)
class ExecutionRequest:
    code: str
    stdin: str = ""


@dataclass(frozen=True)
class ExecutionResult:
    # Não significa resposta correta: a comparação pertence ao Symfony.
    status: Literal["completed", "runtime_error", "time_limit", "memory_limit", "output_limit"]
    stdout: str
    stderr: str
    exit_code: int | None
