<?php

namespace App\Tests\Progress;

use App\Entity\Courses;
use App\Entity\Lesson;
use App\Entity\Problem;
use App\Entity\User;
use App\Progress\StudyProgress;
use App\Controller\ProblemCheckController;
use App\Execution\CodeExecutorInterface;
use Doctrine\DBAL\Connection;
use PHPUnit\Framework\TestCase;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpKernel\Exception\AccessDeniedHttpException;

final class StudyProgressTest extends TestCase
{
    private function progress(array $rows): StudyProgress
    {
        $connection = $this->createStub(Connection::class);
        $connection->method('fetchAllAssociative')->willReturn($rows);
        return new StudyProgress($connection);
    }

    public function testSequenceAndReadingLessons(): void
    {
        $rows = [
            ['id' => 1, 'problem_id' => 1, 'solved_id' => 1, 'read_id' => null],
            ['id' => 1, 'problem_id' => 2, 'solved_id' => null, 'read_id' => null],
            ['id' => 2, 'problem_id' => null, 'solved_id' => null, 'read_id' => null],
            ['id' => 3, 'problem_id' => 3, 'solved_id' => null, 'read_id' => null],
        ];
        $user = new User();
        $state = $this->progress($rows)->course(1, $user);
        self::assertFalse($state[1]['completed']);
        self::assertFalse($state[1]['problems'][2]['locked']);
        self::assertTrue($state[2]['locked']);
        self::assertTrue($state[3]['locked']);
        $rows[1]['solved_id'] = 2;
        $state = $this->progress($rows)->course(1, $user);
        self::assertTrue($state[1]['completed']);
        self::assertFalse($state[2]['locked']);
        self::assertTrue($state[3]['locked']);
        $rows[2]['read_id'] = 2;
        $state = $this->progress($rows)->course(1, $user);
        self::assertTrue($state[2]['completed']);
        self::assertFalse($state[3]['locked']);
    }

    public function testNewUserAndAdministrator(): void
    {
        $rows = [
            ['id' => 1, 'problem_id' => 1, 'solved_id' => null, 'read_id' => null],
            ['id' => 1, 'problem_id' => 2, 'solved_id' => null, 'read_id' => null],
            ['id' => 2, 'problem_id' => 3, 'solved_id' => null, 'read_id' => null],
        ];
        $progress = $this->progress($rows);
        $state = $progress->course(1, new User());
        self::assertFalse($state[1]['locked']);
        self::assertTrue($state[1]['problems'][2]['locked']);
        self::assertTrue($state[2]['locked']);
        $state = $progress->course(1, (new User())->setRoles(['ROLE_ADMIN']));
        self::assertFalse($state[1]['problems'][2]['locked']);
        self::assertFalse($state[2]['locked']);
        self::assertFalse($state[2]['completed']);
    }

    public function testLockedProblemCannotCallExecutor(): void
    {
        $course = new Courses();
        (new \ReflectionProperty(Courses::class, 'id'))->setValue($course, 1);
        $lesson = (new Lesson())->setCourse($course);
        (new \ReflectionProperty(Lesson::class, 'id'))->setValue($lesson, 1);
        $problem = new Problem($lesson, 'Locked', 'Locked');
        (new \ReflectionProperty(Problem::class, 'id'))->setValue($problem, 2);
        $progress = $this->progress([
            ['id' => 1, 'problem_id' => 1, 'solved_id' => null, 'read_id' => null],
            ['id' => 1, 'problem_id' => 2, 'solved_id' => null, 'read_id' => null],
        ]);
        $executor = $this->createMock(CodeExecutorInterface::class);
        $executor->expects(self::never())->method('execute');
        $this->expectException(AccessDeniedHttpException::class);
        (new ProblemCheckController())->check($problem, Request::create('/', 'POST', content: '{"code":"print(1)"}'), $executor, $progress, new User());
    }
}
