<?php

namespace App\Controller;

use App\Entity\Problem;
use App\Execution\CodeExecutorInterface;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\Routing\Attribute\Route;

final class ProblemCheckController
{
    #[Route('/api/problems/{id<\d+>}/test-case', methods: ['PUT'])]
    public function configure(Problem $problem, Request $request, EntityManagerInterface $em): JsonResponse
    {
        $data = $request->toArray();
        foreach (['input', 'expected'] as $field) {
            if (!is_string($data[$field] ?? null) || strlen($data[$field]) > 65536) {
                return new JsonResponse(['error' => 'Informe a entrada e a saída esperada, com até 64 KiB cada.'], 422);
            }
        }
        $problem->configureTest($data['input'], $data['expected']);
        $em->flush();
        return new JsonResponse(['input' => $problem->getTestInput(), 'expected' => $problem->getExpectedOutput()]);
    }

    #[Route('/api/problems/{id<\d+>}/check', methods: ['POST'])]
    public function check(Problem $problem, Request $request, CodeExecutorInterface $executor): JsonResponse
    {
        $expected = $problem->getExpectedOutput();
        if ($expected === null) {
            return new JsonResponse(['error' => 'Este problema ainda não tem um caso de teste.'], 409);
        }
        $code = $request->toArray()['code'] ?? null;
        if (!is_string($code) || trim($code) === '' || strlen($code) > 65536) {
            return new JsonResponse(['error' => 'Informe um programa Python de até 64 KiB.'], 422);
        }
        try {
            $result = $executor->execute($code, $problem->getTestInput());
        } catch (\RuntimeException) {
            return new JsonResponse(['error' => 'Executor indisponível. Tente novamente em instantes.'], 503);
        }
        $status = $result['status'];
        if ($status === 'completed') {
            $status = self::normalize($result['stdout']) === self::normalize($expected) ? 'accepted' : 'wrong_answer';
        }
        return new JsonResponse(['status' => $status, 'input' => $problem->getTestInput(), 'expected' => $expected,
            'actual' => $result['stdout'], 'errorOutput' => $result['stderr']]);
    }

    private static function normalize(string $value): string
    {
        $value = str_replace("\r\n", "\n", $value);
        return str_ends_with($value, "\n") ? substr($value, 0, -1) : $value;
    }
}
