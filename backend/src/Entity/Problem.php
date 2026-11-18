<?php

namespace App\Entity;

use Doctrine\ORM\Mapping as ORM;

#[ORM\Entity]
#[ORM\Table(name: 'problems')]
class Problem
{
    #[ORM\Id]
    #[ORM\GeneratedValue]
    #[ORM\Column]
    private ?int $id = null;

    #[ORM\ManyToOne(targetEntity: Lesson::class)]
    #[ORM\JoinColumn(nullable: false, onDelete: 'CASCADE')]
    private Lesson $lesson;

    #[ORM\Column(length: 255)]
    private string $title;

    #[ORM\Column(type: 'text')]
    private string $statement;

    #[ORM\Column(length: 10, enumType: ProblemDifficulty::class, options: ['default' => 'easy'])]
    private ProblemDifficulty $difficulty = ProblemDifficulty::Easy;

    public function getDifficulty(): ProblemDifficulty { return $this->difficulty; }

    public function setDifficulty(ProblemDifficulty $difficulty): void
    {
        $this->difficulty = $difficulty;
    }

    #[ORM\Column(type: 'text', nullable: true)]
    private ?string $expectedOutput = null;

    #[ORM\Column(type: 'text', nullable: true)]
    private ?string $testInput = null;

    public function configureTest(string $input, string $expected): void
    {
        $this->testInput = $input;
        $this->expectedOutput = $expected;
    }

    public function getExpectedOutput(): ?string { return $this->expectedOutput; }
    public function getTestInput(): string { return $this->testInput ?? ''; }

    #[ORM\Column]
    private \DateTimeImmutable $createdAt;

    public function __construct(Lesson $lesson, string $title, string $statement)
    {
        $this->lesson = $lesson;
        $this->title = $title;
        $this->statement = $statement;
        $this->createdAt = new \DateTimeImmutable();
    }

    public function getId(): ?int { return $this->id; }
    public function getLesson(): Lesson { return $this->lesson; }
    public function getTitle(): string { return $this->title; }
    public function getStatement(): string { return $this->statement; }
    public function getCreatedAt(): \DateTimeImmutable { return $this->createdAt; }
}
