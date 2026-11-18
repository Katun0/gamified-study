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
  HomeRounded,
  LogoutRounded,
  MenuBookRounded,
  RouteRounded,
  SchoolRounded,
  StarRounded,
} from "@mui/icons-material";
import { apiRequest } from "../../lib/api";
import { useAuth } from "../../auth/useAuth";
import "./Trail.css";
import LessonProblems from "../Problems/LessonProblems";

type Course = { id: number; name: string; description: string };
type Lesson = { id: number; title: string; content: string; courseId: number };

export default function Trail() {
  const { user, logout } = useAuth();
  const [params, setParams] = useSearchParams();
  const [courses, setCourses] = useState<Course[]>([]);
  const [lessonData, setLessons] = useState<Lesson[]>([]);
  const [loadedCourseId, setLoadedCourseId] = useState<number | null>(null);
  const [loadingCourses, setLoadingCourses] = useState(true);
  const [loadingLessons, setLoadingLessons] = useState(false);
  const [error, setError] = useState("");
  const [retry, setRetry] = useState(0);
  const [opened, setOpened] = useState<number | null>(null);
  const requestedId = Number(params.get("course"));
  const course = courses.find((item) => item.id === requestedId) ?? courses[0];
  const courseId = course?.id;
  const lessons = loadedCourseId === courseId ? lessonData : [];
  const waitingForLessons =
    !error &&
    (loadingLessons || Boolean(courseId && loadedCourseId !== courseId));
  const lesson = opened === null ? null : lessons[opened];

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
  }, [courseId, retry]);

  const changeCourse = (id: string) => {
    setOpened(null);
    setLessons([]);
    setLoadingLessons(true);
    setError("");
    setParams({ course: id });
  };
  const retryLoading = () => {
    setError("");
    setLoadingCourses(true);
    setLoadingLessons(Boolean(courseId));
    setRetry((value) => value + 1);
  };

  return (
    <div className="trail-app">
      <aside className="trail-sidebar">
        <Link className="trail-brand" to="/">
          <span>
            <CodeRounded />
          </span>
          Study<span className="trail-brand-accent">Quest</span>
        </Link>
        <span className="trail-nav-label">SUA JORNADA</span>
        <nav aria-label="Navegação principal">
          <Link className="trail-nav-active" to="/trails" aria-current="page">
            <RouteRounded /> Minha trilha
          </Link>
          <Link to="/">
            <HomeRounded /> Início
          </Link>
          {user?.roles.includes("ROLE_ADMIN") && (
            <Link to="/courses/new">
              <SchoolRounded /> Criar curso
            </Link>
          )}
          {user?.roles.includes("ROLE_ADMIN") && (
            <Link to="/problems/new">
              <CodeRounded /> Criar problema
            </Link>
          )}
        </nav>
        <div className="trail-sidebar-bottom">
          <div className="trail-avatar">
            {user?.name.charAt(0).toUpperCase()}
          </div>
          <div>
            <strong>{user?.name}</strong>
            <small>Um passo de cada vez</small>
          </div>
          <button aria-label="Sair da conta" onClick={logout}>
            <LogoutRounded />
          </button>
        </div>
      </aside>

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
                        {lessons.map((item, index) => (
                          <li
                            key={item.id}
                            className={`trail-step trail-step-${index % 4}`}
                          >
                            {index === 0 && (
                              <span className="trail-start-label">
                                COMECE AQUI
                              </span>
                            )}
                            <button
                              className={`trail-node ${index === 0 ? "trail-node-first" : ""}`}
                              onClick={() => setOpened(index)}
                              aria-label={`Abrir lição ${index + 1}: ${item.title}`}
                            >
                              {index === 0 ? (
                                <StarRounded />
                              ) : index % 3 === 0 ? (
                                <CodeRounded />
                              ) : (
                                <MenuBookRounded />
                              )}
                            </button>
                            <span className="trail-step-number">
                              LIÇÃO {String(index + 1).padStart(2, "0")}
                            </span>
                            <h3>{item.title}</h3>
                          </li>
                        ))}
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
          <aside className="trail-right">
            <section className="trail-tip-card">
              <div className="trail-tip-symbol">
                <AutoAwesome />
              </div>
              <span className="trail-eyebrow">CADA PASSO CONTA</span>
              <h2>
                O importante
                <br />é começar.
              </h2>
              <p>
                Reserve um momento do seu dia para aprender algo novo. Sua
                próxima descoberta está a uma lição de distância.
              </p>
              {lessons.length > 0 && !loadingLessons && !error && (
                <button
                  className="trail-primary-button"
                  onClick={() => setOpened(0)}
                >
                  Explorar primeira lição <ArrowForward />
                </button>
              )}
            </section>
            <section className="trail-info-card">
              <h3>
                <MenuBookRounded /> Nesta trilha
              </h3>
              <div>
                <strong>{loadingLessons ? "—" : lessons.length}</strong>
                <span>lições para explorar</span>
              </div>
              <p>
                Leia, experimente e revise.
                <br />
                Todas as lições estão disponíveis para você.
              </p>
            </section>
            <p className="trail-footer-note">
              Feito para mentes curiosas.
              <br />
              Uma descoberta de cada vez.
            </p>
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
              <div className="trail-lesson-content">{lesson.content}</div>
              <LessonProblems key={lesson.id} lessonId={lesson.id} />
              {user?.roles.includes("ROLE_ADMIN") && (
                <Button
                  component={Link}
                  to={`/problems/new?course=${lesson.courseId}&lesson=${lesson.id}`}
                  sx={{ mt: 2 }}
                >
                  Adicionar problema nesta lição
                </Button>
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
                  endIcon={<ArrowForward />}
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
