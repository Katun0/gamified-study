<?php

namespace App\Tests\Security;

use Symfony\Bundle\FrameworkBundle\Test\WebTestCase;

final class AnonymousAccessTest extends WebTestCase
{
    public function testAnonymousUserCannotCreateContent(): void
    {
        $client = self::createClient();
        $client->jsonRequest('POST', '/api/courses', ['name' => 'Unauthorized']);
        self::assertResponseStatusCodeSame(401);
        $client->jsonRequest('POST', '/api/lessons', ['title' => 'Unauthorized']);
        self::assertResponseStatusCodeSame(401);
    }

    public function testInvalidTokenCannotReadIdentity(): void
    {
        $client = self::createClient();
        $client->request('GET', '/api/me', server: ['HTTP_AUTHORIZATION' => 'Bearer invalid']);
        self::assertResponseStatusCodeSame(401);
    }
}
