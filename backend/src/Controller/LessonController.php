<?php

namespace App\Controller;

use App\Entity\Lesson;
use App\Entity\User;
use App\Progress\StudyProgress;
use Symfony\Component\Security\Http\Attribute\CurrentUser;
use App\Repository\CoursesRepository;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\Routing\Attribute\Route;

final class LessonController
{
    #[Route('/api/courses/{id}/lessons', name: 'api_course_lessons_list', methods: ['GET'])]
    public function list(int $id, CoursesRepository $courses, EntityManagerInterface $entityManager, StudyProgress $progress, #[CurrentUser] User $user): JsonResponse
    {
        $course = $courses->find($id);
        if (!$course) {
            return new JsonResponse(['error' => 'Curso não encontrado.'], 404);
        }

        $lessons = $entityManager->getRepository(Lesson::class)->findBy(['course' => $course], ['id' => 'ASC']);
        $states = $progress->course($id, $user);
        return new JsonResponse(array_map(function (Lesson $lesson) use ($states): array {
            $state = $states[$lesson->getId()];
            $data = $this->serializeLesson($lesson);
            $data['locked'] = $state['locked'];
            $data['completed'] = $state['completed'];
            $data['current'] = $state['current'] ?? false;
            $data['problemCount'] = count($state['problems']);
            if ($state['locked']) {
                $data['content'] = '';
            }
            return $data;
        }, $lessons), headers: ['Cache-Control' => 'no-store']);
    }

    #[Route('/api/lessons/{id<\d+>}/complete', methods: ['POST'])]
    public function complete(Lesson $lesson, StudyProgress $progress, #[CurrentUser] User $user): JsonResponse
    {
        $state = $progress->requireLesson($lesson, $user);
        if ($state['problems'] !== [] && !$state['completed']) {
            return new JsonResponse(['error' => 'Resolva todos os problemas desta lição.'], 409);
        }
        if ($state['problems'] === []) {
            $progress->completeReading($lesson, $user);
        }
        return new JsonResponse(['completed' => true]);
    }

    #[Route('/api/lessons', name: 'api_lessons_create', methods: ['POST'])]
    public function create(Request $request, CoursesRepository $courses, EntityManagerInterface $entityManager): JsonResponse
    {
        try {
            $data = json_decode($request->getContent(), true, 512, JSON_THROW_ON_ERROR);
        } catch (\JsonException) {
            return new JsonResponse(['error' => 'Corpo da requisição inválido.'], 400);
        }

        $title = trim((string) ($data['title'] ?? ''));
        $content = trim((string) ($data['content'] ?? ''));
        $courseId = filter_var($data['courseId'] ?? null, FILTER_VALIDATE_INT);
        if ($title === '' || $content === '' || $courseId === false) {
            return new JsonResponse(['error' => 'Informe o curso, o título e o conteúdo da lição.'], 422);
        }

        $course = $courses->find($courseId);
        if (!$course) {
            return new JsonResponse(['error' => 'Curso não encontrado.'], 404);
        }

        $lesson = (new Lesson())->setTitle($title)->setContent($content)->setCourse($course);
        $entityManager->persist($lesson);
        $entityManager->flush();

        return new JsonResponse($this->serializeLesson($lesson), 201);
    }

    /** @return array{id: int|null, title: string|null, content: string, courseId: int|null, createdAt: string|null} */
    private function serializeLesson(Lesson $lesson): array
    {
        return [
            'id' => $lesson->getId(),
            'title' => $lesson->getTitle(),
            'content' => $lesson->getContent(),
            'courseId' => $lesson->getCourse()?->getId(),
            'createdAt' => $lesson->getCreatedAt()?->format(DATE_ATOM),
        ];
    }
}
