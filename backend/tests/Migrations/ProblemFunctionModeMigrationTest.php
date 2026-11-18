<?php

namespace App\Tests\Migrations;

use Doctrine\DBAL\Schema\Schema;
use DoctrineMigrations\Version20261118160000;
use PHPUnit\Framework\TestCase;

require_once dirname(__DIR__, 2) . '/migrations/Version20261118160000.php';

final class ProblemFunctionModeMigrationTest extends TestCase
{
    public function testUpAddsFunctionModeColumnsWithExpectedTypesAndDefaults(): void
    {
        $migration = (new \ReflectionClass(Version20261118160000::class))->newInstanceWithoutConstructor();
        $migration->up(new Schema());

        self::assertSame([
            "ALTER TABLE problems ADD COLUMN IF NOT EXISTS evaluation_mode VARCHAR(20) DEFAULT 'stdin_stdout' NOT NULL",
            'ALTER TABLE problems ADD COLUMN IF NOT EXISTS function_arguments JSON DEFAULT NULL',
            'ALTER TABLE problems ADD COLUMN IF NOT EXISTS expected_return JSON DEFAULT NULL',
            'ALTER TABLE problems ADD COLUMN IF NOT EXISTS function_template TEXT DEFAULT NULL',
        ], array_map(static fn ($query): string => $query->getStatement(), $migration->getSql()));
    }

    public function testDownDropsFunctionModeColumnsInReverseOrder(): void
    {
        $migration = (new \ReflectionClass(Version20261118160000::class))->newInstanceWithoutConstructor();
        $migration->down(new Schema());

        self::assertSame([
            'ALTER TABLE problems DROP COLUMN IF EXISTS function_template',
            'ALTER TABLE problems DROP COLUMN IF EXISTS expected_return',
            'ALTER TABLE problems DROP COLUMN IF EXISTS function_arguments',
            'ALTER TABLE problems DROP COLUMN IF EXISTS evaluation_mode',
        ], array_map(static fn ($query): string => $query->getStatement(), $migration->getSql()));
    }
}