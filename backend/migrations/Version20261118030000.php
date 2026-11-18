<?php

declare(strict_types=1);

namespace DoctrineMigrations;

use Doctrine\DBAL\Schema\Schema;
use Doctrine\Migrations\AbstractMigration;

final class Version20261118030000 extends AbstractMigration
{
    public function getDescription(): string { return 'Dificuldade e XP personalizado por lição'; }
    public function up(Schema $schema): void
    {
        $this->addSql("ALTER TABLE lessons ADD difficulty VARCHAR(10) DEFAULT 'easy' NOT NULL");
        $this->addSql('ALTER TABLE lessons ADD xp_reward INT DEFAULT NULL');
    }
    public function down(Schema $schema): void
    {
        $this->addSql('ALTER TABLE lessons DROP difficulty');
        $this->addSql('ALTER TABLE lessons DROP xp_reward');
    }
}
