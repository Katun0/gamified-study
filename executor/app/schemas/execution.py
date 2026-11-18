from dataclasses import dataclass
from typing import Literal, Any


@dataclass(frozen=True)
class ExecutionRequest:
    code: str
    stdin: str = ""
    mode: Literal["stdin_stdout", "function"] = "stdin_stdout"
    func_args: list[Any] | None = None


@dataclass(frozen=True)
class ExecutionResult:
    # Não significa resposta correta: a comparação pertence ao Symfony.
    status: Literal["completed", "runtime_error", "time_limit", "memory_limit", "output_limit"]
    stdout: str
    stderr: str
    exit_code: int | None
    result: Any | None = None
