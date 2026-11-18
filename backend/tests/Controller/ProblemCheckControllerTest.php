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
use Doctrine\ORM\EntityManagerInterface;
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
            ['id' => 1, 'difficulty' => 'easy', 'problem_id' => 1, 'solved_id' => null, 'read_id' => null],
        ]);
        $connection->expects($expectedStatus === 'accepted' ? self::exactly(2) : self::never())->method('executeStatement');
        $connection->method('transactional')->willReturnCallback(fn (callable $operation) => $operation($connection));
        $connection->method('fetchFirstColumn')->willReturn(['easy']);
        $connection->method('fetchOne')->willReturnCallback(static function (string $sql) use ($expectedStatus): int {
            if (str_contains($sql, 'FOR UPDATE')) return 1;
            return $expectedStatus === 'accepted' ? 50 : 0;
        });
        $problem->configureTest("Olá\n", 'Olá');
        $executor = $this->createMock(CodeExecutorInterface::class);
        $executor->expects(self::once())->method('execute')->with('print(input())', "Olá\n")
            ->willReturn(['status' => $status, 'stdout' => $actual, 'stderr' => '', 'exitCode' => 0]);
        $request = Request::create('/', 'POST', content: '{"code":"print(input())","expected":"ignorado"}');
        $response = (new ProblemCheckController())->check($problem, $request, $executor, new StudyProgress($connection), new User());
        self::assertSame($expectedStatus, json_decode($response->getContent(), true)['status']);
        self::assertSame($expectedStatus === 'accepted' ? 50 : 0, json_decode($response->getContent(), true)['xpAwarded']);
        self::assertSame($expectedStatus === 'accepted' ? 50 : 0, json_decode($response->getContent(), true)['totalXp']);
    }
    private function testFunctionMode(mixed $args, mixed $expectedReturn, mixed $actualReturn, string $expectedStatus, ?string $expectedReturnType = null): void
    {
        $course = new Courses();
        (new \ReflectionProperty(Courses::class, 'id'))->setValue($course, 1);
        $lesson = (new Lesson())->setCourse($course);
        (new \ReflectionProperty(Lesson::class, 'id'))->setValue($lesson, 1);
        $problem = new Problem($lesson, 'Soma', 'Some dois números');
        (new \ReflectionProperty(Problem::class, 'id'))->setValue($problem, 2);

        $problem->configureFunctionTest($args, $expectedReturn, 'def solution(a, b):', $expectedReturnType);

        $connection = $this->createMock(Connection::class);
        $connection->method('fetchAllAssociative')->willReturn([
            ['id' => 1, 'difficulty' => 'easy', 'problem_id' => 2, 'solved_id' => null, 'read_id' => null],
        ]);
        $connection->method('transactional')->willReturnCallback(fn (callable $operation) => $operation($connection));
        $connection->method('fetchFirstColumn')->willReturn(['easy']);
        $connection->method('fetchOne')->willReturn(50);

        $executor = $this->createMock(CodeExecutorInterface::class);
        $executor->expects(self::once())->method('execute')
            ->with('def solution(a, b):\n    return a + b', '', 'function', $args)
            ->willReturn(['status' => 'completed', 'stdout' => '', 'stderr' => '', 'exitCode' => 0, 'result' => $actualReturn]);

        $request = Request::create('/', 'POST', content: json_encode(['code' => 'def solution(a, b):\n    return a + b']));
        $response = (new ProblemCheckController())->check($problem, $request, $executor, new StudyProgress($connection), new User());

        $data = json_decode($response->getContent(), true);
        self::assertSame($expectedStatus, $data['status']);
        self::assertSame($expectedReturnType, $data['expectedReturnType']);
    }

    public static function functionTestCases(): array
    {
        return [
            [[1, 2], 3, 3, 'accepted'],
            [[1, 2], 3, 4, 'wrong_answer'],
            [['a'], 'a', 'a', 'accepted'],
            [[[1]], [1], [1], 'accepted'],
            [[['a' => 1]], ['a' => 1], ['a' => 1], 'accepted'],
            [[['a' => 1, 'b' => 2]], ['b' => 2, 'a' => 1], ['a' => 1, 'b' => 2], 'accepted'], // Ordem de chaves não importa
        ];
    }

    public static function stringReturnTestCases(): array
    {
        return [
            ['', 'accepted'],
            ['Olá, mundo', 'accepted'],
            ['áé漢字', 'accepted'],
            ['123', 'accepted'],
            [123, 'wrong_answer'],
            [1.5, 'wrong_answer'],
            [true, 'wrong_answer'],
            [false, 'wrong_answer'],
            [null, 'wrong_answer'],
            [[], 'wrong_answer'],
            [['texto'], 'wrong_answer'],
        ];
    }

    #[DataProvider('stringReturnTestCases')]
    public function testFunctionModeCanRequireStringReturn(mixed $actualReturn, string $expectedStatus): void
    {
        $this->testFunctionMode([], null, $actualReturn, $expectedStatus, 'string');
    }

    public function testCanConfigureStringReturnAndSwitchBackToExactValue(): void
    {
        $course = new Courses();
        (new \ReflectionProperty(Courses::class, 'id'))->setValue($course, 1);
        $lesson = (new Lesson())->setCourse($course);
        $problem = new Problem($lesson, 'Texto', 'Retorne uma string');
        $em = $this->createMock(EntityManagerInterface::class);
        $em->expects(self::exactly(2))->method('flush');
        $controller = new ProblemCheckController();

        $stringResponse = $controller->configure($problem, Request::create('/', 'PUT', content: '{"evaluationMode":"function","functionArguments":[],"expectedReturnType":"string"}'), $em);
        self::assertSame(200, $stringResponse->getStatusCode());
        self::assertSame('string', $problem->getExpectedReturnType());
        self::assertSame('string', json_decode($stringResponse->getContent(), true)['expectedReturnType']);

        $exactResponse = $controller->configure($problem, Request::create('/', 'PUT', content: '{"evaluationMode":"function","functionArguments":[],"expectedReturn":null}'), $em);
        self::assertSame(200, $exactResponse->getStatusCode());
        self::assertNull($problem->getExpectedReturnType());
        self::assertNull($problem->getExpectedReturn());
    }

    public function testRejectsInvalidStringReturnConfiguration(): void
    {
        $course = new Courses();
        (new \ReflectionProperty(Courses::class, 'id'))->setValue($course, 1);
        $lesson = (new Lesson())->setCourse($course);
        $problem = new Problem($lesson, 'Texto', 'Retorne uma string');
        $em = $this->createMock(EntityManagerInterface::class);
        $em->expects(self::never())->method('flush');

        $response = (new ProblemCheckController())->configure(
            $problem,
            Request::create('/', 'PUT', content: '{"evaluationMode":"function","functionArguments":[],"expectedReturnType":"number"}'),
            $em
        );

        self::assertSame(422, $response->getStatusCode());
        self::assertNull($problem->getExpectedReturnType());
    }

    #[DataProvider('functionTestCases')]
    public function testFunctionModeDataProvider(mixed $args, mixed $expectedReturn, mixed $actualReturn, string $expectedStatus): void
    {
        $this->testFunctionMode($args, $expectedReturn, $actualReturn, $expectedStatus);
    }
}
