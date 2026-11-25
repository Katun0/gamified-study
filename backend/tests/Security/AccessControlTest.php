<?php

namespace App\Tests\Security;

use App\Entity\User;
use PHPUnit\Framework\Attributes\DataProvider;
use PHPUnit\Framework\TestCase;
use Symfony\Component\Security\Core\Authentication\Token\UsernamePasswordToken;
use Symfony\Component\Security\Core\Authorization\AccessDecisionManager;
use Symfony\Component\Security\Core\Authorization\Voter\RoleVoter;
use Symfony\Component\Yaml\Yaml;

final class AccessControlTest extends TestCase
{
    public static function accessCases(): array
    {
        return [
            ['POST', '/api/courses', [], false],
            ['POST', '/api/lessons', [], false],
            ['POST', '/api/courses', ['ROLE_ADMIN'], true],
            ['POST', '/api/lessons', ['ROLE_ADMIN'], true],
            ['GET', '/api/courses', [], true],
            ['GET', '/api/courses/1/lessons', [], true],
            ['GET', '/api/me', [], true],
            ['GET', '/api/me/gamification', [], true],
            ['PUT', '/api/me/daily-goal', [], true],
            ['POST', '/api/problems/1/check', [], true],
            ['POST', '/api/lessons/1/complete', [], true],
            ['PUT', '/api/problems/1/test-case', [], false],
            ['PUT', '/api/problems/1/test-case', ['ROLE_ADMIN'], true],
            ['PATCH', '/api/problems/1/difficulty', [], false],
            ['PATCH', '/api/lessons/1/reward', [], false],
            ['PATCH', '/api/lessons/1/reward', ['ROLE_ADMIN'], true],
            ['PATCH', '/api/problems/1/difficulty', ['ROLE_ADMIN'], true],
        ];
    }

    #[DataProvider('accessCases')]
    public function testConfiguredRulesEnforceRoles(string $method, string $path, array $roles, bool $allowed): void
    {
        $config = Yaml::parseFile(dirname(__DIR__, 2).'/config/packages/security.yaml');
        $attributes = null;
        foreach ($config['security']['access_control'] as $rule) {
            if (preg_match('#'.$rule['path'].'#', $path) && (!isset($rule['methods']) || in_array($method, $rule['methods'], true))) {
                $attributes = (array) $rule['roles'];
                break;
            }
        }
        self::assertNotNull($attributes, 'Every API endpoint must have an access rule.');
        $user = (new User())->setRoles($roles);
        $token = new UsernamePasswordToken($user, 'main', $user->getRoles());
        self::assertSame($allowed, (new AccessDecisionManager([new RoleVoter()]))->decide($token, $attributes));
    }
}
