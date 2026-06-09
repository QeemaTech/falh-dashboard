import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import axios from "axios";
import { Search } from "@mui/icons-material";
import {
  Alert,
  Box,
  Button,
  Chip,
  InputAdornment,
  MenuItem,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import { AppDrawer } from "../../components/design-system";
import { DataTable, EmptyState, FilterBar, PageHeader } from "../../components/layout";
import {
  fetchCompanyApplications,
  reviewCompanyApplicationApi,
  type CompanyApplication,
} from "../../services/admin-api";

type CompanyApplicationRow = CompanyApplication & Record<string, unknown>;

function statusChipColor(status: string): "success" | "warning" | "error" | "default" {
  if (status === "APPROVED") return "success";
  if (status === "PENDING") return "warning";
  return "error";
}

function openReviewForm(app: CompanyApplication) {
  const slug = app.companyName
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ".")
    .replace(/^\.+|\.+$/g, "")
    .slice(0, 24);
  return {
    maxProducts: "10",
    displayDays: "30",
    adminNote: "",
    companyEmail: slug ? `${slug}@company.falh.local` : "",
    companyPassword: "",
  };
}

export function CompanyApplicationsPage() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("PENDING");
  const [selected, setSelected] = useState<CompanyApplication | null>(null);
  const [maxProducts, setMaxProducts] = useState("10");
  const [displayDays, setDisplayDays] = useState("30");
  const [adminNote, setAdminNote] = useState("");
  const [companyEmail, setCompanyEmail] = useState("");
  const [companyPassword, setCompanyPassword] = useState("");
  const [formError, setFormError] = useState("");

  const { data, isLoading, isError, error } = useQuery({
    queryKey: ["company-applications", search, status],
    queryFn: () => fetchCompanyApplications({ page: 1, limit: 50, search: search || undefined, status: status || undefined }),
  });

  const reviewMutation = useMutation({
    mutationFn: (payload: {
      applicationId: string;
      action: "APPROVE" | "REJECT";
      maxProducts?: number;
      displayDays?: number;
      email?: string;
      password?: string;
      adminNote?: string;
    }) =>
      reviewCompanyApplicationApi(payload.applicationId, {
        action: payload.action,
        maxProducts: payload.maxProducts,
        displayDays: payload.displayDays,
        email: payload.email,
        password: payload.password,
        adminNote: payload.adminNote,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["company-applications"] });
      queryClient.invalidateQueries({ queryKey: ["admin-companies"] });
      setSelected(null);
      setFormError("");
    },
    onError: (err: unknown) => {
      const message =
        axios.isAxiosError(err) && err.response?.data && typeof err.response.data === "object" && "message" in err.response.data
          ? String((err.response.data as { message: string }).message)
          : err instanceof Error
            ? err.message
            : "Review failed";
      setFormError(message);
    },
  });

  const applications = (data?.items || []) as CompanyApplicationRow[];

  function handleSelectApplication(app: CompanyApplication) {
    const form = openReviewForm(app);
    setSelected(app);
    setMaxProducts(form.maxProducts);
    setDisplayDays(form.displayDays);
    setAdminNote(form.adminNote);
    setCompanyEmail(form.companyEmail);
    setCompanyPassword(form.companyPassword);
    setFormError("");
  }

  function handleApprove() {
    if (!selected) return;
    const quota = Number(maxProducts);
    const days = Number(displayDays);
    const email = companyEmail.trim().toLowerCase();
    const password = companyPassword;

    if (!email) {
      setFormError("Company email is required");
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setFormError("Enter a valid email address");
      return;
    }
    if (!password || password.length < 6) {
      setFormError("Password must be at least 6 characters");
      return;
    }
    if (!Number.isInteger(quota) || quota < 1) {
      setFormError("Product quota must be a number of at least 1");
      return;
    }
    if (!Number.isInteger(days) || days < 1) {
      setFormError("Listing duration must be at least 1 day");
      return;
    }

    setFormError("");
    reviewMutation.mutate({
      applicationId: selected.id,
      action: "APPROVE",
      maxProducts: quota,
      displayDays: days,
      email,
      password,
      adminNote: adminNote.trim() || undefined,
    });
  }

  if (isError) {
    return <EmptyState title="Failed to load applications" description={(error as Error).message} />;
  }

  return (
    <Stack spacing={3} sx={{ minWidth: 0, overflowX: "hidden" }}>
      <PageHeader title="Company Applications" subtitle="Review and approve company registration requests." />

      <FilterBar>
        <TextField
          size="small"
          placeholder="Search applications..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          sx={{ minWidth: { xs: "100%", sm: 288 } }}
          slotProps={{
            input: {
              startAdornment: (
                <InputAdornment position="start">
                  <Search fontSize="small" />
                </InputAdornment>
              ),
            },
          }}
        />
        <TextField
          select
          label="Status"
          size="small"
          value={status}
          onChange={(e) => setStatus(e.target.value)}
          sx={{ minWidth: 160 }}
        >
          <MenuItem value="">All</MenuItem>
          <MenuItem value="PENDING">Pending</MenuItem>
          <MenuItem value="APPROVED">Approved</MenuItem>
          <MenuItem value="REJECTED">Rejected</MenuItem>
        </TextField>
      </FilterBar>

      <DataTable<CompanyApplicationRow>
        loading={isLoading}
        emptyMessage="No applications found."
        getRowKey={(row) => row.id}
        columns={[
          {
            key: "companyName",
            label: "Company",
            render: (row) => (
              <Typography variant="body2" sx={{ fontWeight: 600 }}>
                {row.companyName}
              </Typography>
            ),
          },
          { key: "applicantName", label: "Applicant" },
          { key: "phone", label: "Phone" },
          { key: "city", label: "City" },
          {
            key: "status",
            label: "Status",
            render: (row) => <Chip label={row.status} color={statusChipColor(row.status)} size="small" />,
          },
          {
            key: "id",
            label: "Actions",
            render: (row) => (
              <Button size="small" onClick={() => handleSelectApplication(row)}>
                Review
              </Button>
            ),
          },
        ]}
        data={applications}
      />

      <AppDrawer open={Boolean(selected)} onClose={() => setSelected(null)} title="Review Application">
        {selected ? (
          <Stack spacing={2}>
            <Typography variant="body2">
              <Box component="span" sx={{ fontWeight: 600 }}>Company:</Box> {selected.companyName}
            </Typography>
            <Typography variant="body2">
              <Box component="span" sx={{ fontWeight: 600 }}>Applicant:</Box> {selected.applicantName}
            </Typography>
            <Typography variant="body2">
              <Box component="span" sx={{ fontWeight: 600 }}>Phone:</Box> {selected.phone}
            </Typography>
            <Typography variant="body2">
              <Box component="span" sx={{ fontWeight: 600 }}>Description:</Box> {selected.description || "-"}
            </Typography>

            <TextField
              label="Product quota on approval"
              type="number"
              size="small"
              fullWidth
              slotProps={{ htmlInput: {  min: 1, step: 1  } }}
              value={maxProducts}
              onChange={(e) => setMaxProducts(e.target.value)}
            />

            <TextField
              label="Listing duration (days)"
              type="number"
              size="small"
              fullWidth
              helperText="After this period the company is suspended and products are hidden from the app."
              slotProps={{ htmlInput: { min: 1, step: 1 } }}
              value={displayDays}
              onChange={(e) => setDisplayDays(e.target.value)}
            />

            <TextField
              label="Company login email"
              type="email"
              size="small"
              fullWidth
              autoComplete="off"
              placeholder="company@example.com"
              value={companyEmail}
              onChange={(e) => setCompanyEmail(e.target.value)}
            />

            <TextField
              label="Company login password"
              type="password"
              size="small"
              fullWidth
              autoComplete="new-password"
              placeholder="Min. 6 characters"
              value={companyPassword}
              onChange={(e) => setCompanyPassword(e.target.value)}
            />

            <TextField
              label="Admin note"
              size="small"
              fullWidth
              value={adminNote}
              onChange={(e) => setAdminNote(e.target.value)}
            />

            {formError ? <Alert severity="error">{formError}</Alert> : null}

            <Stack direction="row" spacing={1} sx={{ pt: 1 }}>
              <Button
                variant="contained"
                disabled={selected.status !== "PENDING" || reviewMutation.isPending}
                onClick={handleApprove}
              >
                Approve & Create Login
              </Button>
              <Button
                variant="outlined"
                disabled={selected.status !== "PENDING" || reviewMutation.isPending}
                onClick={() => {
                  setFormError("");
                  reviewMutation.mutate({ applicationId: selected.id, action: "REJECT", adminNote: adminNote.trim() || undefined });
                }}
              >
                Reject
              </Button>
            </Stack>
            <Typography variant="caption" color="text.secondary">
              Enter the email and password the company will use to sign in. Share these credentials with the applicant after approval.
            </Typography>
          </Stack>
        ) : null}
      </AppDrawer>
    </Stack>
  );
}
