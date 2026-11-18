<?php

namespace App\Execution;

/** Contrato do futuro cliente HTTP. Ainda não possui implementação nem consumidores. */
interface CodeExecutorInterface
{
    /**
     * @return array{status: string, stdout: string, stderr: string, exitCode: int|null, result: mixed}
     * @throws \RuntimeException Em falhas de infraestrutura, sem reprovar o aluno.
     */
    public function execute(string $code, string $stdin = '', string $mode = 'stdin_stdout', ?array $funcArgs = null): array;
}
