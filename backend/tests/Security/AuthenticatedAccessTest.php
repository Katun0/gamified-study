<?php

namespace App\Tests\Security;

use App\Entity\User;
use App\Repository\UserRepository;
use Lexik\Bundle\JWTAuthenticationBundle\Services\JWTTokenManagerInterface;
use PHPUnit\Framework\Attributes\DataProvider;
use Symfony\Bundle\FrameworkBundle\Test\WebTestCase;

final class AuthenticatedAccessTest extends WebTestCase
{
    public static function roles(): array
    {
        return [[[], 403], [['ROLE_ADMIN'], 422]];
    }

    #[DataProvider('roles')]
    public function testServerChecksStoredRoles(array $roles, int $status): void
    {
        $client = self::createClient();
        $client->disableReboot();
        $user = (new User())->setName('Test')->setEmail('test@example.com')->setRoles($roles);
        $repository = $this->createStub(UserRepository::class);
        $repository->method('loadUserByIdentifier')->willReturn($user);
        self::getContainer()->set(UserRepository::class, $repository);
        // Even a token issued with admin roles must respect the current database roles.
        $tokenUser = (new User())->setEmail('test@example.com')->setRoles(['ROLE_ADMIN']);
        $jwt = self::getContainer()->get(JWTTokenManagerInterface::class)->create($tokenUser);
        $headers = ['HTTP_AUTHORIZATION' => 'Bearer '.$jwt];
        $client->request('GET', '/api/me', server: $headers);
        self::assertResponseIsSuccessful();
        self::assertSame($user->getRoles(), json_decode($client->getResponse()->getContent(), true)['roles']);
        $client->jsonRequest('POST', '/api/courses', [], $headers);
        self::assertResponseStatusCodeSame($status);
        $client->jsonRequest('POST', '/api/lessons', [], $headers);
        self::assertResponseStatusCodeSame($status);
        $client->jsonRequest('POST', '/api/problems', [], $headers);
        self::assertResponseStatusCodeSame($status);
    }
}
