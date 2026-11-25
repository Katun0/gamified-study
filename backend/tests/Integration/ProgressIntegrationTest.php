<?php

namespace App\Tests\Integration;

use App\Entity\Courses;
use App\Entity\Lesson;
use App\Entity\Problem;
use App\Entity\User;
use App\Progress\StudyProgress;
use Symfony\Bundle\FrameworkBundle\Test\KernelTestCase;
use Doctrine\ORM\EntityManagerInterface;

final class ProgressIntegrationTest extends KernelTestCase
{
    private EntityManagerInterface $em;
    private StudyProgress $progress;
    private User $user;

    protected function setUp(): void
    {
        self::bootKernel();
        $this->em = self::getContainer()->get(EntityManagerInterface::class);
        $this->progress = self::getContainer()->get(StudyProgress::class);

        $this->em->getConnection()->beginTransaction();

        $this->user = new User();
        $this->user->setName('Test User');
        $this->user->setEmail('test' . uniqid() . '@example.com');
        $this->user->setPassword('password');
        $this->em->persist($this->user);
        $this->em->flush();
    }

    protected function tearDown(): void
    {
        if ($this->em->getConnection()->isTransactionActive()) {
            $this->em->getConnection()->rollBack();
        }
        parent::tearDown();
    }

    public function testGamificationCountsDistinctCompletionsAndKeepsMedals(): void
    {
        $course = (new Courses())->setName('Gamification');
        $lesson = (new Lesson())->setTitle('Missão')->setCourse($course);
        $a = new Problem($lesson, 'A', 'A');
        $b = new Problem($lesson, 'B', 'B');
        foreach ([$course, $lesson, $a, $b] as $entity) $this->em->persist($entity);
        $this->em->flush();
        $gamification = self::getContainer()->get(\App\Progress\Gamification::class);
        $this->user->setDailyGoal(2);
        $this->progress->accept($a, $this->user);
        $this->progress->accept($b, $this->user);
        $first = $gamification->summary($this->user);
        self::assertSame(2, $first['daily']['completed']);
        self::assertTrue($first['daily']['achieved']);
        self::assertContains('course:'.$course->getId(), array_column($first['achievements'], 'code'));
        $xp = $this->progress->totalXp($this->user);
        $this->progress->accept($b, $this->user);
        self::assertSame($xp, $this->progress->totalXp($this->user));
        self::assertSame($first, $gamification->summary($this->user));

        $db = $this->em->getConnection();
        $db->executeStatement('UPDATE problem_progress SET completed_at=? WHERE user_id=? AND problem_id=?', ['2026-11-24 02:59:00', $this->user->getId(), $a->getId()]);
        $db->executeStatement('UPDATE problem_progress SET completed_at=? WHERE user_id=? AND problem_id=?', ['2026-11-24 03:01:00', $this->user->getId(), $b->getId()]);
        $boundary = $gamification->summary($this->user, new \DateTimeImmutable('2026-11-24T04:00:00Z'));
        self::assertSame('2026-11-24', $boundary['daily']['date']);
        self::assertSame(1, $boundary['daily']['completed']);
        self::assertFalse($boundary['daily']['achieved']);
        $newLesson = (new Lesson())->setTitle('Conteúdo novo')->setCourse($course);
        $this->em->persist($newLesson);
        $other = (new User())->setName('Other')->setEmail(uniqid().'@example.com')->setPassword('password');
        $this->em->persist($other);
        $this->em->flush();
        self::assertContains('course:'.$course->getId(), array_column($gamification->summary($this->user)['achievements'], 'code'));
        self::assertSame([], $gamification->summary($other)['achievements']);
        self::assertSame(0, $gamification->summary($other)['daily']['completed']);
    }

    public function testProgressLogic(): void
    {
        $course = new Courses();
        $course->setName('Curso de Teste');
        $this->em->persist($course);

        // L1 tem dois problemas: P1.1 e P1.2
        $lesson1 = (new Lesson())->setTitle('L1')->setContent('C1')->setCourse($course);
        $this->em->persist($lesson1);

        // L2 tem um problema: P2.1
        $lesson2 = (new Lesson())->setTitle('L2')->setContent('C2')->setCourse($course);
        $this->em->persist($lesson2);

        $this->em->flush();

        $p1_1 = new Problem($lesson1, 'P1.1', 'S1.1');
        $this->em->persist($p1_1);
        $p1_2 = new Problem($lesson1, 'P1.2', 'S1.2');
        $this->em->persist($p1_2);

        $p2_1 = new Problem($lesson2, 'P2.1', 'S2.1');
        $this->em->persist($p2_1);

        $this->em->flush();

        // 1. Estado inicial
        $state = $this->progress->course($course->getId(), $this->user);

        self::assertFalse($state[$lesson1->getId()]['locked'], 'L1 deve estar desbloqueada');
        self::assertTrue($state[$lesson2->getId()]['locked'], 'L2 deve estar bloqueada');
        self::assertTrue($state[$lesson1->getId()]['current'], 'L1 deve ser a atual');

        $p1_1_state = $state[$lesson1->getId()]['problems'][$p1_1->getId()];
        $p1_2_state = $state[$lesson1->getId()]['problems'][$p1_2->getId()];

        self::assertFalse($p1_1_state['locked'], 'P1.1 deve estar desbloqueado');
        self::assertTrue($p1_2_state['locked'], 'P1.2 deve estar bloqueado');

        // 2. Resolve P1.1
        self::assertSame(0, $this->progress->accept($p1_1, $this->user));
        $state = $this->progress->course($course->getId(), $this->user);

        self::assertFalse($state[$lesson1->getId()]['problems'][$p1_2->getId()]['locked'], 'P1.2 deve estar desbloqueado agora');
        self::assertTrue($state[$lesson2->getId()]['locked'], 'L2 ainda deve estar bloqueada porque L1 não acabou');

        // 3. Resolve P1.2
        self::assertSame(100, $this->progress->accept($p1_2, $this->user));
        self::assertSame(0, $this->progress->accept($p1_2, $this->user));
        $state = $this->progress->course($course->getId(), $this->user);

        self::assertTrue($state[$lesson1->getId()]['completed'], 'L1 deve estar concluída');
        self::assertSame(100, $state[$lesson1->getId()]['xpEarned']);
        self::assertSame(0, $state[$lesson2->getId()]['xpEarned']);
        self::assertFalse($state[$lesson2->getId()]['locked'], 'L2 deve estar desbloqueada agora');
        self::assertTrue($state[$lesson2->getId()]['current'], 'L2 deve ser a atual agora');

        self::assertFalse($state[$lesson2->getId()]['problems'][$p2_1->getId()]['locked'], 'P2.1 deve estar desbloqueado');
    }

    public function testRequireLessonChecks(): void
    {
        $course = new Courses();
        $course->setName('Curso C2');
        $this->em->persist($course);
        $l1 = (new Lesson())->setTitle('L1')->setCourse($course);
        $this->em->persist($l1);
        $l2 = (new Lesson())->setTitle('L2')->setCourse($course);
        $this->em->persist($l2);
        $this->em->flush();

        // L1 está aberta, L2 está bloqueada
        $this->expectException(\Symfony\Component\HttpKernel\Exception\AccessDeniedHttpException::class);
        $this->progress->requireLesson($l2, $this->user);
    }

    public function testReadingAwardsOnceAndSeparatesUsers(): void
    {
        $course = (new Courses())->setName('Reading XP');
        $lesson = (new Lesson())->setTitle('Read')->setCourse($course);
        $other = (new User())->setName('Other')->setEmail(uniqid().'@example.invalid')->setPassword('unused');
        foreach ([$course, $lesson, $other] as $entity) $this->em->persist($entity);
        $this->em->flush();

        self::assertSame(100, $this->progress->completeReading($lesson, $this->user));
        self::assertSame(0, $this->progress->completeReading($lesson, $this->user));
        self::assertSame(100, $this->progress->lesson($lesson, $this->user)['xpEarned']);
        self::assertSame(0, $this->progress->lesson($lesson, $other)['xpEarned']);
        self::assertSame(100, $this->progress->completeReading($lesson, $other));
    }

    public function testReadingCannotSkipExercisesOrAwardXp(): void
    {
        $course = (new Courses())->setName('Exercise XP');
        $lesson = (new Lesson())->setTitle('Exercise')->setCourse($course);
        $problem = new Problem($lesson, 'Print', 'Print');
        foreach ([$course, $lesson, $problem] as $entity) $this->em->persist($entity);
        $this->em->flush();

        try {
            $this->progress->completeReading($lesson, $this->user);
            self::fail('Exercise lesson accepted as reading');
        } catch (\Symfony\Component\HttpKernel\Exception\ConflictHttpException) {
            self::assertSame(0, $this->progress->lesson($lesson, $this->user)['xpEarned']);
        }
    }

    public function testLockedLessonCannotAwardXp(): void
    {
        $course = (new Courses())->setName('Locked XP');
        $first = (new Lesson())->setTitle('First')->setCourse($course);
        $next = (new Lesson())->setTitle('Next')->setCourse($course);
        foreach ([$course, $first, $next] as $entity) $this->em->persist($entity);
        $this->em->flush();

        try {
            $this->progress->completeReading($next, $this->user);
            self::fail('Locked lesson completed');
        } catch (\Symfony\Component\HttpKernel\Exception\AccessDeniedHttpException) {
            self::assertSame(0, $this->progress->lesson($next, $this->user)['xpEarned']);
        }
    }

    public function testMigrationRecognizesCompletedLessonsOnly(): void
    {
        $course = (new Courses())->setName('Historical XP');
        $complete = (new Lesson())->setTitle('Complete')->setCourse($course);
        $partial = (new Lesson())->setTitle('Partial')->setCourse($course);
        $read = (new Lesson())->setTitle('Read')->setCourse($course);
        $solved = new Problem($complete, 'Solved', 'Solved');
        $partialSolved = new Problem($partial, 'Solved', 'Solved');
        $unsolved = new Problem($partial, 'Unsolved', 'Unsolved');
        foreach ([$course, $complete, $partial, $read, $solved, $partialSolved, $unsolved] as $entity) {
            $this->em->persist($entity);
        }
        $this->em->flush();
        $db = $this->em->getConnection();
        foreach ([$solved, $partialSolved] as $problem) {
            $db->executeStatement('INSERT INTO problem_progress (user_id, problem_id, completed_at) VALUES (?, ?, CURRENT_TIMESTAMP)', [$this->user->getId(), $problem->getId()]);
        }
        $db->executeStatement('INSERT INTO lesson_progress (user_id, lesson_id, completed_at) VALUES (?, ?, CURRENT_TIMESTAMP)', [$this->user->getId(), $read->getId()]);

        require_once dirname(__DIR__, 2).'/migrations/Version20261118010000.php';
        $db->executeStatement('ALTER TABLE lesson_progress DROP xp_earned');
        $migration = new \DoctrineMigrations\Version20261118010000($db, new \Psr\Log\NullLogger());
        $migration->up(new \Doctrine\DBAL\Schema\Schema());
        foreach ($migration->getSql() as $query) {
            $db->executeStatement($query->getStatement(), $query->getParameters(), $query->getTypes());
        }
        $state = $this->progress->course($course->getId(), $this->user);
        self::assertSame(100, $state[$complete->getId()]['xpEarned']);
        self::assertSame(0, $state[$partial->getId()]['xpEarned']);
        self::assertSame(100, $state[$read->getId()]['xpEarned']);
        self::assertSame(0, $this->progress->accept($solved, $this->user));
    }

    public function testCustomLessonXpOverridesProblemsAndPreservesHistory(): void
    {
        $course = (new Courses())->setName('Custom reward');
        $lesson = (new Lesson())->setTitle('Custom')->setCourse($course)->setDifficulty('hard')->setXpReward(275);
        $problem = new Problem($lesson, 'Print', 'Print');
        foreach ([$course, $lesson, $problem] as $entity) $this->em->persist($entity);
        $this->em->flush();
        self::assertSame(275, $this->progress->lesson($lesson, $this->user)['xpReward']);
        self::assertSame(275, $this->progress->accept($problem, $this->user));
        $lesson->setXpReward(0);
        $this->em->flush();
        self::assertSame(0, $this->progress->lesson($lesson, $this->user)['xpReward']);
        self::assertSame(0, $this->progress->accept($problem, $this->user));
        self::assertSame(275, $this->progress->totalXp($this->user));
        $lesson->setXpReward(null);
        $this->em->flush();
        self::assertSame(50, $this->progress->lesson($lesson, $this->user)['xpReward']);
    }

    public function testDifficultyRewardsAndTotalPreserveEarnedXp(): void
    {
        $course = (new Courses())->setName('Dynamic XP');
        $lesson = (new Lesson())->setTitle('Exercises')->setCourse($course);
        $reading = (new Lesson())->setTitle('Reading')->setCourse($course);
        foreach ([$course, $lesson, $reading] as $entity) $this->em->persist($entity);
        $problems = [];
        foreach (\App\Entity\ProblemDifficulty::cases() as $difficulty) {
            $problem = new Problem($lesson, $difficulty->value, 'Print');
            $problem->setDifficulty($difficulty);
            $this->em->persist($problem);
            $problems[] = $problem;
        }
        $this->em->flush();

        self::assertSame(350, $this->progress->lesson($lesson, $this->user)['xpReward']);
        self::assertSame(0, $this->progress->totalXp($this->user));
        self::assertSame(0, $this->progress->accept($problems[0], $this->user));
        self::assertSame(0, $this->progress->accept($problems[1], $this->user));
        self::assertSame(0, $this->progress->totalXp($this->user));
        self::assertSame(350, $this->progress->accept($problems[2], $this->user));
        self::assertSame(0, $this->progress->accept($problems[2], $this->user));
        self::assertSame(350, $this->progress->totalXp($this->user));

        $problems[0]->setDifficulty(\App\Entity\ProblemDifficulty::Hard);
        $this->em->flush();
        self::assertSame(500, $this->progress->lesson($lesson, $this->user)['xpReward']);
        self::assertSame(350, $this->progress->lesson($lesson, $this->user)['xpEarned']);
        self::assertSame(0, $this->progress->accept($problems[0], $this->user));
        self::assertSame(350, $this->progress->totalXp($this->user));
        self::assertSame(100, $this->progress->completeReading($reading, $this->user));
        self::assertSame(450, $this->progress->totalXp($this->user));
        self::assertSame(0, $this->progress->completeReading($reading, $this->user));
        self::assertSame(450, $this->progress->totalXp($this->user));
    }
}
