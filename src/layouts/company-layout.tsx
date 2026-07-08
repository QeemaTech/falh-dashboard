import { Outlet } from "react-router-dom";
import { Box, Container } from "@mui/material";
import { CompanySidebar } from "../components/company-sidebar";
import { CompanyHeader } from "../components/company-header";
import { SIDEBAR_WIDTH_COLLAPSED, SIDEBAR_WIDTH_OPEN } from "../components/sidebar";
import { useUiStore } from "../store/ui-store";

export function CompanyLayout() {
  const { direction, sidebarOpen } = useUiStore();
  const drawerWidth = sidebarOpen ? SIDEBAR_WIDTH_OPEN : SIDEBAR_WIDTH_COLLAPSED;

  return (
    <Box dir={direction} sx={{ display: "flex", minHeight: "100vh", bgcolor: "background.default" }}>
      <CompanySidebar />
      <Box
        component="main"
        sx={{
          flex: 1,
          minWidth: 0,
          marginInlineStart: { lg: `${drawerWidth}px` },
          display: "flex",
          flexDirection: "column",
          transition: (theme) =>
            theme.transitions.create(["margin"], { duration: theme.transitions.duration.shortest }),
        }}
      >
        <CompanyHeader />
        <Container maxWidth={false} sx={{ py: { xs: 2, md: 2.5 }, px: { xs: 2, md: 3 }, flex: 1 }}>
          <Outlet />
        </Container>
      </Box>
    </Box>
  );
}
