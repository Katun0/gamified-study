<?php

namespace App\Progress;

final class UserLevel
{
    // Lições introdutórias: aproximadamente 200 XP (2 fáceis + 1 média).
    public const FIRST_LEVEL_XP = 200;
    public const STEP_XP = 100;

    public static function describe(int $totalXp): array
    {
        $totalXp = max(0, $totalXp);
        $level = 1;
        $start = 0;
        $required = self::FIRST_LEVEL_XP;
        while ($totalXp - $start >= $required) {
            $start += $required;
            $level++;
            $required += self::STEP_XP;
        }
        $earned = $totalXp - $start;
        return [
            'level' => $level,
            'xpInLevel' => $earned,
            'xpForNextLevel' => $required,
            'xpRemaining' => $required - $earned,
            'nextLevelTotalXp' => $start + $required,
            'progressPercent' => (int) floor($earned * 100 / $required),
        ];
    }
}
