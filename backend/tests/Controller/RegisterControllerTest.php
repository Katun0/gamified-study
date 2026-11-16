<?php

namespace App\Tests\Controller;

use App\Controller\RegisterController;
use App\Entity\User;
use App\Repository\UserRepository;
use Doctrine\DBAL\Exception\UniqueConstraintViolationException;
use Doctrine\ORM\EntityManagerInterface;
use PHPUnit\Framework\TestCase;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\PasswordHasher\Hasher\UserPasswordHasherInterface;

final class RegisterControllerTest extends TestCase
{
    public function testPublicRegistrationCannotGrantAdminAndNormalizesEmail(): void
    {
        $users = $this->createMock(UserRepository::class);
        $users->expects(self::once())->method('findOneBy')->with(['email' => 'student@example.com'])->willReturn(null);
        $em = $this->createMock(EntityManagerInterface::class);
        $em->expects(self::once())->method('persist')->with(self::callback(function (User $user): bool {
            return $user->getRoles() === ['ROLE_USER'] && $user->getEmail() === 'student@example.com' && $user->getPassword() === 'hashed';
        }));
        $em->expects(self::once())->method('flush');
        $hasher = $this->createStub(UserPasswordHasherInterface::class);
        $hasher->method('hashPassword')->willReturn('hashed');
        $request = Request::create('/api/register', 'POST', content: json_encode([
            'name' => 'Student', 'email' => ' Student@Example.COM ', 'password' => 'password123', 'roles' => ['ROLE_ADMIN'],
        ]));
        $response = (new RegisterController())($request, $users, $em, $hasher);
        self::assertSame(201, $response->getStatusCode());
        self::assertStringNotContainsString('hashed', $response->getContent());
    }

    public function testConcurrentDuplicateRegistrationReturnsConflict(): void
    {
        $users = $this->createStub(UserRepository::class);
        $users->method('findOneBy')->willReturn(null);
        $em = $this->createStub(EntityManagerInterface::class);
        $em->method('flush')->willThrowException($this->createStub(UniqueConstraintViolationException::class));
        $hasher = $this->createStub(UserPasswordHasherInterface::class);
        $hasher->method('hashPassword')->willReturn('hashed');
        $request = Request::create('/api/register', 'POST', content: '{"name":"Student","email":"student@example.com","password":"password123"}');
        $response = (new RegisterController())($request, $users, $em, $hasher);
        self::assertSame(409, $response->getStatusCode());
    }
}
