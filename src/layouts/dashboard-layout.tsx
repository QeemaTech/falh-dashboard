import { Outlet } from "react-router-dom";
import { Box, Container } from "@mui/material";
import { Sidebar } from "../components/sidebar";
import { Header } from "../components/header";
import { useUiStore } from "../store/ui-store";

export function DashboardLayout() {
  const { direction } = useUiStore();

  return (
    <Box dir={direction} sx={{ display: "flex", minHeight: "100vh", bgcolor: "background.default" }}>
      <Sidebar />
      <Box
        component="main"
        sx={{
          flex: 1,
          minWidth: 0,
          display: "flex",
          flexDirection: "column",
        }}
      >
        <Header />
        <Container maxWidth={false} sx={{ py: { xs: 2, md: 2.5 }, px: { xs: 2, md: 3 }, flex: 1 }}>
          <Outlet />
        </Container>
      </Box>
    </Box>
  );
}
