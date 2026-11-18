<?php

namespace App\Tests\Controller;

use App\Controller\ProblemController;
use App\Entity\Lesson;
use App\Entity\Courses;
use App\Entity\User;
use App\Progress\StudyProgress;
use Doctrine\DBAL\Connection;
use App\Entity\Problem;
use Doctrine\ORM\EntityManagerInterface;
use Doctrine\ORM\EntityRepository;
use PHPUnit\Framework\Attributes\DataProvider;
use PHPUnit\Framework\TestCase;
use Symfony\Component\HttpFoundation\Request;

final class ProblemControllerTest extends TestCase
{
    public static function invalidBodies(): array
    {
        return [['{', 400], ['null', 422], ['[]', 422],
            [json_encode(['lessonId' => 1, 'title' => ' ', 'statement' => 'Text']), 422],
            [json_encode(['lessonId' => 1, 'title' => str_repeat('a', 256), 'statement' => 'Text']), 422],
            [json_encode(['lessonId' => -1, 'title' => 'Print', 'statement' => 'Text']), 422],
            [json_encode(['lessonId' => 1, 'title' => ['Print'], 'statement' => 'Text']), 422],
            [json_encode(['lessonId' => 1, 'title' => 'Print', 'statement' => '  ']), 422]];
    }

    #[DataProvider('invalidBodies')]
    public function testInvalidInputIsRejectedBeforeWriting(string $body, int $status): void
    {
        $em = $this->createMock(EntityManagerInterface::class);
        $em->expects(self::never())->method('persist');
        $response = (new ProblemController())->create(Request::create('/api/problems', 'POST', content: $body), $em);
        self::assertSame($status, $response->getStatusCode());
    }

    public function testMissingLessonIsRejected(): void
    {
        $em = $this->createMock(EntityManagerInterface::class);
        $em->expects(self::once())->method('find')->with(Lesson::class, 99)->willReturn(null);
        $em->expects(self::never())->method('persist');
        $response = (new ProblemController())->create(Request::create('/api/problems', 'POST', content: '{"lessonId":99,"title":"Print","statement":"Hello World"}'), $em);
        self::assertSame(404, $response->getStatusCode());
    }

    public function testMultipleProblemsCanBelongToOneLesson(): void
    {
        $lesson = new Lesson();
        $em = $this->createMock(EntityManagerInterface::class);
        $em->method('find')->willReturn($lesson);
        $saved = [];
        $em->expects(self::exactly(2))->method('persist')->willReturnCallback(function (Problem $problem) use (&$saved): void { $saved[] = $problem; });
        $em->expects(self::exactly(2))->method('flush');
        $controller = new ProblemController();
        foreach (['Hello World', 'Olá na tela'] as $statement) {
            $response = $controller->create(Request::create('/api/problems', 'POST', content: json_encode(['lessonId' => 1, 'title' => ' Print ', 'statement' => $statement])), $em);
            self::assertSame(201, $response->getStatusCode());
        }
        self::assertSame($lesson, $saved[0]->getLesson());
        self::assertSame($lesson, $saved[1]->getLesson());
        self::assertSame('Print', $saved[0]->getTitle());
        self::assertSame('Olá na tela', $saved[1]->getStatement());
    }

    public function testListOnlyReturnsProblemsOfRequestedLessonInCreationOrder(): void
    {
        $course = new Courses();
        (new \ReflectionProperty(Courses::class, 'id'))->setValue($course, 1);
        $lesson = (new Lesson())->setCourse($course);
        (new \ReflectionProperty(Lesson::class, 'id'))->setValue($lesson, 1);
        $connection = $this->createStub(Connection::class);
        $connection->method('fetchAllAssociative')->willReturn([
            ['id' => 1, 'problem_id' => 0, 'solved_id' => null, 'read_id' => null],
        ]);
        $problem = new Problem($lesson, 'Print', 'Hello World');
        (new \ReflectionProperty(Problem::class, 'id'))->setValue($problem, 0);
        $repository = $this->createMock(EntityRepository::class);
        $repository->expects(self::once())->method('findBy')->with(['lesson' => $lesson], ['id' => 'ASC'])->willReturn([$problem]);
        $em = $this->createStub(EntityManagerInterface::class);
        $em->method('find')->willReturn($lesson);
        $em->method('getRepository')->willReturn($repository);
        $response = (new ProblemController())->list(1, $em, new StudyProgress($connection), new User());
        self::assertSame(200, $response->getStatusCode());
        self::assertCount(1, json_decode($response->getContent(), true));
    }
}
