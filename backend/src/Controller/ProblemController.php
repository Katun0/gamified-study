<?php

namespace App\Controller;

use App\Entity\Lesson;
use App\Entity\Problem;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\Routing\Attribute\Route;

final class ProblemController
{
    #[Route('/api/lessons/{id}/problems', name: 'api_lesson_problems', methods: ['GET'], requirements: ['id' => '\d+'])]
    public function list(int $id, EntityManagerInterface $em): JsonResponse
    {
        $lesson = $em->find(Lesson::class, $id);
        if (!$lesson) return new JsonResponse(['error' => 'Lição não encontrada.'], 404);
        $problems = $em->getRepository(Problem::class)->findBy(['lesson' => $lesson], ['id' => 'ASC']);
        return new JsonResponse(array_map($this->serialize(...), $problems));
    }

    #[Route('/api/problems', name: 'api_problems_create', methods: ['POST'])]
    public function create(Request $request, EntityManagerInterface $em): JsonResponse
    {
        try {
            $data = json_decode($request->getContent(), true, 512, JSON_THROW_ON_ERROR);
        } catch (\JsonException) {
            return new JsonResponse(['error' => 'Corpo da requisição inválido.'], 400);
        }
        if (!is_array($data) || !is_string($data['title'] ?? null) || !is_string($data['statement'] ?? null)
            || !is_int($data['lessonId'] ?? null) || $data['lessonId'] < 1) {
            return new JsonResponse(['error' => 'Informe a lição, o título e o enunciado do problema.'], 422);
        }
        $title = trim($data['title']);
        $statement = trim($data['statement']);
        if ($title === '' || mb_strlen($title) > 255 || $statement === '') {
            return new JsonResponse(['error' => 'Informe um título de até 255 caracteres e um enunciado não vazio.'], 422);
        }
        $lesson = $em->find(Lesson::class, $data['lessonId']);
        if (!$lesson) return new JsonResponse(['error' => 'Lição não encontrada.'], 404);
        $problem = new Problem($lesson, $title, $statement);
        $em->persist($problem);
        $em->flush();
        return new JsonResponse($this->serialize($problem), 201);
    }

    private function serialize(Problem $problem): array
    {
        return [
            'id' => $problem->getId(), 'lessonId' => $problem->getLesson()->getId(),
            'title' => $problem->getTitle(), 'statement' => $problem->getStatement(),
            'testCase' => $problem->getExpectedOutput() === null ? null : [
                'input' => $problem->getTestInput(), 'expected' => $problem->getExpectedOutput(),
            ],
            'createdAt' => $problem->getCreatedAt()->format(DATE_ATOM),
        ];
    }
}
