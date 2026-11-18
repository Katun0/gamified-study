<?php

declare(strict_types=1);

namespace DoctrineMigrations;

use Doctrine\DBAL\Schema\Schema;
use Doctrine\Migrations\AbstractMigration;

final class Version20261118133000 extends AbstractMigration
{
    public function getDescription(): string { return 'Tipo esperado para retorno de problemas em modo função'; }

    public function up(Schema $schema): void
    {
        $this->addSql('ALTER TABLE problems ADD expected_return_type VARCHAR(20) DEFAULT NULL');
    }

    public function down(Schema $schema): void
    {
        $this->addSql('ALTER TABLE problems DROP expected_return_type');
    }
}