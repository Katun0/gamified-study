<?php

namespace App\Tests\Controller;

use App\Controller\ProblemCheckController;
use App\Entity\Lesson;
use App\Entity\Problem;
use App\Execution\CodeExecutorInterface;
use PHPUnit\Framework\Attributes\DataProvider;
use PHPUnit\Framework\TestCase;
use Symfony\Component\HttpFoundation\Request;

final class ProblemCheckControllerTest extends TestCase
{
    public static function outputs(): array
    {
        return [
            ["Olá\r\n", 'completed', 'accepted'],
            ["Olá \n", 'completed', 'wrong_answer'],
            ["Olá\n\n", 'completed', 'wrong_answer'],
            ["Olá\n", 'runtime_error', 'runtime_error'],
        ];
    }

    #[DataProvider('outputs')]
    public function testUsesStoredCase(string $actual, string $status, string $expectedStatus): void
    {
        $problem = new Problem(new Lesson(), 'Print', 'Repita a entrada');
        $problem->configureTest("Olá\n", 'Olá');
        $executor = $this->createMock(CodeExecutorInterface::class);
        $executor->expects(self::once())->method('execute')->with('print(input())', "Olá\n")
            ->willReturn(['status' => $status, 'stdout' => $actual, 'stderr' => '', 'exitCode' => 0]);
        $request = Request::create('/', 'POST', content: '{"code":"print(input())","expected":"ignorado"}');
        $response = (new ProblemCheckController())->check($problem, $request, $executor);
        self::assertSame($expectedStatus, json_decode($response->getContent(), true)['status']);
    }
}
