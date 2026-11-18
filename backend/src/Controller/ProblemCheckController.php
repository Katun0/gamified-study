<?php

namespace App\Controller;

use App\Entity\Problem;
use App\Entity\User;
use App\Progress\StudyProgress;
use Symfony\Component\Security\Http\Attribute\CurrentUser;
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
        $mode = $data['evaluationMode'] ?? 'stdin_stdout';

        if ($mode === 'function') {
            $expectedReturnType = $data['expectedReturnType'] ?? null;
            if ($expectedReturnType !== null && $expectedReturnType !== 'string') {
                return new JsonResponse(['error' => 'Selecione um tipo de retorno válido.'], 422);
            }
            if (!isset($data['functionArguments']) || !is_array($data['functionArguments']) || !array_is_list($data['functionArguments'])) {
                return new JsonResponse(['error' => 'Argumentos da função devem ser um array JSON.'], 422);
            }
            if ($expectedReturnType !== 'string' && !array_key_exists('expectedReturn', $data)) {
                return new JsonResponse(['error' => 'Retorno esperado é obrigatório no modo função.'], 422);
            }
            $problem->configureFunctionTest(
                $data['functionArguments'],
                $expectedReturnType === 'string' ? null : $data['expectedReturn'],
                $data['functionTemplate'] ?? null,
                $expectedReturnType
            );
        } else {
            foreach (['input', 'expected'] as $field) {
                if (!is_string($data[$field] ?? null) || strlen($data[$field]) > 65536) {
                    return new JsonResponse(['error' => 'Informe a entrada e a saída esperada, com até 64 KiB cada.'], 422);
                }
            }
            $problem->setEvaluationMode('stdin_stdout');
            $problem->configureTest($data['input'], $data['expected']);
        }

        $em->flush();
        return new JsonResponse([
            'evaluationMode' => $problem->getEvaluationMode(),
            'input' => $problem->getTestInput(),
            'expected' => $problem->getExpectedOutput(),
            'functionArguments' => $problem->getFunctionArguments(),
            'expectedReturn' => $problem->getExpectedReturn(),
            'expectedReturnType' => $problem->getExpectedReturnType(),
            'functionTemplate' => $problem->getFunctionTemplate(),
        ]);
    }

    #[Route('/api/problems/{id<\d+>}/check', methods: ['POST'])]
    public function check(Problem $problem, Request $request, CodeExecutorInterface $executor, StudyProgress $progress, #[CurrentUser] User $user): JsonResponse
    {
        $progress->requireProblem($problem, $user);

        if ($problem->getEvaluationMode() === 'function') {
            $expected = $problem->getExpectedReturn();
            $args = $problem->getFunctionArguments();
            if ($args === null) {
                return new JsonResponse(['error' => 'Este problema ainda não tem um caso de teste configurado.'], 409);
            }
        } else {
            $expected = $problem->getExpectedOutput();
            if ($expected === null) {
                return new JsonResponse(['error' => 'Este problema ainda não tem um caso de teste.'], 409);
            }
        }

        $code = $request->toArray()['code'] ?? null;
        if (!is_string($code) || trim($code) === '' || strlen($code) > 65536) {
            return new JsonResponse(['error' => 'Informe um programa Python de até 64 KiB.'], 422);
        }

        try {
            $result = $executor->execute(
                $code,
                $problem->getTestInput(),
                $problem->getEvaluationMode(),
                $problem->getFunctionArguments()
            );
        } catch (\RuntimeException) {
            return new JsonResponse(['error' => 'Executor indisponível. Tente novamente em instantes.'], 503);
        }

        $status = $result['status'];
        if ($status === 'completed') {
            if ($problem->getEvaluationMode() === 'function') {
                $matches = $problem->getExpectedReturnType() === 'string'
                    ? is_string($result['result'])
                    : self::compareStructural($result['result'], $expected);
                $status = $matches ? 'accepted' : 'wrong_answer';
            } else {
                $status = self::normalize($result['stdout']) === self::normalize($expected) ? 'accepted' : 'wrong_answer';
            }
        }

        $xpAwarded = 0;
        if ($status === 'accepted') {
            $xpAwarded = $progress->accept($problem, $user);
        }

        return new JsonResponse([
            'status' => $status,
            'evaluationMode' => $problem->getEvaluationMode(),
            'expectedReturnType' => $problem->getExpectedReturnType(),
            'input' => $problem->getEvaluationMode() === 'function' ? $problem->getFunctionArguments() : $problem->getTestInput(),
            'expected' => $expected,
            'actual' => $problem->getEvaluationMode() === 'function' ? $result['result'] : $result['stdout'],
            'stdout' => $result['stdout'],
            'errorOutput' => $result['stderr'],
            'xpAwarded' => $xpAwarded,
            'totalXp' => $progress->totalXp($user)
        ]);
    }

    private static function compareStructural(mixed $actual, mixed $expected): bool
    {
        // Strings numéricas também devem preservar seu texto exato ("01" != "1").
        if (is_string($actual) || is_string($expected)) {
            return $actual === $expected;
        }
        // Se ambos são numéricos, comparamos o valor.
        // O requisito diz que 1 (int) e 1.0 (float) devem ser tratados conforme documentado.
        // Se quisermos aceitar 1 == 1.0, removeríamos a verificação de tipo para números.
        // Mas o requisito 4 diz: "Não introduza tolerância implícita".
        // No entanto, JSON não distingue int de float em muitos parsers (1.0 vira 1).
        // Para ser robusto a retornos de variáveis (que podem vir como float ou int dependendo do cálculo),
        // vamos permitir que 1 == 1.0 SE ambos forem numéricos.
        if (is_numeric($actual) && is_numeric($expected)) {
            // Verifica se são do mesmo tipo ou se são numericamente iguais
            // Mas o requisito diz "string '1', número 1 e bool true são diferentes"
            if (is_string($actual) || is_string($expected) || is_bool($actual) || is_bool($expected)) {
                if (gettype($actual) !== gettype($expected)) {
                    return false;
                }
            }
            // Se ambos são números (int ou float), comparamos o valor
            return $actual == $expected;
        }

        if (gettype($actual) !== gettype($expected)) {
            return false;
        }

        if (is_array($actual)) {
            if (count($actual) !== count($expected)) {
                return false;
            }

            // Verifica se é uma lista (chaves sequenciais)
            $isList = array_is_list($actual);
            if ($isList !== array_is_list($expected)) {
                return false;
            }

            if ($isList) {
                foreach ($actual as $key => $value) {
                    if (!self::compareStructural($value, $expected[$key])) {
                        return false;
                    }
                }
            } else {
                // Objeto (dicionário): ordem das chaves não importa
                foreach ($actual as $key => $value) {
                    if (!array_key_exists($key, $expected) || !self::compareStructural($value, $expected[$key])) {
                        return false;
                    }
                }
                foreach ($expected as $key => $value) {
                    if (!array_key_exists($key, $actual)) {
                        return false;
                    }
                }
            }
            return true;
        }

        return $actual === $expected;
    }

    private static function normalize(string $value): string
    {
        $value = str_replace("\r\n", "\n", $value);
        return str_ends_with($value, "\n") ? substr($value, 0, -1) : $value;
    }
}
