<?php

declare(strict_types=1);
namespace DoctrineMigrations;

use Doctrine\DBAL\Schema\Schema;
use Doctrine\Migrations\AbstractMigration;

final class Version20261124010000 extends AbstractMigration
{
    public function getDescription(): string { return 'Meta diária e conquistas persistentes por aluno'; }
    public function up(Schema $schema): void
    {
        $this->addSql('ALTER TABLE "user" ADD daily_goal INT DEFAULT 1 NOT NULL');
        $this->addSql('CREATE TABLE user_achievements (user_id INT NOT NULL REFERENCES "user" (id) ON DELETE CASCADE, code VARCHAR(80) NOT NULL, details JSON NOT NULL, unlocked_at TIMESTAMP(0) WITHOUT TIME ZONE NOT NULL, PRIMARY KEY(user_id, code))');
    }
    public function down(Schema $schema): void
    {
        $this->addSql('DROP TABLE user_achievements');
        $this->addSql('ALTER TABLE "user" DROP daily_goal');
    }
}
