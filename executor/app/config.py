"""Limites definidos pelo serviço, nunca pelo código do aluno."""

from dataclasses import dataclass


@dataclass(frozen=True)
class ExecutionLimits:
    wall_time_seconds: int = 5
    memory_megabytes: int = 128
    output_bytes: int = 65_536
    code_bytes: int = 65_536
    input_bytes: int = 65_536
    processes: int = 16

    def __post_init__(self) -> None:
        bounds = {
            "wall_time_seconds": (1, 30), "memory_megabytes": (32, 512),
            "output_bytes": (1, 1_048_576), "code_bytes": (1, 262_144),
            "input_bytes": (1, 262_144), "processes": (1, 64),
        }
        for name, (minimum, maximum) in bounds.items():
            value = getattr(self, name)
            if type(value) is not int or not minimum <= value <= maximum:
                raise ValueError(f"Limite inválido: {name}")
