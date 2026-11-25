<?php

namespace App\Controller;

use App\Entity\User;
use App\Progress\Gamification;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\Routing\Attribute\Route;
use Symfony\Component\Security\Http\Attribute\CurrentUser;

final class GamificationController
{
    #[Route('/api/me/gamification', methods: ['GET'])]
    public function summary(#[CurrentUser] User $user, Gamification $gamification): JsonResponse
    {
        return new JsonResponse($gamification->summary($user), headers: ['Cache-Control' => 'no-store']);
    }

    #[Route('/api/me/daily-goal', methods: ['PUT'])]
    public function goal(Request $request, #[CurrentUser] User $user, EntityManagerInterface $em, Gamification $gamification): JsonResponse
    {
        $goal = $request->toArray()['goal'] ?? null;
        if (!in_array($goal, [1, 2, 3], true)) return new JsonResponse(['error' => 'Escolha uma meta de 1, 2 ou 3 desafios.'], 422);
        $user->setDailyGoal($goal);
        $em->flush();
        return new JsonResponse($gamification->summary($user), headers: ['Cache-Control' => 'no-store']);
    }
}
