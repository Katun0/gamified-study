<?php

namespace App\Entity;

enum ProblemDifficulty: string
{
    case Easy = 'easy';
    case Medium = 'medium';
    case Hard = 'hard';

    public function xp(): int
    {
        return match ($this) {
            self::Easy => 50,
            self::Medium => 100,
            self::Hard => 200,
        };
    }
}
