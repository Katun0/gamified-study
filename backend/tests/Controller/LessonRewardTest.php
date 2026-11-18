<?php

namespace App\Tests\Controller;

use App\Controller\LessonController;
use App\Entity\Lesson;
use Doctrine\ORM\EntityManagerInterface;
use PHPUnit\Framework\TestCase;
use Symfony\Component\HttpFoundation\Request;

final class LessonRewardTest extends TestCase
{
    public function testRewardValidationAndAutomaticReset(): void
    {
        $em = $this->createMock(EntityManagerInterface::class);
        $em->expects(self::exactly(2))->method('flush');
        $controller = new LessonController();
        $lesson = new Lesson();
        foreach ([-1, 1.5, '100', [], 1000001] as $invalid) {
            $response = $controller->updateReward($lesson, Request::create('/', 'PATCH', content: json_encode(['difficulty' => 'hard', 'xpReward' => $invalid])), $em);
            self::assertSame(422, $response->getStatusCode());
        }
        $response = $controller->updateReward($lesson, Request::create('/', 'PATCH', content: '{"difficulty":"invalid","xpReward":100}'), $em);
        self::assertSame(422, $response->getStatusCode());
        foreach ([250, null] as $xp) {
            $response = $controller->updateReward($lesson, Request::create('/', 'PATCH', content: json_encode(['difficulty' => 'hard', 'xpReward' => $xp])), $em);
            self::assertSame(200, $response->getStatusCode());
            self::assertSame($xp, $lesson->getXpReward());
            self::assertSame('hard', $lesson->getDifficulty());
        }
    }
}
