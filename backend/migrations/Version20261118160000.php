<?php

declare(strict_types=1);

namespace DoctrineMigrations;

use Doctrine\DBAL\Schema\Schema;
use Doctrine\Migrations\AbstractMigration;

final class Version20261118160000 extends AbstractMigration
{
    public function getDescription(): string
    {
        return 'Add missing function evaluation columns to problems';
    }

    public function up(Schema $schema): void
    {
        $this->addSql("ALTER TABLE problems ADD COLUMN IF NOT EXISTS evaluation_mode VARCHAR(20) DEFAULT 'stdin_stdout' NOT NULL");
        $this->addSql('ALTER TABLE problems ADD COLUMN IF NOT EXISTS function_arguments JSON DEFAULT NULL');
        $this->addSql('ALTER TABLE problems ADD COLUMN IF NOT EXISTS expected_return JSON DEFAULT NULL');
        $this->addSql('ALTER TABLE problems ADD COLUMN IF NOT EXISTS function_template TEXT DEFAULT NULL');
    }

    public function down(Schema $schema): void
    {
        $this->addSql('ALTER TABLE problems DROP COLUMN IF EXISTS function_template');
        $this->addSql('ALTER TABLE problems DROP COLUMN IF EXISTS expected_return');
        $this->addSql('ALTER TABLE problems DROP COLUMN IF EXISTS function_arguments');
        $this->addSql('ALTER TABLE problems DROP COLUMN IF EXISTS evaluation_mode');
    }
}