import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { RouterProvider } from "react-router-dom";
import { router } from "./routes/router";
import { UiProvider } from "./store/ui-store";
import { AuthProvider } from "./store/auth-store";
import { PermissionProvider } from "./store/permission-context";
import { AppThemeProvider } from "./theme/AppThemeProvider";
import "./index.css";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 60_000,
      refetchOnWindowFocus: true,
      retry: (failureCount, error) => {
        const status = (error as { response?: { status?: number } })?.response?.status;
        if (status === 401) return false;
        return failureCount < 1;
      },
    },
  },
});

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <UiProvider>
      <AppThemeProvider>
        <AuthProvider>
          <PermissionProvider>
            <QueryClientProvider client={queryClient}>
              <RouterProvider router={router} />
            </QueryClientProvider>
          </PermissionProvider>
        </AuthProvider>
      </AppThemeProvider>
    </UiProvider>
  </StrictMode>
);
