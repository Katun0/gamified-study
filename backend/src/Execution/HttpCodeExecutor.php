<?php

namespace App\Execution;

use Symfony\Contracts\HttpClient\HttpClientInterface;
use Symfony\Contracts\HttpClient\Exception\ExceptionInterface;

final class HttpCodeExecutor implements CodeExecutorInterface
{
    public function __construct(private HttpClientInterface $http, private string $executorUrl, private string $executorToken) {}

    public function execute(string $code, string $stdin = ''): array
    {
        if ($this->executorToken === '') {
            throw new \RuntimeException('Token do executor ausente.');
        }
        try {
            $result = $this->http->request('POST', rtrim($this->executorUrl, '/').'/v1/executions', [
                'auth_bearer' => $this->executorToken, 'json' => ['code' => $code, 'stdin' => $stdin],
                'max_redirects' => 0, 'max_duration' => 45, 'timeout' => 45,
            ])->toArray();
        } catch (ExceptionInterface $e) {
            throw new \RuntimeException('Falha na comunicação com o executor.', previous: $e);
        }
        if (!in_array($result['status'] ?? null, ['completed', 'runtime_error', 'time_limit', 'memory_limit', 'output_limit'], true)
            || !is_string($result['stdout'] ?? null) || !is_string($result['stderr'] ?? null)) {
            throw new \RuntimeException('Resultado inválido do executor.');
        }
        return $result;
    }
}
