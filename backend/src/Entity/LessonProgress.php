<?php

namespace App\Entity;

use Doctrine\ORM\Mapping as ORM;

#[ORM\Entity]
#[ORM\Table(name: 'lesson_progress')]
#[ORM\Index(name: 'idx_progress_lesson', columns: ['lesson_id'])]
class LessonProgress
{
    #[ORM\Id]
    #[ORM\ManyToOne(targetEntity: User::class)]
    #[ORM\JoinColumn(nullable: false, onDelete: 'CASCADE')]
    private User $user;

    #[ORM\Id]
    #[ORM\ManyToOne(targetEntity: Lesson::class)]
    #[ORM\JoinColumn(nullable: false, onDelete: 'CASCADE')]
    private Lesson $lesson;

    #[ORM\Column(name: 'completed_at')]
    private \DateTimeImmutable $completedAt;

    #[ORM\Column(name: 'xp_earned', options: ['default' => 100])]
    private int $xpEarned = 100;
}
