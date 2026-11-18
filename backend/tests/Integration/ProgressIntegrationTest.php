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
        $this->progress->accept($p1_1, $this->user);
        $state = $this->progress->course($course->getId(), $this->user);

        self::assertFalse($state[$lesson1->getId()]['problems'][$p1_2->getId()]['locked'], 'P1.2 deve estar desbloqueado agora');
        self::assertTrue($state[$lesson2->getId()]['locked'], 'L2 ainda deve estar bloqueada porque L1 não acabou');

        // 3. Resolve P1.2
        $this->progress->accept($p1_2, $this->user);
        $state = $this->progress->course($course->getId(), $this->user);

        self::assertTrue($state[$lesson1->getId()]['completed'], 'L1 deve estar concluída');
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
}
