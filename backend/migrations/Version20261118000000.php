<?php

namespace DoctrineMigrations;

use Doctrine\DBAL\Schema\Schema;
use Doctrine\Migrations\AbstractMigration;

final class Version20261118000000 extends AbstractMigration
{
    public function getDescription(): string
    {
        return 'Registra conclusões de problemas e leituras por usuário.';
    }

    public function up(Schema $schema): void
    {
        $this->addSql('CREATE TABLE problem_progress (user_id INT NOT NULL REFERENCES "user" (id) ON DELETE CASCADE, problem_id INT NOT NULL REFERENCES problems (id) ON DELETE CASCADE, completed_at TIMESTAMP(0) WITHOUT TIME ZONE NOT NULL, PRIMARY KEY(user_id, problem_id))');
        $this->addSql('CREATE INDEX IDX_PROGRESS_PROBLEM ON problem_progress (problem_id)');
        $this->addSql('CREATE TABLE lesson_progress (user_id INT NOT NULL REFERENCES "user" (id) ON DELETE CASCADE, lesson_id INT NOT NULL REFERENCES lessons (id) ON DELETE CASCADE, completed_at TIMESTAMP(0) WITHOUT TIME ZONE NOT NULL, PRIMARY KEY(user_id, lesson_id))');
        $this->addSql('CREATE INDEX IDX_PROGRESS_LESSON ON lesson_progress (lesson_id)');
    }

    public function down(Schema $schema): void
    {
        $this->addSql('DROP TABLE problem_progress');
        $this->addSql('DROP TABLE lesson_progress');
    }
}
