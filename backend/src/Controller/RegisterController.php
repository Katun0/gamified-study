<?php

namespace App\Controller;

use App\Entity\User;
use App\Repository\UserRepository;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\PasswordHasher\Hasher\UserPasswordHasherInterface;
use Symfony\Component\Routing\Attribute\Route;

final class RegisterController
{
    #[Route('/api/register', name: 'api_register', methods: ['POST'])]
    public function __invoke(
        Request $request,
        UserRepository $users,
        EntityManagerInterface $entityManager,
        UserPasswordHasherInterface $passwordHasher,
    ): JsonResponse {
        try {
            $data = json_decode($request->getContent(), true, 512, JSON_THROW_ON_ERROR);
        } catch (\JsonException) {
            return new JsonResponse(['error' => 'Corpo da requisição inválido.'], 400);
        }

        $name = trim((string) ($data['name'] ?? ''));
        $email = trim((string) ($data['email'] ?? ''));
        $password = $data['password'] ?? null;

        if ($name === '' || !filter_var($email, FILTER_VALIDATE_EMAIL) || !is_string($password) || strlen($password) < 8) {
            return new JsonResponse(['error' => 'Informe nome, e-mail válido e senha com pelo menos 8 caracteres.'], 422);
        }

        if ($users->findOneBy(['email' => $email])) {
            return new JsonResponse(['error' => 'Este e-mail já está cadastrado.'], 409);
        }

        $user = (new User())->setName($name)->setEmail($email);
        $user->setPassword($passwordHasher->hashPassword($user, $password));
        $entityManager->persist($user);
        $entityManager->flush();

        return new JsonResponse(['id' => $user->getId(), 'name' => $user->getName(), 'email' => $user->getEmail()], 201);
    }
}
