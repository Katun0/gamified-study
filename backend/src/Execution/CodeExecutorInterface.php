<?php

namespace App\Execution;

/** Contrato do futuro cliente HTTP. Ainda não possui implementação nem consumidores. */
interface CodeExecutorInterface
{
    /**
     * @return array{status: string, stdout: string, stderr: string, exitCode: int|null}
     * @throws \RuntimeException Em falhas de infraestrutura, sem reprovar o aluno.
     */
    public function execute(string $code, string $stdin = ''): array;
}
