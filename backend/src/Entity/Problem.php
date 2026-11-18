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

    #[ORM\Column(length: 20, options: ['default' => 'stdin_stdout'])]
    private string $evaluationMode = 'stdin_stdout';

    #[ORM\Column(type: 'json', nullable: true)]
    private ?array $functionArguments = null;

    #[ORM\Column(type: 'json', nullable: true)]
    private mixed $expectedReturn = null;

    #[ORM\Column(length: 20, nullable: true)]
    private ?string $expectedReturnType = null;

    #[ORM\Column(type: 'text', nullable: true)]
    private ?string $functionTemplate = null;

    public function configureTest(string $input, string $expected): void
    {
        $this->testInput = $input;
        $this->expectedOutput = $expected;
        $this->expectedReturnType = null;
    }

    public function configureFunctionTest(array $args, mixed $expected, ?string $template = null, ?string $expectedReturnType = null): void
    {
        $this->evaluationMode = 'function';
        $this->functionArguments = $args;
        $this->expectedReturn = $expected;
        $this->expectedReturnType = $expectedReturnType;
        $this->functionTemplate = $template;
    }

    public function getExpectedOutput(): ?string { return $this->expectedOutput; }
    public function getTestInput(): string { return $this->testInput ?? ''; }

    public function getEvaluationMode(): string { return $this->evaluationMode; }
    public function setEvaluationMode(string $mode): void { $this->evaluationMode = $mode; }

    public function getFunctionArguments(): ?array { return $this->functionArguments; }
    public function getExpectedReturn(): mixed { return $this->expectedReturn; }
    public function getExpectedReturnType(): ?string { return $this->expectedReturnType; }
    public function getFunctionTemplate(): ?string { return $this->functionTemplate; }
    public function setFunctionTemplate(?string $template): void { $this->functionTemplate = $template; }

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
