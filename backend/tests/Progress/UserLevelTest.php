<?php

namespace App\Tests\Progress;

use App\Progress\UserLevel;
use PHPUnit\Framework\Attributes\DataProvider;
use PHPUnit\Framework\TestCase;

final class UserLevelTest extends TestCase
{
    public static function thresholds(): array
    {
        return [[0, 1, 0, 200], [199, 1, 199, 200], [200, 2, 0, 300],
            [499, 2, 299, 300], [500, 3, 0, 400], [900, 4, 0, 500],
            [3500, 8, 0, 900], [4400, 9, 0, 1000], [-1, 1, 0, 200]];
    }

    #[DataProvider('thresholds')]
    public function testProgression(int $xp, int $level, int $earned, int $required): void
    {
        $result = UserLevel::describe($xp);
        self::assertSame($level, $result['level']);
        self::assertSame($earned, $result['xpInLevel']);
        self::assertSame($required, $result['xpForNextLevel']);
        self::assertSame($required - $earned, $result['xpRemaining']);
        self::assertSame(max(0, $xp) + $result['xpRemaining'], $result['nextLevelTotalXp']);
        self::assertGreaterThanOrEqual(0, $result['progressPercent']);
        self::assertLessThan(100, $result['progressPercent']);
    }
}
