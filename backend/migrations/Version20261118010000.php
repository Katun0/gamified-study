<?php

namespace DoctrineMigrations;

use Doctrine\DBAL\Schema\Schema;
use Doctrine\Migrations\AbstractMigration;

final class Version20261118010000 extends AbstractMigration
{
    public function getDescription(): string
    {
        return 'Registra 100 XP por lição e reconhece conclusões anteriores.';
    }

    public function up(Schema $schema): void
    {
        $this->addSql('ALTER TABLE lesson_progress ADD xp_earned INT DEFAULT 100 NOT NULL');
        $this->addSql('INSERT INTO lesson_progress (user_id, lesson_id, completed_at, xp_earned)
            SELECT pp.user_id, p.lesson_id, MAX(pp.completed_at), 100
            FROM problem_progress pp JOIN problems p ON p.id = pp.problem_id
            GROUP BY pp.user_id, p.lesson_id
            HAVING COUNT(*) = (SELECT COUNT(*) FROM problems all_problems WHERE all_problems.lesson_id = p.lesson_id)
            ON CONFLICT (user_id, lesson_id) DO NOTHING');
    }

    public function down(Schema $schema): void
    {
        $this->addSql('ALTER TABLE lesson_progress DROP xp_earned');
    }
}
