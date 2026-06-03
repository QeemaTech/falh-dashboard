import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import axios from "axios";
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

function openReviewForm(app: CompanyApplication) {
  const slug = app.companyName
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ".")
    .replace(/^\.+|\.+$/g, "")
    .slice(0, 24);
  return {
    maxProducts: "10",
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
      email?: string;
      password?: string;
      adminNote?: string;
    }) =>
      reviewCompanyApplicationApi(payload.applicationId, {
        action: payload.action,
        maxProducts: payload.maxProducts,
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

  const applications = data?.items || [];

  function handleSelectApplication(app: CompanyApplication) {
    const form = openReviewForm(app);
    setSelected(app);
    setMaxProducts(form.maxProducts);
    setAdminNote(form.adminNote);
    setCompanyEmail(form.companyEmail);
    setCompanyPassword(form.companyPassword);
    setFormError("");
  }

  function handleApprove() {
    if (!selected) return;
    const quota = Number(maxProducts);
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

    setFormError("");
    reviewMutation.mutate({
      applicationId: selected.id,
      action: "APPROVE",
      maxProducts: quota,
      email,
      password,
      adminNote: adminNote.trim() || undefined,
    });
  }

  return (
    <div className="min-w-0 space-y-4 overflow-x-hidden">
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
                  <Button variant="ghost" onClick={() => handleSelectApplication(app)}>
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
              <label className="mb-1 block font-medium">Product quota on approval</label>
              <Input
                type="number"
                min={1}
                step={1}
                inputMode="numeric"
                className="[appearance:textfield] [&::-webkit-inner-spin-button]:appearance-auto [&::-webkit-outer-spin-button]:appearance-auto"
                value={maxProducts}
                onChange={(e) => setMaxProducts(e.target.value)}
              />
            </div>

            <div>
              <label className="mb-1 block font-medium">Company login email</label>
              <Input
                type="email"
                autoComplete="off"
                placeholder="company@example.com"
                value={companyEmail}
                onChange={(e) => setCompanyEmail(e.target.value)}
              />
            </div>

            <div>
              <label className="mb-1 block font-medium">Company login password</label>
              <Input
                type="password"
                autoComplete="new-password"
                placeholder="Min. 6 characters"
                value={companyPassword}
                onChange={(e) => setCompanyPassword(e.target.value)}
              />
            </div>

            <div>
              <label className="mb-1 block font-medium">Admin note</label>
              <Input value={adminNote} onChange={(e) => setAdminNote(e.target.value)} />
            </div>

            {formError ? <p className="text-sm text-red-600">{formError}</p> : null}

            <div className="flex gap-2 pt-2">
              <Button
                disabled={selected.status !== "PENDING" || reviewMutation.isPending}
                onClick={handleApprove}
              >
                Approve & Create Login
              </Button>
              <Button
                variant="outline"
                disabled={selected.status !== "PENDING" || reviewMutation.isPending}
                onClick={() => {
                  setFormError("");
                  reviewMutation.mutate({ applicationId: selected.id, action: "REJECT", adminNote: adminNote.trim() || undefined });
                }}
              >
                Reject
              </Button>
            </div>
            <p className="text-xs text-neutral-500">
              Enter the email and password the company will use to sign in. Share these credentials with the applicant after approval.
            </p>
          </div>
        ) : null}
      </AppDrawer>
    </div>
  );
}
