import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Building2, KeyRound, Search, SlidersHorizontal } from "lucide-react";
import { Button } from "../../components/ui/button";
import { Card } from "../../components/ui/card";
import { Input } from "../../components/ui/input";
import { AppBadge, AppDrawer, AppSelect, AppStatCard, AppTable, AppTableCell, AppTableHead, AppTableHeaderCell, AppTableRow } from "../../components/design-system";
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

  if (isLoading) return <Card>Loading companies...</Card>;
  if (isError) return <Card>Failed to load companies: {(error as Error).message}</Card>;
  if (!companies.length) return <Card>No companies found for current filters.</Card>;

  return (
    <div className="min-w-0 space-y-4 overflow-x-hidden">
      <div className="grid gap-4 sm:grid-cols-4">
        <AppStatCard title="Companies" value={companies.length} />
        <AppStatCard title="Approved" value={companies.filter((c) => c.status === "APPROVED").length} trend="up" />
        <AppStatCard title="Pending" value={companies.filter((c) => c.status === "PENDING").length} trend="neutral" />
        <AppStatCard title="Revenue" value={`EGP ${totalRevenue.toLocaleString()}`} trend="up" />
      </div>

      <Card className="space-y-3">
        <div className="flex flex-wrap items-center gap-2">
          <div className="relative w-72">
            <Search className="pointer-events-none absolute inset-s-3 top-3 size-4 text-neutral-400" />
            <Input
              className="ps-9"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search companies..."
            />
          </div>
          <div className="flex items-center gap-2">
            <SlidersHorizontal className="size-4 text-neutral-500" />
            <AppSelect value={status} onChange={(e) => setStatus(e.target.value)}>
              <option value="">All statuses</option>
              <option value="PENDING">Pending</option>
              <option value="APPROVED">Approved</option>
              <option value="REJECTED">Rejected</option>
              <option value="SUSPENDED">Suspended</option>
            </AppSelect>
          </div>
        </div>
      </Card>

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
                  <div className="flex items-center gap-2">
                    <div className="rounded-lg bg-emerald-100 p-2 text-emerald-700">
                      <Building2 className="size-4" />
                    </div>
                    <div>
                      <p className="font-medium">{company.name}</p>
                      <p className="text-xs text-neutral-500">{company.user?.email || "-"}</p>
                    </div>
                  </div>
                </AppTableCell>
                <AppTableCell>
                  <p>{company.city}</p>
                  <p className="text-xs text-neutral-500">{company.phone}</p>
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
                  <div className="flex flex-wrap gap-1">
                    <Button
                      variant="ghost"
                      onClick={() =>
                        statusMutation.mutate({ companyId: company.id, action: "approve", adminNote: "Approved" })
                      }
                    >
                      Approve
                    </Button>
                    <Button
                      variant="ghost"
                      onClick={() =>
                        statusMutation.mutate({ companyId: company.id, action: "reject", adminNote: "Rejected" })
                      }
                    >
                      Reject
                    </Button>
                    <Button
                      variant="ghost"
                      onClick={() =>
                        statusMutation.mutate({ companyId: company.id, action: "suspend", adminNote: "Suspended" })
                      }
                    >
                      Suspend
                    </Button>
                    <Button
                      variant="ghost"
                      onClick={() => {
                        setSelectedCompany(company);
                        setNewLimit(company.maxProducts || 10);
                      }}
                    >
                      Set Limit
                    </Button>
                    <Button
                      variant="ghost"
                      onClick={() => resetPasswordMutation.mutate({ companyId: company.id })}
                    >
                      <KeyRound className="size-4" />
                    </Button>
                  </div>
                </AppTableCell>
              </AppTableRow>
            ))}
          </tbody>
      </AppTable>

      <AppDrawer
        open={Boolean(selectedCompany)}
        onClose={() => setSelectedCompany(null)}
        title="Company Details"
      >
        {selectedCompany ? (
          <>
            <div className="space-y-2 text-sm">
              <p><span className="font-medium">Name:</span> {selectedCompany.name}</p>
              <p><span className="font-medium">Products Count:</span> {selectedCompany.productsCount}</p>
              <p><span className="font-medium">Product Limit:</span> {selectedCompany.maxProducts}</p>
              <p><span className="font-medium">Revenue:</span> EGP {Number(selectedCompany.revenue || 0).toLocaleString()}</p>
              <p><span className="font-medium">Status:</span> {selectedCompany.status}</p>
              <p><span className="font-medium">Rating:</span> {Number(selectedCompany.rating || 0).toFixed(1)}</p>
            </div>
            <div className="mt-4 space-y-2">
              <label className="text-sm font-medium">Assign Product Limit</label>
              <Input
                type="number"
                min={1}
                value={newLimit}
                onChange={(e) => setNewLimit(Number(e.target.value))}
              />
              <Button
                onClick={() =>
                  limitMutation.mutate(
                    { companyId: selectedCompany.id, maxProducts: newLimit },
                    { onSuccess: () => setSelectedCompany(null) }
                  )
                }
                className="w-full"
              >
                Save Product Limit
              </Button>
            </div>
          </>
        ) : null}
      </AppDrawer>
    </div>
  );
}
