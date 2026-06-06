import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import axios from "axios";
import { Search } from "@mui/icons-material";
import {
  Alert,
  Box,
  Button,
  Chip,
  CircularProgress,
  InputAdornment,
  Link,
  MenuItem,
  Paper,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import { AppDrawer } from "../../components/design-system";
import { DataTable, EmptyState, FilterBar, PageHeader } from "../../components/layout";
import {
  approveJoinUsApplicationApi,
  fetchJoinUsApplicationById,
  fetchJoinUsApplications,
  rejectJoinUsApplicationApi,
  type JoinUsApplicationListItem,
  type JoinUsTab,
} from "../../services/admin-api";
import { resolveAssetUrl } from "../../utils/asset-url";

const TABS: { id: JoinUsTab; label: string }[] = [
  { id: "ALL", label: "All" },
  { id: "COMPANIES", label: "Companies" },
  { id: "DOCTORS", label: "Doctors" },
  { id: "ENGINEERS", label: "Engineers" },
  { id: "CONSULTANTS", label: "Consultants" },
  { id: "BROKERS", label: "Brokers" },
  { id: "TRANSPORT", label: "Transport" },
  { id: "OTHERS", label: "Others" },
];

const TYPE_LABELS: Record<string, string> = {
  COMPANY: "Company",
  DOCTOR: "Veterinary Doctor",
  AGRICULTURAL_ENGINEER: "Agricultural Engineer",
  CONSULTANT: "Consultant",
  LAND_BROKER: "Land Broker",
  TRANSPORT: "Transport Provider",
  OTHER: "Other",
};

type JoinRequestRow = JoinUsApplicationListItem & Record<string, unknown>;

function statusChipColor(status: string): "success" | "warning" | "error" | "default" {
  if (status === "APPROVED") return "success";
  if (status === "PENDING") return "warning";
  return "error";
}

function generatePassword(length = 12) {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789!@#$";
  let out = "";
  for (let i = 0; i < length; i += 1) out += chars[Math.floor(Math.random() * chars.length)];
  return out;
}

function formatDate(value: string) {
  return new Date(value).toLocaleString();
}

function AssetLink({ path, label }: { path?: string; label: string }) {
  if (!path) return <span>-</span>;
  const url = resolveAssetUrl(path);
  return (
    <Link href={url} target="_blank" rel="noreferrer">
      {label}
    </Link>
  );
}

export function JoinRequestsPage() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("PENDING");
  const [tab, setTab] = useState<JoinUsTab>("ALL");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [maxProducts, setMaxProducts] = useState("10");
  const [adminNote, setAdminNote] = useState("");
  const [companyEmail, setCompanyEmail] = useState("");
  const [companyPassword, setCompanyPassword] = useState("");
  const [formError, setFormError] = useState("");
  const [credentials, setCredentials] = useState<{ email: string; password: string } | null>(null);

  const { data, isLoading, isError, error } = useQuery({
    queryKey: ["join-us-applications", search, status, tab],
    queryFn: () =>
      fetchJoinUsApplications({
        page: 1,
        limit: 50,
        search: search || undefined,
        status: status || undefined,
        tab,
      }),
  });

  const { data: detail, isLoading: detailLoading } = useQuery({
    queryKey: ["join-us-application", selectedId],
    queryFn: () => fetchJoinUsApplicationById(selectedId!),
    enabled: Boolean(selectedId),
  });

  const reviewMutation = useMutation({
    mutationFn: async (payload: { action: "APPROVE" | "REJECT" }) => {
      if (!selectedId || !detail) throw new Error("No application selected");
      if (payload.action === "REJECT") {
        return rejectJoinUsApplicationApi(selectedId, {
          adminNote: adminNote.trim() || undefined,
        });
      }
      return approveJoinUsApplicationApi(selectedId, {
        email: detail.applicationType === "COMPANY" ? companyEmail.trim().toLowerCase() : undefined,
        password: detail.applicationType === "COMPANY" ? companyPassword : undefined,
        maxProducts: detail.applicationType === "COMPANY" ? Number(maxProducts) : undefined,
        adminNote: adminNote.trim() || undefined,
      });
    },
    onSuccess: (result, variables) => {
      queryClient.invalidateQueries({ queryKey: ["join-us-applications"] });
      queryClient.invalidateQueries({ queryKey: ["join-us-application"] });
      queryClient.invalidateQueries({ queryKey: ["company-applications"] });
      queryClient.invalidateQueries({ queryKey: ["admin-companies"] });
      queryClient.invalidateQueries({ queryKey: ["admin-service-providers"] });
      const creds =
        result && typeof result === "object" && "credentials" in result
          ? (result as { credentials?: { email: string; password: string } }).credentials
          : null;
      if (variables.action === "APPROVE" && creds) {
        setCredentials({ email: creds.email, password: creds.password });
      } else {
        setSelectedId(null);
        setCredentials(null);
      }
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

  const applications = (data?.items || []) as JoinRequestRow[];

  const isCompanyReview = detail?.review.kind === "company";
  const reviewFields = detail?.review.fields || {};

  function openReview(item: JoinUsApplicationListItem) {
    setSelectedId(item.id);
    setMaxProducts("10");
    setAdminNote("");
    setCompanyEmail("");
    setCompanyPassword(generatePassword());
    setFormError("");
    setCredentials(null);
  }

  function handleApprove() {
    if (!detail) return;
    if (detail.applicationType === "COMPANY") {
      const quota = Number(maxProducts);
      const email = companyEmail.trim().toLowerCase();
      if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        setFormError("Enter a valid company login email");
        return;
      }
      if (!companyPassword || companyPassword.length < 6) {
        setFormError("Password must be at least 6 characters");
        return;
      }
      if (!Number.isInteger(quota) || quota < 1) {
        setFormError("Product quota must be at least 1");
        return;
      }
    }
    setFormError("");
    reviewMutation.mutate({ action: "APPROVE" });
  }

  if (isError) {
    return <EmptyState title="Failed to load join requests" description={(error as Error).message} />;
  }

  return (
    <Stack spacing={3} sx={{ minWidth: 0, overflowX: "hidden" }}>
      <PageHeader
        title="Join Requests"
        subtitle="Review company and service provider applications from the mobile app."
      />

      <Paper sx={{ p: 1.5 }}>
        <Stack direction="row" spacing={1} sx={{ flexWrap: "wrap" }}>
          {TABS.map((t) => (
            <Chip
              key={t.id}
              label={t.label}
              clickable
              color={tab === t.id ? "primary" : "default"}
              variant={tab === t.id ? "filled" : "outlined"}
              onClick={() => setTab(t.id)}
              size="small"
            />
          ))}
        </Stack>
      </Paper>

      <FilterBar>
        <TextField
          size="small"
          placeholder="Search by name, phone, city..."
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
          sx={{ minWidth: 180 }}
        >
          <MenuItem value="">All statuses</MenuItem>
          <MenuItem value="PENDING">Pending</MenuItem>
          <MenuItem value="APPROVED">Approved</MenuItem>
          <MenuItem value="REJECTED">Rejected</MenuItem>
        </TextField>
      </FilterBar>

      <DataTable<JoinRequestRow>
        loading={isLoading}
        emptyMessage="No join requests found."
        getRowKey={(row) => row.id}
        columns={[
          {
            key: "applicantName",
            label: "Applicant Name",
            render: (row) => (
              <Typography variant="body2" sx={{ fontWeight: 600 }}>
                {row.applicantName}
              </Typography>
            ),
          },
          {
            key: "applicationType",
            label: "Type",
            render: (row) => TYPE_LABELS[row.applicationType] || row.applicationType,
          },
          { key: "phone", label: "Phone" },
          { key: "city", label: "City" },
          {
            key: "status",
            label: "Status",
            render: (row) => <Chip label={row.status} color={statusChipColor(row.status)} size="small" />,
          },
          {
            key: "createdAt",
            label: "Created At",
            render: (row) => formatDate(row.createdAt),
          },
          {
            key: "id",
            label: "Actions",
            render: (row) => (
              <Button size="small" onClick={() => openReview(row)}>
                View
              </Button>
            ),
          },
        ]}
        data={applications}
      />

      <AppDrawer
        open={Boolean(selectedId)}
        onClose={() => {
          setSelectedId(null);
          setCredentials(null);
        }}
        title="Review Join Request"
      >
        {detailLoading ? (
          <Stack sx={{ py: 2, alignItems: "center" }}>
            <CircularProgress size={24} />
            <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
              Loading details...
            </Typography>
          </Stack>
        ) : null}
        {detail ? (
          <Stack spacing={2}>
            <Typography variant="body2">
              <Box component="span" sx={{ fontWeight: 600 }}>
                Type:
              </Box>{" "}
              {TYPE_LABELS[detail.applicationType] || detail.applicationType}
            </Typography>
            <Typography variant="body2">
              <Box component="span" sx={{ fontWeight: 600 }}>
                Status:
              </Box>{" "}
              {detail.status}
            </Typography>

            {isCompanyReview ? (
              <>
                <Typography variant="body2">
                  <Box component="span" sx={{ fontWeight: 600 }}>Company Name:</Box>{" "}
                  {String(reviewFields.companyName || detail.companyName || "-")}
                </Typography>
                <Typography variant="body2">
                  <Box component="span" sx={{ fontWeight: 600 }}>Applicant Name:</Box>{" "}
                  {String(reviewFields.applicantName || detail.fullName)}
                </Typography>
                <Typography variant="body2">
                  <Box component="span" sx={{ fontWeight: 600 }}>Phone:</Box>{" "}
                  {String(reviewFields.phone || detail.phone)}
                </Typography>
                <Typography variant="body2">
                  <Box component="span" sx={{ fontWeight: 600 }}>Email:</Box>{" "}
                  {String(reviewFields.email || detail.email || "-")}
                </Typography>
                <Typography variant="body2">
                  <Box component="span" sx={{ fontWeight: 600 }}>City:</Box>{" "}
                  {String(reviewFields.city || detail.city)}
                </Typography>
                <Typography variant="body2">
                  <Box component="span" sx={{ fontWeight: 600 }}>Description:</Box>{" "}
                  {String(reviewFields.description || detail.description || "-")}
                </Typography>
                <Typography variant="body2">
                  <Box component="span" sx={{ fontWeight: 600 }}>Business License:</Box>{" "}
                  <AssetLink path={String(reviewFields.businessLicense || detail.businessLicense || "")} label="View file" />
                </Typography>
                <Typography variant="body2">
                  <Box component="span" sx={{ fontWeight: 600 }}>Commercial Registration:</Box>{" "}
                  <AssetLink path={String(reviewFields.commercialReg || detail.commercialReg || "")} label="View file" />
                </Typography>

                <TextField
                  label="Product quota on approval"
                  type="number"
                  size="small"
                  fullWidth
                  slotProps={{ htmlInput: {  min: 1  } }}
                  value={maxProducts}
                  onChange={(e) => setMaxProducts(e.target.value)}
                />
                <TextField
                  label="Company login email"
                  type="email"
                  size="small"
                  fullWidth
                  value={companyEmail}
                  onChange={(e) => setCompanyEmail(e.target.value)}
                />
                <Stack direction="row" spacing={1}>
                  <TextField
                    label="Company login password"
                    type="text"
                    size="small"
                    fullWidth
                    value={companyPassword}
                    onChange={(e) => setCompanyPassword(e.target.value)}
                  />
                  <Button type="button" variant="outlined" onClick={() => setCompanyPassword(generatePassword())}>
                    Generate
                  </Button>
                </Stack>
              </>
            ) : (
              <>
                <Typography variant="body2">
                  <Box component="span" sx={{ fontWeight: 600 }}>Full Name:</Box>{" "}
                  {String(reviewFields.fullName || detail.fullName)}
                </Typography>
                <Typography variant="body2">
                  <Box component="span" sx={{ fontWeight: 600 }}>City:</Box>{" "}
                  {String(reviewFields.city || detail.city)}
                </Typography>
                <Typography variant="body2">
                  <Box component="span" sx={{ fontWeight: 600 }}>WhatsApp:</Box>{" "}
                  {String(reviewFields.whatsapp || detail.whatsappNumber || "-")}
                </Typography>
                <Typography variant="body2">
                  <Box component="span" sx={{ fontWeight: 600 }}>Phone:</Box>{" "}
                  {String(reviewFields.phone || detail.phone)}
                </Typography>
                <Typography variant="body2">
                  <Box component="span" sx={{ fontWeight: 600 }}>Bio:</Box>{" "}
                  {String(reviewFields.bio || detail.bio || "-")}
                </Typography>
                <Typography variant="body2">
                  <Box component="span" sx={{ fontWeight: 600 }}>Specializations:</Box>{" "}
                  {Array.isArray(reviewFields.specializations)
                    ? (reviewFields.specializations as string[]).join(", ") || "-"
                    : (detail.specializations || []).join(", ") || "-"}
                </Typography>
                <Typography variant="body2">
                  <Box component="span" sx={{ fontWeight: 600 }}>Experience:</Box>{" "}
                  {String(reviewFields.experience ?? detail.yearsOfExperience ?? "-")} years
                </Typography>
                {detail.otherTypeLabel ? (
                  <Typography variant="body2">
                    <Box component="span" sx={{ fontWeight: 600 }}>Other type:</Box> {detail.otherTypeLabel}
                  </Typography>
                ) : null}
                <Typography variant="body2">
                  <Box component="span" sx={{ fontWeight: 600 }}>Identity Image:</Box>{" "}
                  <AssetLink path={String(reviewFields.idImage || detail.idImage || "")} label="View" />
                </Typography>
                <Typography variant="body2">
                  <Box component="span" sx={{ fontWeight: 600 }}>License Image:</Box>{" "}
                  <AssetLink path={String(reviewFields.licenseImage || detail.licenseImage || "")} label="View" />
                </Typography>
              </>
            )}

            <TextField
              label="Admin note"
              size="small"
              fullWidth
              value={adminNote}
              onChange={(e) => setAdminNote(e.target.value)}
            />

            {credentials ? (
              <Paper variant="outlined" sx={{ p: 2, bgcolor: "primary.50", borderColor: "primary.light" }}>
                <Typography variant="subtitle2" color="primary.main" gutterBottom>
                  Company account created
                </Typography>
                <Typography variant="body2">Email: {credentials.email}</Typography>
                <Typography variant="body2">Password: {credentials.password}</Typography>
                <Typography variant="caption" color="text.secondary" sx={{ display: "block", mt: 1 }}>
                  Share via email, SMS, or WhatsApp.
                </Typography>
                <Button
                  sx={{ mt: 1 }}
                  onClick={() => {
                    setSelectedId(null);
                    setCredentials(null);
                  }}
                >
                  Close
                </Button>
              </Paper>
            ) : null}

            {formError ? <Alert severity="error">{formError}</Alert> : null}

            {!credentials && detail.status === "PENDING" ? (
              <Stack direction="row" spacing={1} sx={{ pt: 1 }}>
                <Button variant="contained" disabled={reviewMutation.isPending} onClick={handleApprove}>
                  {detail.review.approveButtonText}
                </Button>
                <Button
                  variant="outlined"
                  disabled={reviewMutation.isPending}
                  onClick={() => reviewMutation.mutate({ action: "REJECT" })}
                >
                  Reject
                </Button>
              </Stack>
            ) : null}
          </Stack>
        ) : null}
      </AppDrawer>
    </Stack>
  );
}
