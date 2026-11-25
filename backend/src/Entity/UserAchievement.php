<?php

namespace App\Entity;

use Doctrine\ORM\Mapping as ORM;

#[ORM\Entity]
#[ORM\Table(name: 'user_achievements')]
class UserAchievement
{
    #[ORM\Id]
    #[ORM\ManyToOne(targetEntity: User::class)]
    #[ORM\JoinColumn(nullable: false, onDelete: 'CASCADE')]
    private User $user;

    #[ORM\Id]
    #[ORM\Column(length: 80)]
    private string $code;

    #[ORM\Column(type: 'json')]
    private array $details;

    #[ORM\Column]
    private \DateTimeImmutable $unlockedAt;
}
