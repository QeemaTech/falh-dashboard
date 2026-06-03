import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import axios from "axios";
import { Search } from "lucide-react";
import { Button } from "../../components/ui/button";
import { Card } from "../../components/ui/card";
import { Input } from "../../components/ui/input";
import { AppBadge, AppDrawer, AppSelect, AppTable, AppTableCell, AppTableHead, AppTableHeaderCell, AppTableRow } from "../../components/design-system";
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

function statusBadge(status: string) {
  if (status === "APPROVED") return "success";
  if (status === "PENDING") return "warning";
  return "danger";
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
    <a href={url} target="_blank" rel="noreferrer" className="text-[#23673A] underline">
      {label}
    </a>
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
        return rejectJoinUsApplicationApi(selectedId, { adminNote: adminNote.trim() || undefined });
      }
      if (detail.applicationType === "COMPANY") {
        return approveJoinUsApplicationApi(selectedId, {
          email: companyEmail.trim().toLowerCase(),
          password: companyPassword,
          maxProducts: Number(maxProducts),
          adminNote: adminNote.trim() || undefined,
        });
      }
      return approveJoinUsApplicationApi(selectedId, { adminNote: adminNote.trim() || undefined });
    },
    onSuccess: (result, variables) => {
      queryClient.invalidateQueries({ queryKey: ["join-us-applications"] });
      queryClient.invalidateQueries({ queryKey: ["join-us-application"] });
      queryClient.invalidateQueries({ queryKey: ["admin-companies"] });
      queryClient.invalidateQueries({ queryKey: ["admin-service-providers"] });
      if (variables.action === "APPROVE" && result && "credentials" in result && result.credentials) {
        setCredentials({ email: result.credentials.email, password: result.credentials.password });
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

  const applications = data?.items || [];

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

  const tabButtons = useMemo(
    () =>
      TABS.map((t) => (
        <button
          key={t.id}
          type="button"
          onClick={() => setTab(t.id)}
          className={`rounded-full px-3 py-1.5 text-xs font-medium transition ${
            tab === t.id ? "bg-[#23673A] text-white" : "bg-neutral-100 text-neutral-600 hover:bg-neutral-200"
          }`}
        >
          {t.label}
        </button>
      )),
    [tab]
  );

  return (
    <div className="min-w-0 space-y-4 overflow-x-hidden">
      <div>
        <h1 className="text-xl font-semibold text-(--app-text-primary)">Join Requests</h1>
        <p className="text-sm text-(--app-text-secondary)">Review company and service provider applications from the mobile app.</p>
      </div>

      <Card className="flex flex-wrap gap-2 p-3">{tabButtons}</Card>

      <Card className="flex flex-wrap items-center gap-2 p-4">
        <div className="relative w-72">
          <Search className="pointer-events-none absolute inset-s-3 top-3 size-4 text-neutral-400" />
          <Input className="ps-9" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search by name, phone, city..." />
        </div>
        <AppSelect value={status} onChange={(e) => setStatus(e.target.value)}>
          <option value="">All statuses</option>
          <option value="PENDING">Pending</option>
          <option value="APPROVED">Approved</option>
          <option value="REJECTED">Rejected</option>
        </AppSelect>
      </Card>

      {isLoading ? <Card>Loading join requests...</Card> : null}
      {isError ? <Card>Failed: {(error as Error).message}</Card> : null}
      {!isLoading && !applications.length ? <Card>No join requests found.</Card> : null}

      {applications.length > 0 ? (
        <AppTable>
          <AppTableHead>
            <tr>
              <AppTableHeaderCell>Applicant Name</AppTableHeaderCell>
              <AppTableHeaderCell>Type</AppTableHeaderCell>
              <AppTableHeaderCell>Phone</AppTableHeaderCell>
              <AppTableHeaderCell>City</AppTableHeaderCell>
              <AppTableHeaderCell>Status</AppTableHeaderCell>
              <AppTableHeaderCell>Created At</AppTableHeaderCell>
              <AppTableHeaderCell>Actions</AppTableHeaderCell>
            </tr>
          </AppTableHead>
          <tbody>
            {applications.map((app) => (
              <AppTableRow key={app.id}>
                <AppTableCell className="font-medium">{app.applicantName}</AppTableCell>
                <AppTableCell>{TYPE_LABELS[app.applicationType] || app.applicationType}</AppTableCell>
                <AppTableCell>{app.phone}</AppTableCell>
                <AppTableCell>{app.city}</AppTableCell>
                <AppTableCell>
                  <AppBadge variant={statusBadge(app.status) as "success" | "warning" | "danger"}>{app.status}</AppBadge>
                </AppTableCell>
                <AppTableCell>{formatDate(app.createdAt)}</AppTableCell>
                <AppTableCell>
                  <Button variant="ghost" onClick={() => openReview(app)}>
                    View
                  </Button>
                </AppTableCell>
              </AppTableRow>
            ))}
          </tbody>
        </AppTable>
      ) : null}

      <AppDrawer
        open={Boolean(selectedId)}
        onClose={() => {
          setSelectedId(null);
          setCredentials(null);
        }}
        title="Review Join Request"
      >
        {detailLoading ? <p className="text-sm">Loading details...</p> : null}
        {detail ? (
          <div className="space-y-3 text-sm">
            <p>
              <span className="font-medium">Type:</span> {TYPE_LABELS[detail.applicationType] || detail.applicationType}
            </p>
            <p>
              <span className="font-medium">Status:</span> {detail.status}
            </p>

            {isCompanyReview ? (
              <>
                <p><span className="font-medium">Company Name:</span> {String(reviewFields.companyName || detail.companyName || "-")}</p>
                <p><span className="font-medium">Applicant Name:</span> {String(reviewFields.applicantName || detail.fullName)}</p>
                <p><span className="font-medium">Phone:</span> {String(reviewFields.phone || detail.phone)}</p>
                <p><span className="font-medium">Email:</span> {String(reviewFields.email || detail.email || "-")}</p>
                <p><span className="font-medium">City:</span> {String(reviewFields.city || detail.city)}</p>
                <p><span className="font-medium">Description:</span> {String(reviewFields.description || detail.description || "-")}</p>
                <p>
                  <span className="font-medium">Business License:</span>{" "}
                  <AssetLink path={String(reviewFields.businessLicense || detail.businessLicense || "")} label="View file" />
                </p>
                <p>
                  <span className="font-medium">Commercial Registration:</span>{" "}
                  <AssetLink path={String(reviewFields.commercialReg || detail.commercialReg || "")} label="View file" />
                </p>

                <div>
                  <label className="mb-1 block font-medium">Product quota on approval</label>
                  <Input type="number" min={1} value={maxProducts} onChange={(e) => setMaxProducts(e.target.value)} />
                </div>
                <div>
                  <label className="mb-1 block font-medium">Company login email</label>
                  <Input type="email" value={companyEmail} onChange={(e) => setCompanyEmail(e.target.value)} />
                </div>
                <div>
                  <label className="mb-1 block font-medium">Company login password</label>
                  <div className="flex gap-2">
                    <Input type="text" value={companyPassword} onChange={(e) => setCompanyPassword(e.target.value)} />
                    <Button type="button" variant="outline" onClick={() => setCompanyPassword(generatePassword())}>
                      Generate
                    </Button>
                  </div>
                </div>
              </>
            ) : (
              <>
                <p><span className="font-medium">Full Name:</span> {String(reviewFields.fullName || detail.fullName)}</p>
                <p><span className="font-medium">City:</span> {String(reviewFields.city || detail.city)}</p>
                <p><span className="font-medium">WhatsApp:</span> {String(reviewFields.whatsapp || detail.whatsappNumber || "-")}</p>
                <p><span className="font-medium">Phone:</span> {String(reviewFields.phone || detail.phone)}</p>
                <p><span className="font-medium">Bio:</span> {String(reviewFields.bio || detail.bio || "-")}</p>
                <p>
                  <span className="font-medium">Specializations:</span>{" "}
                  {Array.isArray(reviewFields.specializations)
                    ? (reviewFields.specializations as string[]).join(", ") || "-"
                    : (detail.specializations || []).join(", ") || "-"}
                </p>
                <p>
                  <span className="font-medium">Experience:</span>{" "}
                  {String(reviewFields.experience ?? detail.yearsOfExperience ?? "-")} years
                </p>
                {detail.otherTypeLabel ? (
                  <p><span className="font-medium">Other type:</span> {detail.otherTypeLabel}</p>
                ) : null}
                <p>
                  <span className="font-medium">Identity Image:</span>{" "}
                  <AssetLink path={String(reviewFields.idImage || detail.idImage || "")} label="View" />
                </p>
                <p>
                  <span className="font-medium">License Image:</span>{" "}
                  <AssetLink path={String(reviewFields.licenseImage || detail.licenseImage || "")} label="View" />
                </p>
              </>
            )}

            <div>
              <label className="mb-1 block font-medium">Admin note</label>
              <Input value={adminNote} onChange={(e) => setAdminNote(e.target.value)} />
            </div>

            {credentials ? (
              <Card className="space-y-2 border border-[#23673A]/30 bg-[#23673A]/5 p-3">
                <p className="font-medium text-[#23673A]">Company account created</p>
                <p>Email: {credentials.email}</p>
                <p>Password: {credentials.password}</p>
                <p className="text-xs text-neutral-500">Share via email, SMS, or WhatsApp.</p>
                <Button onClick={() => { setSelectedId(null); setCredentials(null); }}>Close</Button>
              </Card>
            ) : null}

            {formError ? <p className="text-sm text-red-600">{formError}</p> : null}

            {!credentials && detail.status === "PENDING" ? (
              <div className="flex gap-2 pt-2">
                <Button disabled={reviewMutation.isPending} onClick={handleApprove}>
                  {detail.review.approveButtonText}
                </Button>
                <Button
                  variant="outline"
                  disabled={reviewMutation.isPending}
                  onClick={() => reviewMutation.mutate({ action: "REJECT" })}
                >
                  Reject
                </Button>
              </div>
            ) : null}
          </div>
        ) : null}
      </AppDrawer>
    </div>
  );
}
