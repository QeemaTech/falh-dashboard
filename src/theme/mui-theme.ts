import { createTheme, type PaletteMode } from "@mui/material/styles";

const primaryMain = "#23673A";
const secondaryMain = "#4D9A5B";

export function createAppTheme(mode: PaletteMode, direction: "ltr" | "rtl" = "ltr") {
  return createTheme({
    direction,
    palette: {
      mode,
      primary: {
        main: primaryMain,
        light: "#4D9A5B",
        dark: "#1E5A31",
        contrastText: "#FFFFFF",
      },
      secondary: {
        main: secondaryMain,
        dark: "#43874F",
        contrastText: "#FFFFFF",
      },
      background: {
        default: mode === "light" ? "#F8F9FA" : "#0F1410",
        paper: mode === "light" ? "#FFFFFF" : "#161F19",
      },
      text: {
        primary: mode === "light" ? "#111827" : "#E5E7EB",
        secondary: mode === "light" ? "#6B7280" : "#9CA3AF",
      },
      divider: mode === "light" ? "#E8EFEA" : "#1D2A22",
      error: { main: "#DC2626" },
      warning: { main: "#F59E0B" },
      success: { main: "#059669" },
    },
    typography: {
      fontFamily:
        direction === "rtl"
          ? '"Cairo", "Roboto", "Helvetica", "Arial", sans-serif'
          : '"Roboto", "Helvetica", "Arial", sans-serif',
      h1: { fontWeight: 700, fontSize: "2rem" },
      h2: { fontWeight: 700, fontSize: "1.5rem" },
      h3: { fontWeight: 600, fontSize: "1.125rem" },
      h4: { fontWeight: 600, fontSize: "1.0625rem" },
      h5: { fontWeight: 600, fontSize: "1rem" },
      h6: { fontWeight: 600, fontSize: "0.9375rem" },
      body1: { fontSize: "0.875rem" },
      body2: { fontSize: "0.8125rem" },
      button: { textTransform: "none", fontWeight: 600 },
    },
    spacing: 8,
    shape: { borderRadius: 8 },
    components: {
      MuiCssBaseline: {
        styleOverrides: {
          html: {
            scrollbarGutter: "stable",
          },
          body: {
            scrollbarColor: mode === "light" ? "#C5D0C8 transparent" : "#2A3A30 transparent",
          },
        },
      },
      MuiButton: {
        defaultProps: { disableElevation: true },
        styleOverrides: {
          root: ({ theme }) => ({
            borderRadius: 8,
            padding: "7px 14px",
            minHeight: 36,
            fontWeight: 600,
            "&.MuiButton-containedPrimary:hover": {
              backgroundColor: theme.palette.primary.dark,
            },
            "&.MuiButton-outlined:hover": {
              borderColor: theme.palette.primary.main,
              backgroundColor:
                theme.palette.mode === "dark" ? "rgba(77, 154, 91, 0.08)" : "rgba(35, 103, 58, 0.06)",
            },
            "&.Mui-disabled": {
              opacity: theme.palette.mode === "dark" ? 0.38 : 0.5,
              ...(theme.palette.mode === "dark" && {
                color: "rgba(255,255,255,0.3)",
                borderColor: "rgba(255,255,255,0.12)",
              }),
            },
          }),
        },
      },
      MuiCard: {
        defaultProps: { elevation: 0 },
        styleOverrides: {
          root: {
            borderRadius: 8,
            border: "1px solid",
            borderColor: mode === "light" ? "#E8EFEA" : "#1D2A22",
            boxShadow: "none",
          },
        },
      },
      MuiTextField: {
        defaultProps: { size: "small", variant: "outlined" },
      },
      MuiOutlinedInput: {
        styleOverrides: {
          root: ({ theme }) => ({
            borderRadius: 8,
            backgroundColor:
              theme.palette.mode === "dark" ? "rgba(255,255,255,0.04)" : theme.palette.background.paper,
            "&:hover .MuiOutlinedInput-notchedOutline": {
              borderColor: theme.palette.primary.light,
            },
            "&.Mui-focused": {
              backgroundColor: theme.palette.background.paper,
            },
            "& input:-webkit-autofill, & input:-webkit-autofill:hover, & input:-webkit-autofill:focus": {
              WebkitBoxShadow: `0 0 0 100px ${theme.palette.mode === "dark" ? "#161F19" : "#FFFFFF"} inset`,
              WebkitTextFillColor: theme.palette.text.primary,
              caretColor: theme.palette.text.primary,
              transition: "background-color 9999s ease-out 0s",
            },
          }),
          notchedOutline: ({ theme }) => ({
            borderColor: theme.palette.divider,
          }),
        },
      },
      MuiInputLabel: {
        styleOverrides: {
          root: ({ theme }) => ({
            color: theme.palette.text.secondary,
            "&.Mui-focused": {
              color: theme.palette.primary.main,
            },
          }),
        },
      },
      MuiPaper: {
        defaultProps: { elevation: 0 },
        styleOverrides: {
          root: ({ theme }) => ({
            backgroundImage: "none",
            borderRadius: 8,
            ...(theme.palette.mode === "dark" && {
              backgroundColor: theme.palette.background.paper,
            }),
          }),
        },
      },
      MuiDrawer: {
        styleOverrides: {
          paper: ({ ownerState }) =>
            ownerState.variant === "temporary"
              ? {
                  borderRadius: 8,
                  margin: 8,
                  height: "calc(100% - 16px)",
                }
              : {
                  borderRadius: 0,
                  margin: 0,
                  height: "100%",
                },
        },
      },
      MuiDialog: {
        styleOverrides: {
          paper: {
            borderRadius: 8,
          },
        },
      },
      MuiAppBar: {
        defaultProps: { elevation: 0, color: "inherit" },
        styleOverrides: {
          root: {
            backgroundColor: mode === "light" ? "#FFFFFF" : "#161F19",
            borderBottom: "1px solid",
            borderColor: mode === "light" ? "#E8EFEA" : "#1D2A22",
          },
        },
      },
      MuiTableHead: {
        styleOverrides: {
          root: {
            backgroundColor: mode === "light" ? "#F3F5F4" : "#0D1510",
            "& .MuiTableCell-head": {
              color: mode === "light" ? "#6B7280" : "#9CA3AF",
              fontWeight: 600,
              fontSize: "0.75rem",
              textTransform: "uppercase",
              letterSpacing: "0.04em",
            },
          },
        },
      },
      MuiTableRow: {
        styleOverrides: {
          root: {
            "&:hover": {
              backgroundColor: mode === "light" ? "rgba(35, 103, 58, 0.03)" : "rgba(77, 154, 91, 0.06)",
            },
          },
        },
      },
      MuiTableCell: {
        styleOverrides: {
          root: {
            borderColor: mode === "light" ? "#E8EFEA" : "#1D2A22",
            padding: "12px 16px",
          },
        },
      },
      MuiChip: {
        styleOverrides: {
          root: {
            fontWeight: 600,
            borderRadius: 8,
          },
        },
      },
      MuiListItemButton: {
        styleOverrides: {
          root: {
            borderRadius: 8,
          },
        },
      },
      MuiMenu: {
        styleOverrides: {
          paper: {
            borderRadius: 8,
            border: "1px solid",
            borderColor: mode === "light" ? "#E8EFEA" : "#1D2A22",
            boxShadow: "0 4px 16px -4px rgba(15, 23, 42, 0.12)",
          },
        },
      },
      MuiTooltip: {
        styleOverrides: {
          tooltip: {
            borderRadius: 8,
          },
        },
      },
    },
  });
}
