import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Search } from "lucide-react";
import { Button } from "../../components/ui/button";
import { Card } from "../../components/ui/card";
import { Input } from "../../components/ui/input";
import { AppBadge, AppDrawer, AppSelect, AppTable, AppTableCell, AppTableHead, AppTableHeaderCell, AppTableRow } from "../../components/design-system";
import {
  fetchCompanyApplications,
  reviewCompanyApplicationApi,
  type CompanyApplication,
} from "../../services/admin-api";

function statusBadge(status: string) {
  if (status === "APPROVED") return "success";
  if (status === "PENDING") return "warning";
  return "danger";
}

export function CompanyApplicationsPage() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("PENDING");
  const [selected, setSelected] = useState<CompanyApplication | null>(null);
  const [maxProducts, setMaxProducts] = useState(10);
  const [adminNote, setAdminNote] = useState("");

  const { data, isLoading, isError, error } = useQuery({
    queryKey: ["company-applications", search, status],
    queryFn: () => fetchCompanyApplications({ page: 1, limit: 50, search: search || undefined, status: status || undefined }),
  });

  const reviewMutation = useMutation({
    mutationFn: (payload: { applicationId: string; action: "APPROVE" | "REJECT"; maxProducts?: number; adminNote?: string }) =>
      reviewCompanyApplicationApi(payload.applicationId, {
        action: payload.action,
        maxProducts: payload.maxProducts,
        adminNote: payload.adminNote,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["company-applications"] });
      queryClient.invalidateQueries({ queryKey: ["admin-companies"] });
      setSelected(null);
    },
  });

  const applications = data?.items || [];

  return (
    <div className="space-y-4">
      <Card className="flex flex-wrap items-center gap-2 p-4">
        <div className="relative w-72">
          <Search className="pointer-events-none absolute inset-s-3 top-3 size-4 text-neutral-400" />
          <Input className="ps-9" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search applications..." />
        </div>
        <AppSelect value={status} onChange={(e) => setStatus(e.target.value)}>
          <option value="">All</option>
          <option value="PENDING">Pending</option>
          <option value="APPROVED">Approved</option>
          <option value="REJECTED">Rejected</option>
        </AppSelect>
      </Card>

      {isLoading ? <Card>Loading applications...</Card> : null}
      {isError ? <Card>Failed: {(error as Error).message}</Card> : null}
      {!isLoading && !applications.length ? <Card>No applications found.</Card> : null}

      {applications.length > 0 ? (
        <AppTable>
          <AppTableHead>
            <tr>
              <AppTableHeaderCell>Company</AppTableHeaderCell>
              <AppTableHeaderCell>Applicant</AppTableHeaderCell>
              <AppTableHeaderCell>Phone</AppTableHeaderCell>
              <AppTableHeaderCell>City</AppTableHeaderCell>
              <AppTableHeaderCell>Status</AppTableHeaderCell>
              <AppTableHeaderCell>Actions</AppTableHeaderCell>
            </tr>
          </AppTableHead>
          <tbody>
            {applications.map((app) => (
              <AppTableRow key={app.id}>
                <AppTableCell className="font-medium">{app.companyName}</AppTableCell>
                <AppTableCell>{app.applicantName}</AppTableCell>
                <AppTableCell>{app.phone}</AppTableCell>
                <AppTableCell>{app.city}</AppTableCell>
                <AppTableCell>
                  <AppBadge variant={statusBadge(app.status) as "success" | "warning" | "danger"}>{app.status}</AppBadge>
                </AppTableCell>
                <AppTableCell>
                  <Button variant="ghost" onClick={() => setSelected(app)}>
                    Review
                  </Button>
                </AppTableCell>
              </AppTableRow>
            ))}
          </tbody>
        </AppTable>
      ) : null}

      <AppDrawer open={Boolean(selected)} onClose={() => setSelected(null)} title="Review Application">
        {selected ? (
          <div className="space-y-3 text-sm">
            <p><span className="font-medium">Company:</span> {selected.companyName}</p>
            <p><span className="font-medium">Applicant:</span> {selected.applicantName}</p>
            <p><span className="font-medium">Phone:</span> {selected.phone}</p>
            <p><span className="font-medium">Description:</span> {selected.description || "-"}</p>
            <div>
              <label className="font-medium">Product quota on approval</label>
              <Input type="number" min={1} value={maxProducts} onChange={(e) => setMaxProducts(Number(e.target.value))} />
            </div>
            <div>
              <label className="font-medium">Admin note</label>
              <Input value={adminNote} onChange={(e) => setAdminNote(e.target.value)} />
            </div>
            <div className="flex gap-2 pt-2">
              <Button
                disabled={selected.status !== "PENDING" || reviewMutation.isPending}
                onClick={() =>
                  reviewMutation.mutate({
                    applicationId: selected.id,
                    action: "APPROVE",
                    maxProducts,
                    adminNote,
                  })
                }
              >
                Approve & Create Login
              </Button>
              <Button
                variant="outline"
                disabled={selected.status !== "PENDING" || reviewMutation.isPending}
                onClick={() =>
                  reviewMutation.mutate({ applicationId: selected.id, action: "REJECT", adminNote })
                }
              >
                Reject
              </Button>
            </div>
            <p className="text-xs text-neutral-500">
              On approval, the system generates company email/password and sends credentials via notification.
            </p>
          </div>
        ) : null}
      </AppDrawer>
    </div>
  );
}
