import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import {
  Alert,
  Button,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
} from "@mui/material";
import {
  AutoAwesome,
  ArrowBack,
  ArrowForward,
  Close,
  CodeRounded,
  FlagRounded,
  LockRounded,
  MenuBookRounded,
  RouteRounded,
  SchoolRounded,
  StarRounded,
} from "@mui/icons-material";
import { apiRequest } from "../../lib/api";
import { useAuth, type Progression } from "../../auth/useAuth";
import "./Trail.css";
import LessonContent from "../../components/LessonContent";
import StudySidebar from "../../components/layout/StudySidebar";
import MotivationPanel from "../../components/MotivationPanel";
import LessonProblems from "../Problems/LessonProblems";

type Course = { id: number; name: string; description: string };
// Deslocamento horizontal de cada missão; a linha usa os mesmos pontos.
const NODE_OFFSETS = [0, -76, 0, 76] as const;
type Lesson = {
  id: number;
  title: string;
  content: string;
  courseId: number;
  locked: boolean;
  completed: boolean;
  current: boolean;
  problemCount: number;
  xpReward: number;
  xpEarned: number;
};

export default function Trail() {
  const { user, updateTotalXp } = useAuth();
  const [params, setParams] = useSearchParams();
  const [courses, setCourses] = useState<Course[]>([]);
  const [lessonData, setLessons] = useState<Lesson[]>([]);
  const [loadedCourseId, setLoadedCourseId] = useState<number | null>(null);
  const [loadingCourses, setLoadingCourses] = useState(true);
  const [loadingLessons, setLoadingLessons] = useState(false);
  const [error, setError] = useState("");
  const [retry, setRetry] = useState(0);
  const [opened, setOpened] = useState<number | null>(null);
  const [progressRevision, setProgressRevision] = useState(0);
  const [completing, setCompleting] = useState(false);
  const requestedId = Number(params.get("course"));
  const course = courses.find((item) => item.id === requestedId) ?? courses[0];
  const courseId = course?.id;
  const lessons = loadedCourseId === courseId ? lessonData : [];
  const waitingForLessons =
    !error &&
    (loadingLessons || Boolean(courseId && loadedCourseId !== courseId));
  const lesson = opened === null ? null : lessons[opened];
  const currentLessonIndex = lessons.findIndex((item) => !item.locked && !item.completed);

  useEffect(() => {
    let active = true;
    apiRequest<Course[]>("/api/courses")
      .then((items) => {
        if (active) setCourses(items);
      })
      .catch((cause) => {
        if (active)
          setError(
            cause instanceof Error
              ? cause.message
              : "Não foi possível carregar os cursos.",
          );
      })
      .finally(() => {
        if (active) setLoadingCourses(false);
      });
    return () => {
      active = false;
    };
  }, [retry]);

  useEffect(() => {
    if (!courseId) return;
    let active = true;
    apiRequest<Lesson[]>(`/api/courses/${courseId}/lessons`)
      .then((items) => {
        if (active) {
          setLessons(items);
          setLoadedCourseId(courseId);
        }
      })
      .catch((cause) => {
        if (active)
          setError(
            cause instanceof Error
              ? cause.message
              : "Não foi possível carregar as lições.",
          );
      })
      .finally(() => {
        if (active) setLoadingLessons(false);
      });
    return () => {
      active = false;
    };
  }, [courseId, retry, progressRevision]);

  const changeCourse = (id: string) => {
    setOpened(null);
    setLessons([]);
    setLoadingLessons(true);
    setError("");
    setParams({ course: id });
  };
  const completeReading = async () => {
    if (!lesson) return;
    setCompleting(true);
    setError("");
    try {
      const result = await apiRequest<{ totalXp: number; progression?: Progression }>(`/api/lessons/${lesson.id}/complete`, {
        method: "POST",
      });
      if (user) updateTotalXp(user.id, result.totalXp, result.progression);
      setProgressRevision((value) => value + 1);
    } catch (cause) {
      setError(
        cause instanceof Error
          ? cause.message
          : "Não foi possível concluir a lição.",
      );
    } finally {
      setCompleting(false);
    }
  };
  const retryLoading = () => {
    setError("");
    setLoadingCourses(true);
    setLoadingLessons(Boolean(courseId));
    setRetry((value) => value + 1);
  };

  return (
    <div className="trail-app">
      <StudySidebar current="trails" />
      <div className="trail-workspace">
        <header className="trail-topbar">
          <span>
            <RouteRounded /> Aprender
          </span>
          <span className="trail-topbar-note">
            <AutoAwesome /> Seu próximo passo começa aqui
          </span>
        </header>
        <div className="trail-columns">
          <main className="trail-main">
            <div className="trail-heading">
              <div>
                <span className="trail-eyebrow">APRENDA NO SEU RITMO</span>
                <h1>
                  Pequenos passos.
                  <br />
                  Grandes descobertas.
                </h1>
                <p>Escolha um curso e explore sua trilha de conhecimento.</p>
              </div>
              <div className="trail-heading-icon" aria-hidden="true">
                <RouteRounded />
              </div>
            </div>
            {error && (
              <Alert
                severity="error"
                action={
                  <Button color="inherit" onClick={retryLoading}>
                    Tentar novamente
                  </Button>
                }
              >
                {error}
              </Alert>
            )}
            {loadingCourses ? (
              <div className="trail-empty" role="status">
                <CircularProgress />
                <p>Preparando sua trilha...</p>
              </div>
            ) : courses.length === 0 ? (
              !error && (
                <div className="trail-empty">
                  <SchoolRounded />
                  <h2>Sua jornada começa em breve</h2>
                  <p>Os cursos aparecerão aqui assim que forem cadastrados.</p>
                </div>
              )
            ) : (
              <>
                <label className="trail-course-select">
                  SEU CURSO
                  <select
                    value={courseId}
                    onChange={(event) => changeCourse(event.target.value)}
                  >
                    {courses.map((item) => (
                      <option key={item.id} value={item.id}>
                        {item.name}
                      </option>
                    ))}
                  </select>
                </label>
                <section className="trail-unit" aria-label="Curso selecionado">
                  <div>
                    <span>TRILHA DE APRENDIZAGEM</span>
                    <h2>{course?.name}</h2>
                    <p>
                      {course?.description ||
                        "Explore as lições e construa seu conhecimento, passo a passo."}
                    </p>
                  </div>
                  <MenuBookRounded aria-hidden="true" />
                </section>
                {waitingForLessons ? (
                  <div className="trail-empty" role="status">
                    <CircularProgress />
                    <p>Carregando lições...</p>
                  </div>
                ) : !error && lessons.length === 0 ? (
                  <div className="trail-empty">
                    <MenuBookRounded />
                    <h2>Uma nova trilha está chegando</h2>
                    <p>
                      Este curso ainda não tem lições. Você pode explorar outro
                      curso enquanto isso.
                    </p>
                  </div>
                ) : (
                  !error && (
                    <>
                      <div className="trail-path-caption">
                        <span /> SUA JORNADA <span />
                      </div>
                       <ol className="trail-path" aria-label="Lições do curso">
                         {lessons.map((item, index) => {
                           const currentX = 160 + NODE_OFFSETS[index % 4];
                           const nextX = 160 + NODE_OFFSETS[(index + 1) % 4];
                           const midway = (currentX + nextX) / 2;
                           return (
                             <li
                               key={item.id}
                               className={`trail-step ${item.completed ? "is-completed" : ""} ${item.current ? "is-current" : ""} ${item.locked ? "is-locked" : ""}`}
                             >
                               {index < lessons.length - 1 && (
                                 <svg
                                   className={`trail-connector ${item.completed ? "is-completed" : ""}`}
                                   viewBox="0 0 320 190"
                                   aria-hidden="true"
                                   focusable="false"
                                 >
                                   <path d={`M ${currentX} 0 C ${currentX} 76, ${midway} 100, ${nextX} 190`} />
                                 </svg>
                               )}
                               <div
                                 className="trail-step-content"
                                 style={{ transform: `translateX(${NODE_OFFSETS[index % 4]}px)` }}
                               >
                                 {(item.current || (index === 0 && !item.locked && !item.completed)) && (
                                   <span className="trail-start-label">
                                     {item.current ? "CONTINUAR" : "COMECE AQUI"}
                                   </span>
                                 )}
                                 <button
                                   type="button"
                                   className={`trail-node ${item.current ? "trail-node-current" : ""} ${item.completed ? "trail-node-completed" : ""}`}
                                   disabled={item.locked}
                                   onClick={() => setOpened(index)}
                                   aria-label={`${item.locked ? "Lição bloqueada" : "Abrir lição"} ${index + 1}: ${item.title}`}
                                 >
                                   {item.locked ? (
                                     <LockRounded />
                                   ) : item.completed ? (
                                     <StarRounded />
                                   ) : item.current ? (
                                     <CodeRounded />
                                   ) : (
                                     <MenuBookRounded />
                                   )}
                                 </button>
                                 <span className="trail-step-number">
                                   MISSÃO {String(index + 1).padStart(2, "0")}
                                 </span>
                                 <h3>{item.title}</h3>
                                 <span className="trail-step-state">
                                   {item.completed ? "✓ Concluída" : item.locked ? "Bloqueada" : item.current ? "Em andamento" : "Disponível"}
                                 </span>
                               </div>
                             </li>
                           );
                         })}
                       </ol>
                      <div className="trail-finish">
                        <FlagRounded />
                        <h3>Conhecimento para levar adiante</h3>
                        <p>Volte às lições sempre que quiser revisar.</p>
                      </div>
                    </>
                  )
                )}
              </>
            )}
          </main>
           <aside className="trail-right" aria-label="Seu painel de aventura">
             {user && <MotivationPanel key={user.id} revision={progressRevision} />}
             <section className="trail-tip-card">
               <div className="trail-tip-symbol" aria-hidden="true"><AutoAwesome /></div>
               <span className="trail-eyebrow">PRÓXIMA MISSÃO</span>
               <h2>Um passo<br />de cada vez.</h2>
               <p>Avance pela trilha, pratique e conquiste novas habilidades.</p>
               {currentLessonIndex >= 0 && !waitingForLessons && !error && (
                 <button type="button" className="trail-primary-button" onClick={() => setOpened(currentLessonIndex)}>
                   Continuar aventura <ArrowForward />
                 </button>
               )}
             </section>
             <section className="trail-info-card">
               <h3><MenuBookRounded /> Nesta trilha</h3>
               <div><strong>{waitingForLessons ? "—" : lessons.filter((item) => item.completed).length}/{lessons.length}</strong><span>lições concluídas</span></div>
               <p>As missões são liberadas à medida que você avança.</p>
             </section>
           </aside>
        </div>
      </div>
      <Dialog
        open={Boolean(lesson)}
        onClose={() => setOpened(null)}
        fullWidth
        maxWidth="md"
        aria-labelledby="trail-lesson-title"
        slotProps={{ paper: { className: "trail-lesson-dialog" } }}
      >
        {lesson && (
          <>
            <DialogTitle id="trail-lesson-title">
              <span className="trail-eyebrow">
                {course?.name} · LIÇÃO {(opened ?? 0) + 1} DE {lessons.length}
              </span>
              <span className="trail-dialog-heading">
                {lesson.title}
                <button
                  aria-label="Fechar lição"
                  onClick={() => setOpened(null)}
                >
                  <Close />
                </button>
              </span>
            </DialogTitle>
            <DialogContent dividers key={lesson.id}>
              {lesson.locked ? (
                <Alert severity="info">
                  Conclua as lições anteriores para acessar esta lição.
                </Alert>
              ) : (
                <>
                  <div className="trail-lesson-content">
                    <LessonContent content={lesson.content} />
                  </div>
                  <LessonProblems
                    key={lesson.id}
                    lessonId={lesson.id}
                    onProgress={() => setProgressRevision((value) => value + 1)}
                  />
                  {lesson.completed && (
                    <Alert severity="success" sx={{ mt: 2 }}>
                      Lição concluída. {lesson.xpEarned} XP conquistados.
                    </Alert>
                  )}
                  {lesson.problemCount === 0 && !lesson.completed && (
                    <Button
                      sx={{ mt: 2 }}
                      variant="contained"
                      disabled={completing}
                      onClick={completeReading}
                    >
                      {completing ? "Salvando…" : `Concluir leitura · ${lesson.xpReward} XP`}
                    </Button>
                  )}
                  {error && (
                    <Alert severity="error" sx={{ mt: 2 }}>
                      {error}
                    </Alert>
                  )}
                  {user?.roles.includes("ROLE_ADMIN") && (
                    <Button
                      component={Link}
                      to={`/problems/new?course=${lesson.courseId}&lesson=${lesson.id}`}
                      sx={{ mt: 2 }}
                    >
                      Adicionar Desafio nesta lição
                    </Button>   
                  )}
                </>
              )}
            </DialogContent>
            <DialogActions
              sx={{
                p: 2,
                justifyContent: "space-between",
                flexWrap: "wrap",
                gap: 1,
              }}
            >
              <Button
                startIcon={<ArrowBack />}
                disabled={opened === 0}
                onClick={() =>
                  setOpened((value) => Math.max(0, (value ?? 0) - 1))
                }
              >
                Anterior
              </Button>
              {opened === lessons.length - 1 ? (
                <Button variant="contained" onClick={() => setOpened(null)}>
                  Voltar à trilha
                </Button>
              ) : (
                <Button
                  variant="contained"
                  disabled={lessons[(opened ?? 0) + 1]?.locked}
                  endIcon={
                    lessons[(opened ?? 0) + 1]?.locked ? (
                      <LockRounded />
                    ) : (
                      <ArrowForward />
                    )
                  }
                  onClick={() => setOpened((value) => (value ?? 0) + 1)}
                >
                  Próxima lição
                </Button>
              )}
            </DialogActions>
          </>
        )}
      </Dialog>
    </div>
  );
}
