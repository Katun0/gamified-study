<?php

namespace App\Entity;

use Doctrine\ORM\Mapping as ORM;

#[ORM\Entity]
#[ORM\Table(name: 'problem_progress')]
#[ORM\Index(name: 'idx_progress_problem', columns: ['problem_id'])]
class ProblemProgress
{
    #[ORM\Id]
    #[ORM\ManyToOne(targetEntity: User::class)]
    #[ORM\JoinColumn(nullable: false, onDelete: 'CASCADE')]
    private User $user;

    #[ORM\Id]
    #[ORM\ManyToOne(targetEntity: Problem::class)]
    #[ORM\JoinColumn(nullable: false, onDelete: 'CASCADE')]
    private Problem $problem;

    #[ORM\Column(name: 'completed_at')]
    private \DateTimeImmutable $completedAt;
}
