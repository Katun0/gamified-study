<?php

namespace App\Progress;

use App\Entity\Lesson;
use App\Entity\Problem;
use App\Entity\ProblemDifficulty;
use App\Entity\User;
use Doctrine\DBAL\Connection;
use Symfony\Component\HttpKernel\Exception\AccessDeniedHttpException;
use Symfony\Component\HttpKernel\Exception\ConflictHttpException;

final class StudyProgress
{
    public const READING_XP = 100;

    public function __construct(private Connection $connection) {}

    public function course(int $courseId, User $user): array
    {
        $rows = $this->connection->fetchAllAssociative(
            'SELECT l.id, l.xp_reward AS custom_xp, p.id AS problem_id, p.difficulty, pp.problem_id AS solved_id, lp.lesson_id AS read_id, lp.xp_earned
             FROM lessons l LEFT JOIN problems p ON p.lesson_id = l.id
             LEFT JOIN problem_progress pp ON pp.problem_id = p.id AND pp.user_id = :user
             LEFT JOIN lesson_progress lp ON lp.lesson_id = l.id AND lp.user_id = :user
             WHERE l.course_id = :course ORDER BY l.id, p.id',
            ['user' => $user->getId(), 'course' => $courseId]
        );
        $lessons = [];
        foreach ($rows as $row) {
            $id = (int) $row['id'];
            $lessons[$id] ??= [
                'completed' => false, 'locked' => false, 'problems' => [],
                'read' => $row['read_id'] !== null,
                'customXp' => $row['custom_xp'] ?? null,
                'xpReward' => 0, 'xpEarned' => (int) ($row['xp_earned'] ?? 0),
            ];
            if ($row['problem_id'] !== null) {
                $lessons[$id]['problems'][(int) $row['problem_id']] = ['completed' => $row['solved_id'] !== null];
                $lessons[$id]['xpReward'] += ProblemDifficulty::from($row['difficulty'])->xp();
            }
        }
        $admin = in_array('ROLE_ADMIN', $user->getRoles(), true);
        $previousLessonsCompleted = true;
        $currentFound = false;
        foreach ($lessons as &$lesson) {
            if ($lesson['problems'] === []) {
                $lesson['xpReward'] = self::READING_XP;
            }
            if ($lesson['customXp'] !== null) $lesson['xpReward'] = (int) $lesson['customXp'];
            unset($lesson['customXp']);
            $lesson['locked'] = !$previousLessonsCompleted;
            $previousProblemsCompleted = true;
            foreach ($lesson['problems'] as &$problem) {
                $problem['locked'] = !$previousLessonsCompleted || (!$admin && !$previousProblemsCompleted);
                $previousProblemsCompleted = $previousProblemsCompleted && $problem['completed'];
            }
            unset($problem);
            $lesson['completed'] = $lesson['problems'] === [] ? $lesson['read'] : $previousProblemsCompleted;

            $lesson['current'] = false;
            if (!$currentFound && !$lesson['completed'] && !$lesson['locked']) {
                $lesson['current'] = true;
                $currentFound = true;
            }

            $previousLessonsCompleted = $previousLessonsCompleted && $lesson['completed'];
            unset($lesson['read']);
        }
        unset($lesson);
        return $lessons;
    }

    public function lesson(Lesson $lesson, User $user): array
    {
        return $this->course($lesson->getCourse()->getId(), $user)[$lesson->getId()];
    }

    public function requireLesson(Lesson $lesson, User $user): array
    {
        $state = $this->lesson($lesson, $user);
        if ($state['locked']) {
            throw new AccessDeniedHttpException('Conclua as lições anteriores para acessar esta lição.');
        }
        return $state;
    }

    public function requireProblem(Problem $problem, User $user): void
    {
        $state = $this->requireLesson($problem->getLesson(), $user);
        if ($state['problems'][$problem->getId()]['locked']) {
            throw new AccessDeniedHttpException('Resolva os problemas anteriores para acessar este problema.');
        }
    }

    public function accept(Problem $problem, User $user): int
    {
        return $this->connection->transactional(function () use ($problem, $user): int {
            // Serialize progress writes for this user, including simultaneous submissions.
            $this->connection->fetchOne('SELECT id FROM "user" WHERE id = ? FOR UPDATE', [$user->getId()]);
            $this->requireProblem($problem, $user);
            $this->connection->executeStatement(
                'INSERT INTO problem_progress (user_id, problem_id, completed_at) VALUES (?, ?, CURRENT_TIMESTAMP)
                 ON CONFLICT (user_id, problem_id) DO NOTHING', [$user->getId(), $problem->getId()]
            );
            return $this->awardLesson($problem->getLesson(), $user);
        });
    }

    public function completeReading(Lesson $lesson, User $user): int
    {
        return $this->connection->transactional(function () use ($lesson, $user): int {
            $this->connection->fetchOne('SELECT id FROM "user" WHERE id = ? FOR UPDATE', [$user->getId()]);
            $state = $this->requireLesson($lesson, $user);
            if ($state['problems'] !== []) {
                throw new ConflictHttpException('Resolva os problemas para concluir esta lição.');
            }
            return $this->awardLesson($lesson, $user);
        });
    }

    private function awardLesson(Lesson $lesson, User $user): int
    {
        $difficulties = $this->connection->fetchFirstColumn('SELECT difficulty FROM problems WHERE lesson_id = ?', [$lesson->getId()]);
        $reward = $difficulties === [] ? self::READING_XP : array_sum(array_map(
            static fn (string $difficulty): int => ProblemDifficulty::from($difficulty)->xp(), $difficulties
        ));
        $reward = $lesson->getXpReward() ?? $reward;
        $awarded = $this->connection->fetchOne(
            'INSERT INTO lesson_progress (user_id, lesson_id, completed_at, xp_earned)
             SELECT :user, :lesson, CURRENT_TIMESTAMP, :xp
             WHERE NOT EXISTS (
                 SELECT 1 FROM problems p
                 WHERE p.lesson_id = :lesson AND NOT EXISTS (
                     SELECT 1 FROM problem_progress pp WHERE pp.problem_id = p.id AND pp.user_id = :user
                 )
             )
             ON CONFLICT (user_id, lesson_id) DO NOTHING RETURNING xp_earned',
            ['user' => $user->getId(), 'lesson' => $lesson->getId(), 'xp' => $reward]
        );

        if ($awarded !== false) {
            $xp = (int) $awarded;
            $this->connection->executeStatement('UPDATE "user" SET total_xp = total_xp + ? WHERE id = ?', [$xp, $user->getId()]);
            $user->addXp($xp);
            return $xp;
        }

        return 0;
    }

    public function totalXp(User $user): int
    {
        return (int) $this->connection->fetchOne(
            'SELECT COALESCE(SUM(xp_earned), 0) FROM lesson_progress WHERE user_id = ?', [$user->getId()]
        );
    }
}
