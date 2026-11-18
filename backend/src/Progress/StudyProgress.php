<?php

namespace App\Progress;

use App\Entity\Lesson;
use App\Entity\Problem;
use App\Entity\User;
use Doctrine\DBAL\Connection;
use Symfony\Component\HttpKernel\Exception\AccessDeniedHttpException;

final class StudyProgress
{
    public function __construct(private Connection $connection) {}

    public function course(int $courseId, User $user): array
    {
        $rows = $this->connection->fetchAllAssociative(
            'SELECT l.id, p.id AS problem_id, pp.problem_id AS solved_id, lp.lesson_id AS read_id
             FROM lessons l LEFT JOIN problems p ON p.lesson_id = l.id
             LEFT JOIN problem_progress pp ON pp.problem_id = p.id AND pp.user_id = :user
             LEFT JOIN lesson_progress lp ON lp.lesson_id = l.id AND lp.user_id = :user
             WHERE l.course_id = :course ORDER BY l.id, p.id',
            ['user' => $user->getId(), 'course' => $courseId]
        );
        $lessons = [];
        foreach ($rows as $row) {
            $id = (int) $row['id'];
            $lessons[$id] ??= ['completed' => false, 'locked' => false, 'problems' => [], 'read' => $row['read_id'] !== null];
            if ($row['problem_id'] !== null) {
                $lessons[$id]['problems'][(int) $row['problem_id']] = ['completed' => $row['solved_id'] !== null];
            }
        }
        $admin = in_array('ROLE_ADMIN', $user->getRoles(), true);
        $previousLessonsCompleted = true;
        $currentFound = false;
        foreach ($lessons as &$lesson) {
            $lesson['locked'] = !$admin && !$previousLessonsCompleted;
            $previousProblemsCompleted = true;
            foreach ($lesson['problems'] as &$problem) {
                $problem['locked'] = !$admin && (!$previousLessonsCompleted || !$previousProblemsCompleted);
                $previousProblemsCompleted = $previousProblemsCompleted && $problem['completed'];
            }
            unset($problem);
            $lesson['completed'] = $lesson['problems'] === [] ? $lesson['read'] : $previousProblemsCompleted;

            $lesson['current'] = false;
            if (!$admin && !$currentFound && !$lesson['completed'] && !$lesson['locked']) {
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

    public function accept(Problem $problem, User $user): void
    {
        $this->connection->executeStatement(
            'INSERT INTO problem_progress (user_id, problem_id, completed_at) VALUES (?, ?, CURRENT_TIMESTAMP)
             ON CONFLICT (user_id, problem_id) DO NOTHING', [$user->getId(), $problem->getId()]
        );
    }

    public function completeReading(Lesson $lesson, User $user): void
    {
        $this->connection->executeStatement(
            'INSERT INTO lesson_progress (user_id, lesson_id, completed_at) VALUES (?, ?, CURRENT_TIMESTAMP)
             ON CONFLICT (user_id, lesson_id) DO NOTHING', [$user->getId(), $lesson->getId()]
        );
    }
}
