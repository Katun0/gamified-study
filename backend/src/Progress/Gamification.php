<?php

namespace App\Progress;

use App\Entity\User;
use Doctrine\DBAL\Connection;

final class Gamification
{
    public const TIMEZONE = 'America/Sao_Paulo';

    public function __construct(private Connection $connection) {}

    public function summary(User $user, ?\DateTimeImmutable $now = null): array
    {
        $now ??= new \DateTimeImmutable('now', new \DateTimeZone('UTC'));
        $today = $now->setTimezone(new \DateTimeZone(self::TIMEZONE))->format('Y-m-d');
        $db = $this->connection;
        $stats = $db->fetchAssociative(
            "SELECT COUNT(*) AS solved, COUNT(*) FILTER (WHERE (completed_at AT TIME ZONE 'UTC' AT TIME ZONE 'America/Sao_Paulo')::date = CAST(? AS date)) AS today FROM problem_progress WHERE user_id = ?",
            [$today, $user->getId()]
        );
        $lessons = (int) $db->fetchOne('SELECT COUNT(*) FROM lesson_progress WHERE user_id = ?', [$user->getId()]);
        $days = (int) $db->fetchOne(
            "SELECT COUNT(DISTINCT (completed_at AT TIME ZONE 'UTC' AT TIME ZONE 'America/Sao_Paulo')::date) FROM (SELECT completed_at FROM problem_progress WHERE user_id = :user UNION ALL SELECT completed_at FROM lesson_progress WHERE user_id = :user) activity",
            ['user' => $user->getId()]
        );
        $courses = $db->fetchAllAssociative(
            'SELECT c.id, c.name FROM courses c WHERE EXISTS (SELECT 1 FROM lessons l WHERE l.course_id=c.id) AND NOT EXISTS (SELECT 1 FROM lessons l WHERE l.course_id=c.id AND NOT EXISTS (SELECT 1 FROM lesson_progress lp WHERE lp.lesson_id=l.id AND lp.user_id=?)) ORDER BY c.id',
            [$user->getId()]
        );
        $candidates = self::milestones((int) $stats['solved'], $lessons, $days);
        foreach ($courses as $course) {
            $candidates[] = ['code' => 'course:'.$course['id'], 'title' => 'Módulo concluído: '.$course['name'],
                'description' => 'Você concluiu todas as lições deste módulo.', 'kind' => 'module', 'courseId' => (int) $course['id']];
        }
        // Apenas fatos consultados no servidor podem desbloquear medalhas.
        // A chave composta torna a reconciliação idempotente entre abas/requisições.
        foreach ($candidates as $achievement) {
            $db->executeStatement('INSERT INTO user_achievements (user_id, code, details, unlocked_at) VALUES (?, ?, ?, ?) ON CONFLICT (user_id, code) DO NOTHING',
                [$user->getId(), $achievement['code'], json_encode($achievement, JSON_THROW_ON_ERROR | JSON_UNESCAPED_UNICODE), $now->setTimezone(new \DateTimeZone('UTC'))->format('Y-m-d H:i:s')]);
        }
        $achievements = array_map(static function (array $row): array {
            return [...json_decode($row['details'], true, flags: JSON_THROW_ON_ERROR), 'unlockedAt' => str_replace(' ', 'T', $row['unlocked_at']).'Z'];
        }, $db->fetchAllAssociative('SELECT details, unlocked_at FROM user_achievements WHERE user_id=? ORDER BY unlocked_at, code', [$user->getId()]));
        return [
            'daily' => ['date' => $today, 'timezone' => self::TIMEZONE, 'goal' => $user->getDailyGoal(),
                'completed' => (int) $stats['today'], 'achieved' => (int) $stats['today'] >= $user->getDailyGoal()],
            'achievements' => $achievements,
            'stats' => ['solved' => (int) $stats['solved'], 'lessons' => $lessons, 'studyDays' => $days],
        ];
    }

    public static function milestones(int $solved, int $lessons, int $days): array
    {
        $earned = [];
        foreach ([
            ['first_problem', 'Primeiros passos', 'Resolva seu primeiro desafio.', $solved >= 1],
            ['ten_problems', 'Dez desafios vencidos', 'Resolva dez desafios diferentes.', $solved >= 10],
            ['first_lesson', 'Primeira missão', 'Conclua sua primeira lição.', $lessons >= 1],
            ['seven_days', 'Uma semana de prática', 'Estude em sete dias diferentes, sem precisar serem consecutivos.', $days >= 7],
        ] as [$code, $title, $description, $unlocked]) {
            if ($unlocked) $earned[] = compact('code', 'title', 'description') + ['kind' => 'milestone'];
        }
        return $earned;
    }
}
