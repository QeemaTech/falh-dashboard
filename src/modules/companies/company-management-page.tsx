import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Business, Key, Search, Tune } from "@mui/icons-material";
import {
  Box,
  Button,
  CircularProgress,
  Grid,
  InputAdornment,
  MenuItem,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import {
  AppBadge,
  AppDrawer,
  AppStatCard,
  AppTable,
  AppTableCell,
  AppTableHead,
  AppTableHeaderCell,
  AppTableRow,
} from "../../components/design-system";
import { EmptyState, FilterBar, PageHeader } from "../../components/layout";
import {
  assignCompanyProductLimitApi,
  fetchAdminCompanies,
  resetCompanyPasswordApi,
  setCompanyStatusApi,
  type AdminCompany,
} from "../../services/admin-api";

function statusBadge(status: string) {
  if (status === "APPROVED") return "success";
  if (status === "PENDING") return "warning";
  if (status === "SUSPENDED") return "danger";
  return "neutral";
}

export function CompanyManagementPage() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [selectedCompany, setSelectedCompany] = useState<AdminCompany | null>(null);
  const [newLimit, setNewLimit] = useState<number>(10);

  const { data, isLoading, isError, error } = useQuery({
    queryKey: ["admin-companies", search, status],
    queryFn: () =>
      fetchAdminCompanies({
        page: 1,
        limit: 50,
        search: search || undefined,
        status: status || undefined,
        sortBy: "createdAt",
        sortOrder: "desc",
      }),
  });

  const companies = data?.items || [];
  const totalRevenue = useMemo(
    () => companies.reduce((sum, company) => sum + (company.revenue || 0), 0),
    [companies]
  );

  const statusMutation = useMutation({
    mutationFn: ({
      companyId,
      action,
      adminNote,
    }: {
      companyId: string;
      action: "approve" | "reject" | "suspend";
      adminNote?: string;
    }) => setCompanyStatusApi(companyId, action, adminNote),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["admin-companies"] }),
  });

  const limitMutation = useMutation({
    mutationFn: ({ companyId, maxProducts }: { companyId: string; maxProducts: number }) =>
      assignCompanyProductLimitApi(companyId, maxProducts),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["admin-companies"] }),
  });

  const resetPasswordMutation = useMutation({
    mutationFn: ({ companyId }: { companyId: string }) => resetCompanyPasswordApi(companyId),
  });

  if (isLoading) {
    return (
      <Stack sx={{ py: 6, alignItems: "center" }}>
        <CircularProgress size={28} />
      </Stack>
    );
  }

  if (isError) {
    return <EmptyState title="Failed to load companies" description={(error as Error).message} />;
  }

  return (
    <Stack spacing={3}>
      <PageHeader title="Companies" subtitle="Manage company accounts, limits, and approval status" />

      <Grid container spacing={2}>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <AppStatCard title="Companies" value={companies.length} icon={<Business fontSize="small" />} />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <AppStatCard
            title="Approved"
            value={companies.filter((c) => c.status === "APPROVED").length}
            trend="up"
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <AppStatCard
            title="Pending"
            value={companies.filter((c) => c.status === "PENDING").length}
            trend="neutral"
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <AppStatCard title="Revenue" value={`EGP ${totalRevenue.toLocaleString()}`} trend="up" />
        </Grid>
      </Grid>

      <FilterBar>
        <TextField
          size="small"
          placeholder="Search companies..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          sx={{ minWidth: { xs: "100%", sm: 280 } }}
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
          sx={{ minWidth: 200 }}
          slotProps={{
            input: {
              startAdornment: (
                <InputAdornment position="start">
                  <Tune fontSize="small" />
                </InputAdornment>
              ),
            },
          }}
        >
          <MenuItem value="">All statuses</MenuItem>
          <MenuItem value="PENDING">Pending</MenuItem>
          <MenuItem value="APPROVED">Approved</MenuItem>
          <MenuItem value="REJECTED">Rejected</MenuItem>
          <MenuItem value="SUSPENDED">Suspended</MenuItem>
        </TextField>
      </FilterBar>

      {!companies.length ? (
        <EmptyState title="No companies found" description="Try adjusting your search or filters." />
      ) : (
        <AppTable>
          <AppTableHead>
            <tr>
              <AppTableHeaderCell>Company</AppTableHeaderCell>
              <AppTableHeaderCell>Details</AppTableHeaderCell>
              <AppTableHeaderCell>Products Count</AppTableHeaderCell>
              <AppTableHeaderCell>Revenue</AppTableHeaderCell>
              <AppTableHeaderCell>Rating</AppTableHeaderCell>
              <AppTableHeaderCell>Status</AppTableHeaderCell>
              <AppTableHeaderCell>Actions</AppTableHeaderCell>
            </tr>
          </AppTableHead>
          <tbody>
            {companies.map((company) => (
              <AppTableRow key={company.id}>
                <AppTableCell>
                  <Stack direction="row" spacing={1.5} sx={{ alignItems: "center" }}>
                    <Box
                      sx={{
                        p: 1,
                        borderRadius: 1,
                        bgcolor: "primary.main",
                        color: "primary.contrastText",
                        display: "grid",
                        placeItems: "center",
                      }}
                    >
                      <Business fontSize="small" />
                    </Box>
                    <Box>
                      <Typography variant="body2" sx={{ fontWeight: 600 }}>
                        {company.name}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {company.user?.email || "-"}
                      </Typography>
                    </Box>
                  </Stack>
                </AppTableCell>
                <AppTableCell>
                  <Typography variant="body2">{company.city}</Typography>
                  <Typography variant="caption" color="text.secondary">
                    {company.phone}
                  </Typography>
                </AppTableCell>
                <AppTableCell>{company.productsCount}</AppTableCell>
                <AppTableCell>EGP {Number(company.revenue || 0).toLocaleString()}</AppTableCell>
                <AppTableCell>{Number(company.rating || 0).toFixed(1)}</AppTableCell>
                <AppTableCell>
                  <AppBadge variant={statusBadge(company.status) as "success" | "warning" | "danger" | "neutral"}>
                    {company.status}
                  </AppBadge>
                </AppTableCell>
                <AppTableCell>
                  <Stack direction="row" spacing={0.5} sx={{ flexWrap: "wrap" }}>
                    <Button size="small" onClick={() => statusMutation.mutate({ companyId: company.id, action: "approve", adminNote: "Approved" })}>
                      Approve
                    </Button>
                    <Button size="small" color="error" onClick={() => statusMutation.mutate({ companyId: company.id, action: "reject", adminNote: "Rejected" })}>
                      Reject
                    </Button>
                    <Button size="small" onClick={() => statusMutation.mutate({ companyId: company.id, action: "suspend", adminNote: "Suspended" })}>
                      Suspend
                    </Button>
                    <Button
                      size="small"
                      variant="outlined"
                      onClick={() => {
                        setSelectedCompany(company);
                        setNewLimit(company.maxProducts || 10);
                      }}
                    >
                      Set Limit
                    </Button>
                    <Button size="small" onClick={() => resetPasswordMutation.mutate({ companyId: company.id })}>
                      <Key fontSize="small" />
                    </Button>
                  </Stack>
                </AppTableCell>
              </AppTableRow>
            ))}
          </tbody>
        </AppTable>
      )}

      <AppDrawer open={Boolean(selectedCompany)} onClose={() => setSelectedCompany(null)} title="Company Details">
        {selectedCompany ? (
          <Stack spacing={2}>
            <Typography variant="body2"><strong>Name:</strong> {selectedCompany.name}</Typography>
            <Typography variant="body2"><strong>Products Count:</strong> {selectedCompany.productsCount}</Typography>
            <Typography variant="body2"><strong>Product Limit:</strong> {selectedCompany.maxProducts}</Typography>
            <Typography variant="body2"><strong>Revenue:</strong> EGP {Number(selectedCompany.revenue || 0).toLocaleString()}</Typography>
            <Typography variant="body2"><strong>Status:</strong> {selectedCompany.status}</Typography>
            <Typography variant="body2"><strong>Rating:</strong> {Number(selectedCompany.rating || 0).toFixed(1)}</Typography>
            <TextField
              label="Assign Product Limit"
              type="number"
              size="small"
              fullWidth
              slotProps={{ htmlInput: { min: 1 } }}
              value={newLimit}
              onChange={(e) => setNewLimit(Number(e.target.value))}
            />
            <Button
              variant="contained"
              fullWidth
              onClick={() =>
                limitMutation.mutate(
                  { companyId: selectedCompany.id, maxProducts: newLimit },
                  { onSuccess: () => setSelectedCompany(null) }
                )
              }
            >
              Save Product Limit
            </Button>
          </Stack>
        ) : null}
      </AppDrawer>
    </Stack>
  );
}
