<?php

declare(strict_types=1);

namespace DoctrineMigrations;

use Doctrine\DBAL\Schema\Schema;
use Doctrine\Migrations\AbstractMigration;

final class Version20261112120000 extends AbstractMigration
{
    public function getDescription(): string
    {
        return 'Persist user roles and enforce unique normalized emails';
    }

    public function up(Schema $schema): void
    {
        $duplicates = $this->connection->fetchOne('SELECT COUNT(*) FROM (SELECT LOWER(TRIM(email)) FROM "user" GROUP BY LOWER(TRIM(email)) HAVING COUNT(*) > 1) duplicates');
        $this->abortIf((int) $duplicates > 0, 'Existem e-mails duplicados após normalização. Resolva os cadastros duplicados antes de executar esta migration. Nenhum usuário será removido automaticamente.');
        $this->addSql('ALTER TABLE "user" ADD roles JSON NOT NULL DEFAULT \'[]\'');
        $this->addSql('UPDATE "user" SET email = LOWER(TRIM(email))');
        $this->addSql('CREATE UNIQUE INDEX UNIQ_8D93D649E7927C74 ON "user" (email)');
        $this->addSql('ALTER TABLE "user" ALTER roles DROP DEFAULT');
    }

    public function down(Schema $schema): void
    {
        $this->addSql('DROP INDEX UNIQ_8D93D649E7927C74');
        $this->addSql('ALTER TABLE "user" DROP roles');
    }
}
