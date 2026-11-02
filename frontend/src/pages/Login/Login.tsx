import {
  Box,
  Button,
  Divider,
  IconButton,
  Stack,
  TextField,
  Typography,
} from "@mui/material";

import CloseIcon from "@mui/icons-material/Close";
import GoogleIcon from "@mui/icons-material/Google";
import FacebookIcon from "@mui/icons-material/Facebook";

import { colors } from "../../theme/colors";
import { useNavigate } from "react-router-dom";

export default function Login() {
  
  const navigate = useNavigate()

  const handleGoogleLogin = () => {
    window.open(
      "https://accounts.google.com/",
      "_blank",
      "noopener,noreferrer"
    );
  }

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
      {/* Botão fechar */}
      <IconButton
        aria-label="Fechar"
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

      {/* Criar conta */}
      <Button
        variant="outlined"
        color="primary"
        onClick={() => navigate("/register")}
        sx={{
          position: "absolute",
          top: {
            xs: 12,
            sm: 18,
          },
          right: {
            xs: 12,
            sm: 18,
          },
          borderColor: colors.border,
          color: colors.primary,
          fontSize: {
            xs: "0.7rem",
            sm: "0.8rem",
          },
          fontWeight: 700,
          px: {
            xs: 1.5,
            sm: 2,
          },

          "&:hover": {
            borderColor: colors.primary,
            backgroundColor: "rgba(66,181,245,0.05)",
          },
        }}
      >
        Criar conta
      </Button>

      <Box
        sx={{
          width: "100%",
          maxWidth: 420,
          margin: "auto",
          px: 3,
          py: 10,
        }}
      >
        <Stack spacing={2}>
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
                background: `linear-gradient(90deg, ${colors.primary}, ${colors.secondary})`,
                backgroundClip: "text",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
              }}
            >
              Nome do nosso projeto
            </Typography>
          </Box>

          <Typography
            variant="h5"
            align="center"
            sx={{
              fontWeight: 700,
              mb: 1,
            }}
          >
            Entrar
          </Typography>

          {/* E-mail */}
          <TextField
            fullWidth
            placeholder="E-mail ou nome de usuário"
            type="email"
            slotProps={{
              input: {
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
            type="password"
            slotProps={{
              input: {
                sx: {
                  backgroundColor: colors.surface,
                  borderRadius: 2,
                },

                endAdornment: (
                  <Button
                    size="small"
                    sx={{
                      color: colors.textSecondary,
                      fontSize: "0.7rem",
                      fontWeight: 700,
                      minWidth: "auto",
                    }}
                  >
                    Esqueceu?
                  </Button>
                ),
              },
            }}
          />

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
            Entrar
          </Button>

          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              gap: 1.5,
              py: 1,
            }}
          >
            <Divider sx={{ flex: 1, borderColor: colors.border }} />

            <Typography
              variant="body2"
              sx={{
                color: colors.textSecondary,
                fontWeight: 700,
              }}
            >
              OU
            </Typography>

            <Divider sx={{ flex: 1, borderColor: colors.border }} />
          </Box>

          {/* Login social */}
          <Stack direction="row" spacing={1.5}>
            <Button
              fullWidth
              variant="outlined"
              onClick={handleGoogleLogin}
              startIcon={<GoogleIcon />}
              sx={{
                borderColor: colors.border,
                color: colors.textSecondary,
                minHeight: 48,

                "&:hover": {
                  borderColor: colors.primary,
                  color: colors.text,
                },
              }}
            >
              Google
            </Button>

            <Button
              fullWidth
              variant="outlined"
              startIcon={<FacebookIcon />}
              sx={{
                borderColor: colors.border,
                color: colors.textSecondary,
                minHeight: 48,

                "&:hover": {
                  borderColor: colors.primary,
                  color: colors.text,
                },
              }}
            >
              Facebook
            </Button>
          </Stack>

          {/* Termos */}
          <Typography
            variant="caption"
            align="center"
            sx={{
              color: colors.textSecondary,
              opacity: 0.8,
              lineHeight: 1.6,
              mt: 2,
            }}
          >
            Ao entrar no ..., você concorda com os nossos
            <br />
            Termos de Uso e Política de Privacidade.
          </Typography>
        </Stack>
      </Box>
    </Box>
  );
}