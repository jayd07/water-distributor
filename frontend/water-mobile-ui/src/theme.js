import { createTheme } from "@mui/material/styles"

const theme = createTheme({
  palette: {
    primary: {
      main: "#156b73"
    },
    secondary: {
      main: "#d87b2d"
    },
    success: {
      main: "#3d7f58"
    },
    background: {
      default: "#f4efe4",
      paper: "#fffaf3"
    },
    text: {
      primary: "#1d3340",
      secondary: "#60717a"
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
