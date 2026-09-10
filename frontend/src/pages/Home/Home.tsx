import { useEffect, useRef } from "react";

import {
  Box,
  Button,
  Card,
  CardContent,
  Container,
  IconButton,
  Stack,
  Typography,
} from "@mui/material";

import ArrowBackIosNewIcon from "@mui/icons-material/ArrowBackIosNew";
import ArrowForwardIosIcon from "@mui/icons-material/ArrowForwardIos";
import LightbulbIcon from "@mui/icons-material/Lightbulb";
import GoogleIcon from "@mui/icons-material/Google";

import { useNavigate } from "react-router-dom";

import { colors } from "../../theme/colors";

const languages = [
  {
    name: "Python",
    description: "Aprenda Python do básico ao avançado",
    symbol: "Py",
    color: "#3776AB",
  },
  {
    name: "JavaScript",
    description: "Domine a linguagem da web",
    symbol: "JS",
    color: "#F7DF1E",
  },
  {
    name: "PHP",
    description: "Desenvolva aplicações web",
    symbol: "PHP",
    color: "#777BB4",
  },
  {
    name: "Portugol",
    description: "Aprenda lógica de programação",
    symbol: "P",
    color: "#8B5CF6",
    icon: "lightbulb",
  },
];

export default function Home() {
  const navigate = useNavigate();

  const carouselRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    window.scrollTo({
      top: 0,
      behavior: "instant",
    });
  }, []);

  const scrollLanguages = (direction: "left" | "right") => {
    if (!carouselRef.current) return;

    carouselRef.current.scrollBy({
      left: direction === "right" ? 280 : -280,
      behavior: "smooth",
    });
  };

  const handleGoogleLogin = () => {
    window.open(
      "https://accounts.google.com/",
      "_blank",
      "noopener,noreferrer",
    );
  };

  return (
    <Box
      sx={{
        width: "100%",
        minHeight: "100vh",
        backgroundColor: "#F2F5F7",
        overflowX: "hidden",
      }}
    >
     {/* header */}

      <Box
        component="header"
        sx={{
          width: "100%",
          height: {
            xs: 64,
            md: 56,
          },
          backgroundColor: "#171F25",
          borderBottom: `1px solid ${colors.border}`,
          display: "flex",
          alignItems: "center",
          position: "relative",
          zIndex: 10,
        }}
      >
        <Container
          maxWidth="lg"
          sx={{
            height: "100%",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            px: {
              xs: 2,
              sm: 3,
              md: 0,
            },
          }}
        >
          {/* Nome do projeto */}

          <Typography
            onClick={() => navigate("/")}
            sx={{
              cursor: "pointer",
              whiteSpace: "nowrap",
              fontSize: {
                xs: "1.05rem",
                sm: "1.2rem",
              },
              fontWeight: 800,
              background: `linear-gradient(
                90deg,
                ${colors.primary},
                ${colors.secondary}
              )`,
              backgroundClip: "text",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
            }}
          >
            Sei la
          </Typography>

          {/* Navegação */}

          <Stack
            direction="row"
            spacing={3}
            sx={{
              display: {
                xs: "none",
                md: "flex",
              },
              ml: 4,
            }}
          >
            <Button
              sx={{
                color: colors.text,
                fontWeight: 600,
                minWidth: "auto",

                "&:hover": {
                  color: colors.primary,
                  backgroundColor: "transparent",
                },
              }}
            >
              Trilhas
            </Button>

            <Button
              sx={{
                color: colors.text,
                fontWeight: 600,
                minWidth: "auto",

                "&:hover": {
                  color: colors.primary,
                  backgroundColor: "transparent",
                },
              }}
            >
              Treino
            </Button>
          </Stack>

          {/* Ações */}

          <Stack
            direction="row"
            spacing={{
              xs: 1,
              sm: 1.5,
            }}
          >
            <Button
              variant="outlined"
              onClick={() => navigate("/login")}
              sx={{
                minHeight: 38,
                px: {
                  xs: 1.5,
                  sm: 3,
                },
                borderColor: colors.primary,
                color: colors.primary,
                fontWeight: 700,
                fontSize: {
                  xs: "0.65rem",
                  sm: "0.8rem",
                },

                "&:hover": {
                  borderColor: colors.primary,
                  backgroundColor: "rgba(66,181,245,0.08)",
                },
              }}
            >
              Iniciar sessão
            </Button>

            <Button
              variant="contained"
              onClick={() => navigate("/register")}
              sx={{
                minHeight: 38,
                px: {
                  xs: 1.5,
                  sm: 3,
                },
                fontWeight: 700,
                fontSize: {
                  xs: "0.65rem",
                  sm: "0.8rem",
                },
                backgroundColor: colors.primary,
                color: "#081218",

                "&:hover": {
                  backgroundColor: colors.primaryDark,
                },
              }}
            >
              Registrar
            </Button>
          </Stack>
        </Container>
      </Box>



      <Box
        component="section"
        sx={{
            width: "100%",
            minHeight: {
            xs: 500,
            sm: 510,
            md: 600,
            },
            height: "auto",
            backgroundColor: colors.background,
            position: "relative",
            overflow: "hidden",
        }}
        >
        {/* Decorações */}

        <Box
          sx={{
            position: "absolute",
            top: 55,
            left: "22%",
            width: 7,
            height: 7,
            borderRadius: "50%",
            backgroundColor: colors.secondary,
            opacity: 0.8,
          }}
        />

        <Box
          sx={{
            position: "absolute",
            top: 105,
            left: "18%",
            width: 5,
            height: 5,
            borderRadius: "50%",
            backgroundColor: colors.primary,
          }}
        />

        <Box
          sx={{
            position: "absolute",
            top: 80,
            right: "22%",
            width: 8,
            height: 8,
            borderRadius: "50%",
            backgroundColor: colors.secondary,
            opacity: 0.8,
          }}
        />

        <Box
          sx={{
            position: "absolute",
            top: 150,
            right: "18%",
            width: 5,
            height: 5,
            borderRadius: "50%",
            backgroundColor: colors.primary,
          }}
        />

        <Container
            maxWidth="md"
            sx={{
                position: "relative",
                zIndex: 1,
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                textAlign: "center",

                pt: {
                xs: 7,
                md: 4,
                },

                pb: {
                xs: 6,
                md: 12,
                },

                px: 3,
            }}
        >
          {/* Título */}

          <Typography
            component="h1"
            sx={{
              color: colors.text,
              fontWeight: 800,
              fontSize: {
                xs: "2rem",
                sm: "2.5rem",
                md: "3rem",
              },
              lineHeight: 1.15,
              letterSpacing: "-1px",
              maxWidth: 850,
            }}
          >
            Aprender a programar ficou mais simples.
          </Typography>

          {/* Descrição */}

          <Typography
            sx={{
              color: "#D2DDE2",
              fontSize: {
                xs: "1rem",
                sm: "1.15rem",
              },
              lineHeight: 1.55,
              mt: 2,
              maxWidth: 650,
            }}
          >
            Aprenda as tecnologias mais recentes com trilhas
            <br />
            interativas e práticas.{" "}
            <Box
              component="span"
              sx={{
                color: colors.text,
                fontWeight: 800,
              }}
            >
              É gratuito.
            </Box>
          </Typography>

          {/* Google */}

          <Button
            variant="contained"
            onClick={handleGoogleLogin}
            startIcon={<GoogleIcon />}
            sx={{
              mt: 5,
              width: {
                xs: "100%",
                sm: 315,
              },
              minHeight: 48,
              backgroundColor: colors.primary,
              color: "#081218",
              fontWeight: 800,
              borderRadius: 1,

              "&:hover": {
                backgroundColor: colors.primaryDark,
              },
            }}
          >
            Iniciar sessão com Google
          </Button>

          {/* Divisor */}

          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              gap: 1.5,
              width: {
                xs: "100%",
                sm: 315,
              },
              my: 3,
            }}
          >
            <Box
              sx={{
                flex: 1,
                height: "1px",
                backgroundColor: colors.border,
              }}
            />

            <Typography
              sx={{
                color: colors.textSecondary,
                fontSize: "0.8rem",
                fontWeight: 700,
              }}
            >
              OU
            </Typography>

            <Box
              sx={{
                flex: 1,
                height: "1px",
                backgroundColor: colors.border,
              }}
            />
          </Box>

          {/* Mais opções */}

          <Button
            variant="outlined"
            onClick={() => navigate("/login")}
            sx={{
              width: {
                xs: "100%",
                sm: 315,
              },
              minHeight: 40,
              borderColor: colors.primary,
              color: colors.primary,
              fontWeight: 700,
              borderRadius: 1,

              "&:hover": {
                borderColor: colors.primary,
                backgroundColor: "rgba(66,181,245,0.06)",
              },
            }}
          >
            Mais opções
          </Button>
        </Container>
      </Box>

      {/* Linguagens */}

      <Box
        component="section"
        sx={{
          width: "100%",
          position: "relative",
          zIndex: 5,

          marginTop: {
            xs: 0,
            md: -20,
          },

          paddingBottom: 6,
        }}
      >
        <Container
          maxWidth="lg"
          sx={{
            px: {
              xs: 0,
              sm: 2,
              md: 0,
            },
          }}
        >
          <Box
            sx={{
              backgroundColor: colors.white,
              borderRadius: {
                xs: 0,
                sm: 1,
                md: 1,
              },

              minHeight: {
                xs: 330,
                md: 325,
              },

              px: {
                xs: 2,
                sm: 4,
                md: 5,
              },

              py: {
                xs: 4,
                md: 4,
              },

              boxShadow: "0 8px 30px rgba(15, 27, 33, 0.08)",
            }}
          >
            {/* Título */}

            <Typography
              component="h2"
              align="center"
              sx={{
                color: "#111A20",
                fontWeight: 800,
                fontSize: {
                  xs: "1.6rem",
                  sm: "2rem",
                },
                mb: 3,
              }}
            >
              Escolha sua Linguagem
            </Typography>

            {/* Carrossel */}

            <Box
              sx={{
                position: "relative",
                display: "flex",
                alignItems: "center",
              }}
            >
              {/* Seta */}

              <IconButton
                onClick={() => scrollLanguages("left")}
                aria-label="Linguagem anterior"
                sx={{
                  position: "absolute",
                  left: {
                    xs: -10,
                    sm: -25,
                    md: -38,
                  },
                  zIndex: 3,
                  color: colors.primary,
                  backgroundColor: colors.white,

                  "&:hover": {
                    backgroundColor: "#F0F5F8",
                  },
                }}
              >
                <ArrowBackIosNewIcon fontSize="small" />
              </IconButton>

              {/* Lista */}

              <Box
                ref={carouselRef}
                sx={{
                  width: "100%",
                  display: "flex",
                  gap: 2,

                  overflowX: "auto",

                  scrollBehavior: "smooth",

                  scrollbarWidth: "none",

                  "&::-webkit-scrollbar": {
                    display: "none",
                  },

                  px: {
                    xs: 1,
                    md: 0,
                  },
                }}
              >
                {languages.map((language) => (
                  <Card
                    key={language.name}
                    sx={{
                      flex: {
                        xs: "0 0 220px",
                        sm: "0 0 220px",
                        md: "1 0 0",
                      },

                      height: 190,

                      backgroundColor: "#EAF1F5",

                      borderRadius: 2,

                      boxShadow: "none",

                      cursor: "pointer",

                      transition: "transform 0.2s ease, box-shadow 0.2s ease",

                      "&:hover": {
                        transform: "translateY(-4px)",
                        boxShadow: "0 8px 20px rgba(15,27,33,0.1)",
                      },
                    }}
                  >
                    <CardContent
                      sx={{
                        height: "100%",
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "center",
                        justifyContent: "center",
                        textAlign: "center",
                        p: 2,
                      }}
                    >
                      {/* Ícone */}

                      <Box
                        sx={{
                          width: 74,
                          height: 74,
                          borderRadius: "50%",
                          backgroundColor: language.color,
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          mb: 1.5,
                          boxShadow: "0 5px 12px rgba(15,27,33,0.15)",
                        }}
                      >
                        {language.icon === "lightbulb" ? (
                          <LightbulbIcon
                            sx={{
                              color: colors.white,
                              fontSize: 42,
                            }}
                          />
                        ) : (
                          <Typography
                            sx={{
                              color:
                                language.name === "JavaScript"
                                  ? "#111"
                                  : colors.white,
                              fontWeight: 900,
                              fontSize:
                                language.name === "PHP" ? "0.85rem" : "1.3rem",
                              letterSpacing: "-0.5px",
                            }}
                          >
                            {language.symbol}
                          </Typography>
                        )}
                      </Box>

                      {/* Nome */}

                      <Typography
                        sx={{
                          color: "#17232A",
                          fontWeight: 800,
                          fontSize: "1.05rem",
                        }}
                      >
                        {language.name}
                      </Typography>

                      {/* Descrição */}

                      <Typography
                        sx={{
                          color: "#6B7B84",
                          fontSize: "0.75rem",
                          lineHeight: 1.35,
                          mt: 0.5,
                          maxWidth: 180,
                        }}
                      >
                        {language.description}
                      </Typography>
                    </CardContent>
                  </Card>
                ))}
              </Box>

              {/* Seta */}

              <IconButton
                onClick={() => scrollLanguages("right")}
                aria-label="Próxima linguagem"
                sx={{
                  position: "absolute",
                  right: {
                    xs: -10,
                    sm: -25,
                    md: -38,
                  },
                  zIndex: 3,
                  color: colors.primary,
                  backgroundColor: colors.white,

                  "&:hover": {
                    backgroundColor: "#F0F5F8",
                  },
                }}
              >
                <ArrowForwardIosIcon fontSize="small" />
              </IconButton>
            </Box>
          </Box>
        </Container>
      </Box>
    </Box>
  );
}
