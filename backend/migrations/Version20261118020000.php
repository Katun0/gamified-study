<?php

namespace DoctrineMigrations;

use Doctrine\DBAL\Schema\Schema;
use Doctrine\Migrations\AbstractMigration;

final class Version20261118020000 extends AbstractMigration
{
    public function getDescription(): string
    {
        return 'Define a dificuldade dos problemas existentes e novos, inicialmente fácil.';
    }

    public function up(Schema $schema): void
    {
        $this->addSql("ALTER TABLE problems ADD difficulty VARCHAR(10) DEFAULT 'easy' NOT NULL");
    }

    public function down(Schema $schema): void
    {
        $this->addSql('ALTER TABLE problems DROP difficulty');
    }
}
