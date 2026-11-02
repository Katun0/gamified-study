import {
  Box,
  Button,
  IconButton,
  InputAdornment,
  Stack,
  TextField,
  Typography,
} from "@mui/material";

import CloseIcon from "@mui/icons-material/Close";
// import PersonOutlineIcon from "@mui/icons-material/PersonOutline";
import EmailOutlinedIcon from "@mui/icons-material/EmailOutlined";
import LockOutlinedIcon from "@mui/icons-material/LockOutlined";
import PhoneOutlinedIcon from "@mui/icons-material/PhoneOutlined";
import CalendarTodayOutlinedIcon from "@mui/icons-material/CalendarTodayOutlined";
import VisibilityOutlinedIcon from "@mui/icons-material/VisibilityOutlined";
import VisibilityOffOutlinedIcon from "@mui/icons-material/VisibilityOffOutlined";

import { useState } from "react";
import { useNavigate } from "react-router-dom";

import { colors } from "../../theme/colors";

export default function Register() {
  const navigate = useNavigate();

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  return (
    <Box
      sx={{
        minHeight: "100vh",
        width: "100%",
        backgroundColor: colors.background,
        display: "flex",
        flexDirection: "column",
      }}
    >
      {/* Botão voltar */}
      <IconButton
        aria-label="Voltar"
        onClick={() => navigate("/")}
        sx={{
          position: "absolute",
          top: {
            xs: 12,
            sm: 18,
          },
          left: {
            xs: 12,
            sm: 18,
          },
          color: colors.textSecondary,

          "&:hover": {
            color: colors.text,
            backgroundColor: "rgba(255,255,255,0.05)",
          },
        }}
      >
        <CloseIcon />
      </IconButton>

      <Box
        sx={{
          width: "100%",
          maxWidth: 460,
          margin: "auto",
          px: {
            xs: 3,
            sm: 4,
          },
          py: {
            xs: 7,
            sm: 8,
          },
        }}
      >
        <Stack spacing={2}>
          {/* Logo */}
          <Box
            sx={{
              display: "flex",
              justifyContent: "center",
              mb: 1,
            }}
          >
            <Typography
              variant="h4"
              sx={{
                fontWeight: 800,
                letterSpacing: "-1px",
                textAlign: "center",
                background: `linear-gradient(90deg, ${colors.primary}, ${colors.secondary})`,
                backgroundClip: "text",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
              }}
            >
              Nome do nosso projeto
            </Typography>
          </Box>

          {/* Título */}
          <Typography
            variant="h5"
            align="center"
            sx={{
              fontWeight: 700,
              mb: 1,
            }}
          >
            Criar conta
          </Typography>

          <Typography
            variant="body2"
            align="center"
            sx={{
              color: colors.textSecondary,
              mb: 1,
            }}
          >
            Crie sua conta e comece sua jornada de aprendizagem.
          </Typography>

          {/* Nome */}
          <TextField
            fullWidth
            placeholder="Nome"
            type="text"
            slotProps={{
              input: {
                startAdornment: (
                  <InputAdornment position="start">
                    {/* <PersonOutlineIcon
                      sx={{ color: colors.textSecondary }}
                    /> */}
                  </InputAdornment>
                ),
                sx: {
                  backgroundColor: colors.surface,
                  borderRadius: 2,
                },
              },
            }}
          />

          {/* E-mail */}
          <TextField
            fullWidth
            placeholder="E-mail"
            type="email"
            slotProps={{
              input: {
                startAdornment: (
                  <InputAdornment position="start">
                    <EmailOutlinedIcon
                      sx={{ color: colors.textSecondary }}
                    />
                  </InputAdornment>
                ),
                sx: {
                  backgroundColor: colors.surface,
                  borderRadius: 2,
                },
              },
            }}
          />

          {/* Senha */}
          <TextField
            fullWidth
            placeholder="Senha"
            type={showPassword ? "text" : "password"}
            slotProps={{
              input: {
                startAdornment: (
                  <InputAdornment position="start">
                    <LockOutlinedIcon
                      sx={{ color: colors.textSecondary }}
                    />
                  </InputAdornment>
                ),

                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton
                      aria-label="Mostrar senha"
                      onClick={() => setShowPassword(!showPassword)}
                      edge="end"
                      sx={{
                        color: colors.textSecondary,

                        "&:hover": {
                          color: colors.text,
                        },
                      }}
                    >
                      {showPassword ? (
                        <VisibilityOffOutlinedIcon />
                      ) : (
                        <VisibilityOutlinedIcon />
                      )}
                    </IconButton>
                  </InputAdornment>
                ),

                sx: {
                  backgroundColor: colors.surface,
                  borderRadius: 2,
                },
              },
            }}
          />

          {/* Confirmar senha */}
          <TextField
            fullWidth
            placeholder="Confirmar senha"
            type={showConfirmPassword ? "text" : "password"}
            slotProps={{
              input: {
                startAdornment: (
                  <InputAdornment position="start">
                    <LockOutlinedIcon
                      sx={{ color: colors.textSecondary }}
                    />
                  </InputAdornment>
                ),

                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton
                      aria-label="Mostrar confirmação de senha"
                      onClick={() =>
                        setShowConfirmPassword(!showConfirmPassword)
                      }
                      edge="end"
                      sx={{
                        color: colors.textSecondary,

                        "&:hover": {
                          color: colors.text,
                        },
                      }}
                    >
                      {showConfirmPassword ? (
                        <VisibilityOffOutlinedIcon />
                      ) : (
                        <VisibilityOutlinedIcon />
                      )}
                    </IconButton>
                  </InputAdornment>
                ),

                sx: {
                  backgroundColor: colors.surface,
                  borderRadius: 2,
                },
              },
            }}
          />

          {/* Telefone */}
          <TextField
            fullWidth
            placeholder="Número de telefone"
            type="tel"
            slotProps={{
              input: {
                startAdornment: (
                  <InputAdornment position="start">
                    <PhoneOutlinedIcon
                      sx={{ color: colors.textSecondary }}
                    />
                  </InputAdornment>
                ),
                sx: {
                  backgroundColor: colors.surface,
                  borderRadius: 2,
                },
              },
            }}
          />

          {/* Data de nascimento */}
          <TextField
            fullWidth
            placeholder="Data de nascimento"
            type="date"
            slotProps={{
              input: {
                startAdornment: (
                  <InputAdornment position="start">
                    <CalendarTodayOutlinedIcon
                      sx={{ color: colors.textSecondary }}
                    />
                  </InputAdornment>
                ),
                sx: {
                  backgroundColor: colors.surface,
                  borderRadius: 2,
                },
              },
              inputLabel: {
                shrink: true,
              },
            }}
          />

          {/* Criar conta */}
          <Button
            fullWidth
            variant="contained"
            color="primary"
            sx={{
              mt: 1,
              minHeight: 50,
              fontWeight: 800,
              letterSpacing: "0.5px",
              boxShadow: `0 4px 0 ${colors.primaryDark}`,

              "&:active": {
                transform: "translateY(2px)",
                boxShadow: `0 2px 0 ${colors.primaryDark}`,
              },
            }}
          >
            Criar conta
          </Button>

          {/* Voltar para login */}
          <Typography
            variant="body2"
            align="center"
            sx={{
              color: colors.textSecondary,
              mt: 1,
            }}
          >
            Já possui uma conta?{" "}
            <Box
              component="span"
              onClick={() => navigate("/login")}
              sx={{
                color: colors.primary,
                fontWeight: 700,
                cursor: "pointer",

                "&:hover": {
                  textDecoration: "underline",
                },
              }}
            >
              Entrar
            </Box>
          </Typography>

          <Typography
            variant="caption"
            align="center"
            sx={{
              color: colors.textSecondary,
              opacity: 0.8,
              lineHeight: 1.6,
              mt: 1,
            }}
          >
            Ao criar uma conta no ..., você concorda
            <br />
            com os nossos Termos de Uso e Política de Privacidade.
          </Typography>
        </Stack>
      </Box>
    </Box>
  );
}