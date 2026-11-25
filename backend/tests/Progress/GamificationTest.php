<?php

namespace App\Tests\Progress;

use App\Progress\Gamification;
use App\Controller\GamificationController;
use App\Entity\User;
use Doctrine\DBAL\Connection;
use Doctrine\ORM\EntityManagerInterface;
use PHPUnit\Framework\TestCase;
use Symfony\Component\HttpFoundation\Request;

final class GamificationTest extends TestCase
{
    public function testStreakHandlesGapsDuplicatesAndYearBoundary(): void
    {
        $dates = ['2025-12-30', '2025-12-31', '2026-01-01', '2026-01-01', '2026-01-03', '2026-01-04', '2026-01-10'];
        $result = Gamification::streak($dates, '2026-01-04');
        self::assertSame(2, $result['current']);
        self::assertSame(3, $result['best']);
        self::assertTrue($result['activeToday']);
        self::assertCount(7, $result['week']);
        self::assertSame(['date' => '2026-01-04', 'active' => true, 'today' => true], $result['week'][6]);
        self::assertSame('2025-12-29', $result['week'][0]['date']);
        self::assertSame(2, Gamification::streak($dates, '2026-01-05')['current']);
        self::assertFalse(Gamification::streak($dates, '2026-01-05')['activeToday']);
        self::assertSame(0, Gamification::streak($dates, '2026-01-06')['current']);
        self::assertSame(0, Gamification::streak([], '2026-01-06')['best']);
        self::assertSame(0, Gamification::streak([], '2026-01-06')['current']);
    }

    public function testMilestonesHaveClearThresholds(): void
    {
        self::assertSame([], Gamification::milestones(0, 0, 0));
        self::assertSame(['first_problem'], array_column(Gamification::milestones(1, 0, 1), 'code'));
        self::assertSame(['first_problem', 'first_lesson'], array_column(Gamification::milestones(9, 1, 6), 'code'));
        self::assertCount(4, Gamification::milestones(10, 1, 7));
        self::assertCount(4, Gamification::milestones(100, 20, 30));
    }

    public function testGoalCannotBeForgedOrOutsideSupportedRange(): void
    {
        $em = $this->createMock(EntityManagerInterface::class);
        $em->expects(self::never())->method('flush');
        $gamification = new Gamification($this->createStub(Connection::class));
        $user = new User();
        foreach ([null, '2', true, 0, 4, -1, [], 1.5] as $goal) {
            $response = (new GamificationController())->goal(Request::create('/', 'PUT', content: json_encode(['goal' => $goal])), $user, $em, $gamification);
            self::assertSame(422, $response->getStatusCode());
            self::assertSame(1, $user->getDailyGoal());
        }
    }
}
