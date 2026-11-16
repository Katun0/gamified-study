import { createTheme } from "@mui/material/styles";

import { colors } from "./colors";

export const theme = createTheme({
  palette: {
    mode: "dark",

    primary: {
      main: colors.primary,
      dark: colors.primaryDark,
      contrastText: "#081218",
    },

    secondary: {
      main: colors.secondary,
      dark: colors.secondaryDark,
      contrastText: colors.white,
    },

    background: {
      default: colors.background,
      paper: colors.surface,
    },

    text: {
      primary: colors.text,
      secondary: colors.textSecondary,
    },

    success: {
      main: colors.success,
    },

    warning: {
      main: colors.warning,
    },

    error: {
      main: colors.error,
    },
  },

  typography: {
    fontFamily: "'Inter', 'Roboto', sans-serif",

    h1: {
      fontWeight: 700,
    },

    h2: {
      fontWeight: 700,
    },

    h3: {
      fontWeight: 700,
    },

    button: {
      fontWeight: 700,
      textTransform: "none",
    },
  },

  shape: {
    borderRadius: 10,
  },

  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 10,
          minHeight: 48,
        },
      },
    },

    MuiTextField: {
      defaultProps: {
        variant: "outlined",
      },
    },
  },
});