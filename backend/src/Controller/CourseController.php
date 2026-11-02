<?php

namespace App\Controller;

use App\Entity\Courses;
use App\Repository\CoursesRepository;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\Routing\Attribute\Route;

final class CourseController
{
    #[Route('/api/courses', name: 'api_courses_list', methods: ['GET'])]
    public function list(CoursesRepository $courses): JsonResponse
    {
        return new JsonResponse(array_map([$this, 'serializeCourse'], $courses->findBy([], ['created_at' => 'DESC'])));
    }

    #[Route('/api/courses', name: 'api_courses_create', methods: ['POST'])]
    public function create(Request $request, EntityManagerInterface $entityManager): JsonResponse
    {
        try {
            $data = json_decode($request->getContent(), true, 512, JSON_THROW_ON_ERROR);
        } catch (\JsonException) {
            return new JsonResponse(['error' => 'Corpo da requisição inválido.'], 400);
        }

        $name = trim((string) ($data['name'] ?? ''));
        $description = trim((string) ($data['description'] ?? ''));
        if ($name === '') {
            return new JsonResponse(['error' => 'Informe o nome do curso.'], 422);
        }

        $course = (new Courses())->setName($name)->setDescription($description);
        $entityManager->persist($course);
        $entityManager->flush();

        return new JsonResponse($this->serializeCourse($course), 201);
    }

    /** @return array{id: int|null, name: string|null, description: string, createdAt: string|null} */
    public function serializeCourse(Courses $course): array
    {
        return [
            'id' => $course->getId(),
            'name' => $course->getName(),
            'description' => $course->getDescription(),
            'createdAt' => $course->getCreatedAt()?->format(DATE_ATOM),
        ];
    }
}
