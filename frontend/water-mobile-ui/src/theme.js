import { createTheme } from "@mui/material/styles"

const theme = createTheme({
  palette: {
    primary: {
      main: "#0f5fa8"
    },
    secondary: {
      main: "#cf6b2c"
    },
    success: {
      main: "#2f7d5c"
    },
    background: {
      default: "#f7efe2",
      paper: "#fffaf4"
    },
    text: {
      primary: "#173042",
      secondary: "#5f7383"
    }
  },
  shape: {
    borderRadius: 22
  },
  typography: {
    fontFamily: "\"Trebuchet MS\", \"Lucida Sans Unicode\", sans-serif",
    h1: {
      fontFamily: "\"Palatino Linotype\", \"Book Antiqua\", Georgia, serif",
      fontWeight: 700
    },
    h2: {
      fontFamily: "\"Palatino Linotype\", \"Book Antiqua\", Georgia, serif",
      fontWeight: 700
    },
    h3: {
      fontFamily: "\"Palatino Linotype\", \"Book Antiqua\", Georgia, serif",
      fontWeight: 700
    },
    h4: {
      fontFamily: "\"Palatino Linotype\", \"Book Antiqua\", Georgia, serif",
      fontWeight: 700
    },
    h5: {
      fontFamily: "\"Palatino Linotype\", \"Book Antiqua\", Georgia, serif",
      fontWeight: 700
    },
    h6: {
      fontFamily: "\"Palatino Linotype\", \"Book Antiqua\", Georgia, serif",
      fontWeight: 700
    },
    button: {
      fontWeight: 700,
      textTransform: "none",
      letterSpacing: "0.02em"
    }
  },
  components: {
    MuiPaper: {
      styleOverrides: {
        root: {
          backgroundImage: "none"
        }
      }
    },
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 999
        }
      }
    },
    MuiTextField: {
      defaultProps: {
        fullWidth: true
      }
    },
    MuiChip: {
      styleOverrides: {
        root: {
          borderRadius: 999
        }
      }
    }
  }
})

export default theme
