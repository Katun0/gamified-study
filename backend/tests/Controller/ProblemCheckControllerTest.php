<?php

namespace App\Tests\Controller;

use App\Controller\ProblemCheckController;
use App\Entity\Lesson;
use App\Entity\Courses;
use App\Entity\User;
use App\Progress\StudyProgress;
use Doctrine\DBAL\Connection;
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
        $course = new Courses();
        (new \ReflectionProperty(Courses::class, 'id'))->setValue($course, 1);
        $lesson = (new Lesson())->setCourse($course);
        (new \ReflectionProperty(Lesson::class, 'id'))->setValue($lesson, 1);
        $problem = new Problem($lesson, 'Print', 'Repita a entrada');
        (new \ReflectionProperty(Problem::class, 'id'))->setValue($problem, 1);
        $connection = $this->createMock(Connection::class);
        $connection->method('fetchAllAssociative')->willReturn([
            ['id' => 1, 'problem_id' => 1, 'solved_id' => null, 'read_id' => null],
        ]);
        $connection->expects($expectedStatus === 'accepted' ? self::once() : self::never())->method('executeStatement');
        $problem->configureTest("Olá\n", 'Olá');
        $executor = $this->createMock(CodeExecutorInterface::class);
        $executor->expects(self::once())->method('execute')->with('print(input())', "Olá\n")
            ->willReturn(['status' => $status, 'stdout' => $actual, 'stderr' => '', 'exitCode' => 0]);
        $request = Request::create('/', 'POST', content: '{"code":"print(input())","expected":"ignorado"}');
        $response = (new ProblemCheckController())->check($problem, $request, $executor, new StudyProgress($connection), new User());
        self::assertSame($expectedStatus, json_decode($response->getContent(), true)['status']);
    }
}
