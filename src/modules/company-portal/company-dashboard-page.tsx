import { useMemo, useState, type ReactNode } from "react";
import { useQuery } from "@tanstack/react-query";
import { Area, AreaChart, Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis } from "recharts";
import { Link as RouterLink } from "react-router-dom";
import {
  Alert,
  Avatar,
  Box,
  Button,
  Chip,
  Grid,
  Paper,
  Skeleton,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  ToggleButton,
  ToggleButtonGroup,
  Typography,
} from "@mui/material";
import {
  Add,
  CheckCircle,
  Drafts,
  HighlightOff,
  Inventory2,
  PendingActions,
  SpaceDashboard,
  Star,
  WarningAmber,
} from "@mui/icons-material";
import { AnalyticsWidget } from "../../components/analytics-widget";
import { EmptyState } from "../../components/layout";
import { useI18n } from "../../hooks/use-i18n";
import { fetchCompanyDashboard } from "../../services/company-api";
import { resolveAssetUrl } from "../../utils/asset-url";

type DashboardPeriod = "today" | "week" | "month";

function getPeriodStart(period: DashboardPeriod) {
  const now = new Date();
  if (period === "today") {
    const start = new Date(now);
    start.setHours(0, 0, 0, 0);
    return start;
  }
  if (period === "week") {
    const start = new Date(now);
    start.setDate(start.getDate() - 7);
    return start;
  }
  const start = new Date(now);
  start.setDate(start.getDate() - 30);
  return start;
}

function filterByPeriod<T extends { createdAt?: string }>(items: T[] | undefined, period: DashboardPeriod) {
  const start = getPeriodStart(period);
  return (items || []).filter((item) => item.createdAt && new Date(item.createdAt) >= start);
}

function periodScale(period: DashboardPeriod) {
  if (period === "today") return 0.35;
  if (period === "week") return 0.65;
  return 1;
}

function statusChipColor(status: string): "success" | "warning" | "error" | "default" {
  if (status === "ACTIVE") return "success";
  if (status === "PENDING") return "warning";
  if (status === "REJECTED") return "error";
  return "default";
}

function DashboardSkeleton() {
  return (
    <Stack spacing={3}>
      <Skeleton variant="rounded" height={120} />
      <Grid container spacing={2}>
        {Array.from({ length: 8 }).map((_, index) => (
          <Grid key={`sk-stat-${index}`} size={{ xs: 12, sm: 6, xl: 3 }}>
            <Skeleton variant="rounded" height={128} />
          </Grid>
        ))}
      </Grid>
      <Grid container spacing={2}>
        {Array.from({ length: 4 }).map((_, index) => (
          <Grid key={`sk-chart-${index}`} size={{ xs: 12, xl: 6 }}>
            <Skeleton variant="rounded" height={320} />
          </Grid>
        ))}
      </Grid>
    </Stack>
  );
}

function ChartCard({
  title,
  badge,
  subtitle,
  children,
}: {
  title: string;
  badge?: string;
  subtitle?: string;
  children: ReactNode;
}) {
  return (
    <Paper sx={{ p: 2, height: "100%" }}>
      <Stack direction="row" sx={{ justifyContent: "space-between", alignItems: "flex-start", mb: 2 }}>
        <Box>
          <Typography variant="h6" sx={{ fontWeight: 600 }}>
            {title}
          </Typography>
          {subtitle ? (
            <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
              {subtitle}
            </Typography>
          ) : null}
        </Box>
        {badge ? <Chip label={badge} size="small" color="primary" variant="outlined" /> : null}
      </Stack>
      <Box sx={{ height: 256, borderRadius: 2, bgcolor: "action.hover", p: 1 }}>{children}</Box>
    </Paper>
  );
}

export function CompanyDashboardPage() {
  const { t, language } = useI18n();
  const locale = language === "ar" ? "ar-EG" : "en-US";
  const [period, setPeriod] = useState<DashboardPeriod>("month");

  const periodLabel =
    period === "today"
      ? t("dashboard.period.today")
      : period === "week"
        ? t("dashboard.period.week")
        : t("dashboard.period.month");

  const { data, isLoading, isError, error } = useQuery({
    queryKey: ["company-dashboard"],
    queryFn: fetchCompanyDashboard,
  });

  const scale = periodScale(period);
  const periodProducts = useMemo(
    () => filterByPeriod(data?.recentProducts, period),
    [data?.recentProducts, period]
  );

  const productStatusLabel = (status: string) => {
    const key = `products.status.${status}`;
    const label = t(key);
    return label === key ? status : label;
  };

  const catalogData = useMemo(() => {
    const products = data?.products;
    if (!products) return [];
    return [
      { name: t("dashboard.week.w1"), active: Math.round(products.active * 0.2 * scale), pending: Math.round(products.pending * 0.25 * scale) },
      { name: t("dashboard.week.w2"), active: Math.round(products.active * 0.35 * scale), pending: Math.round(products.pending * 0.4 * scale) },
      { name: t("dashboard.week.w3"), active: Math.round(products.active * 0.55 * scale), pending: Math.round(products.pending * 0.7 * scale) },
      { name: t("dashboard.week.w4"), active: Math.round(products.active * scale), pending: Math.round(products.pending * scale) },
    ];
  }, [data?.products, scale, t]);

  const statusBreakdown = useMemo(() => {
    const products = data?.products;
    if (!products) return [];
    return [
      { label: t("company.dashboard.statActive"), value: Math.round(products.active * scale) },
      { label: t("company.dashboard.statPending"), value: Math.round(products.pending * scale) },
      { label: t("company.dashboard.statRejected"), value: Math.round(products.rejected * scale) },
      { label: t("company.dashboard.statDraft"), value: Math.round(products.draft * scale) },
    ];
  }, [data?.products, scale, t]);

  const productFlowData = useMemo(() => {
    const products = data?.products;
    if (!products) return [];
    return [
      { step: t("dashboard.productFlow.submitted"), count: Math.round(products.total * scale) },
      { step: t("dashboard.productFlow.pending"), count: Math.round(products.pending * scale) },
      { step: t("dashboard.productFlow.approved"), count: Math.round(products.active * scale) },
    ];
  }, [data?.products, scale, t]);

  const weeklyActivity = useMemo(() => {
    const products = data?.products;
    if (!products) return [];
    return [
      { day: t("dashboard.days.sun"), active: Math.round(products.active * 0.1 * scale), pending: Math.round(products.pending * 0.12 * scale), rejected: Math.round(products.rejected * 0.08 * scale) },
      { day: t("dashboard.days.mon"), active: Math.round(products.active * 0.14 * scale), pending: Math.round(products.pending * 0.18 * scale), rejected: Math.round(products.rejected * 0.1 * scale) },
      { day: t("dashboard.days.tue"), active: Math.round(products.active * 0.18 * scale), pending: Math.round(products.pending * 0.2 * scale), rejected: Math.round(products.rejected * 0.12 * scale) },
      { day: t("dashboard.days.wed"), active: Math.round(products.active * 0.16 * scale), pending: Math.round(products.pending * 0.15 * scale), rejected: Math.round(products.rejected * 0.14 * scale) },
      { day: t("dashboard.days.thu"), active: Math.round(products.active * 0.15 * scale), pending: Math.round(products.pending * 0.14 * scale), rejected: Math.round(products.rejected * 0.1 * scale) },
      { day: t("dashboard.days.fri"), active: Math.round(products.active * 0.12 * scale), pending: Math.round(products.pending * 0.11 * scale), rejected: Math.round(products.rejected * 0.09 * scale) },
      { day: t("dashboard.days.sat"), active: Math.round(products.active * 0.1 * scale), pending: Math.round(products.pending * 0.1 * scale), rejected: Math.round(products.rejected * 0.08 * scale) },
    ];
  }, [data?.products, scale, t]);

  const quickActions = useMemo(
    () => [
      { to: "/company/products", label: t("company.products.add"), disabled: data ? !data.quota.canAdd : false },
      { to: "/company/products", label: t("company.dashboard.viewAll") },
      { to: "/company/profile", label: t("company.nav.profile") },
      { to: "/company/notifications", label: t("company.nav.notifications") },
    ],
    [t, data]
  );

  const chartTooltipFormatter = (
    value: number | string | readonly (number | string)[] | undefined,
    name?: string | number
  ) => {
    const labels: Record<string, string> = {
      active: t("company.dashboard.statActive"),
      pending: t("company.dashboard.statPending"),
      rejected: t("company.dashboard.statRejected"),
      value: t("dashboard.col.amount"),
      count: t("company.dashboard.statTotal"),
    };
    const raw = Array.isArray(value) ? value[0] : value;
    const numeric = typeof raw === "number" ? raw : Number(raw);
    const display = Number.isFinite(numeric) ? numeric.toLocaleString(locale) : String(raw ?? "");
    const nameKey = String(name ?? "");
    return [display, labels[nameKey] || nameKey];
  };

  if (isLoading) return <DashboardSkeleton />;

  if (isError || !data) {
    return (
      <EmptyState title={t("company.dashboard.loadFailed")} description={(error as Error)?.message} />
    );
  }

  const { company, quota, products, recentProducts } = data;
  const listingHint = company.listingExpiresAt
    ? `${t("company.dashboard.listingExpires")}: ${new Date(company.listingExpiresAt).toLocaleDateString(locale)}`
    : t("company.dashboard.listingOpen");

  return (
    <Stack spacing={3} key={language}>
      <Paper
        sx={{
          p: 3,
          background: (theme) =>
            `linear-gradient(120deg, ${theme.palette.primary.main}18, transparent 40%)`,
        }}
      >
        <Stack spacing={2}>
          <Stack
            direction={{ xs: "column", md: "row" }}
            spacing={2}
            sx={{ justifyContent: "space-between", alignItems: { md: "center" } }}
          >
            <Box>
              <Typography variant="overline" color="primary" sx={{ fontWeight: 700, letterSpacing: 1.5 }}>
                {t("company.dashboard.hero.badge")}
              </Typography>
              <Typography variant="h5" sx={{ mt: 1, fontWeight: 700 }}>
                {t("company.dashboard.hero.title")}
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mt: 1, maxWidth: 560 }}>
                {`${t("company.dashboard.welcome")}, ${company.name}. ${t("company.dashboard.hero.subtitle")}`}
              </Typography>
            </Box>
            <Stack direction="row" spacing={1} sx={{ alignItems: "center", flexWrap: "wrap" }}>
              <ToggleButtonGroup
                exclusive
                size="small"
                value={period}
                onChange={(_, value: DashboardPeriod | null) => value && setPeriod(value)}
              >
                <ToggleButton value="today">{t("dashboard.period.today")}</ToggleButton>
                <ToggleButton value="week">{t("dashboard.period.week")}</ToggleButton>
                <ToggleButton value="month">{t("dashboard.period.month")}</ToggleButton>
              </ToggleButtonGroup>
              <Button
                component={RouterLink}
                to="/company/products"
                variant="contained"
                startIcon={<Add />}
                disabled={!quota.canAdd}
              >
                {t("company.products.add")}
              </Button>
            </Stack>
          </Stack>
          <Typography variant="caption" color="text.secondary">
            {t("dashboard.showingDataFor")} {periodLabel} · {company.name}
          </Typography>
        </Stack>
      </Paper>

      {!quota.canAdd ? (
        <Alert severity="warning">
          {quota.companyStatus !== "APPROVED"
            ? t("company.dashboard.notApproved")
            : !quota.listingActive
              ? t("company.dashboard.listingExpired")
              : t("company.dashboard.quotaFull")}
        </Alert>
      ) : null}

      <Grid container spacing={2}>
        <Grid size={{ xs: 12, sm: 6, xl: 3 }}>
          <AnalyticsWidget
            title={t("company.dashboard.statTotal")}
            value={period === "month" ? products.total : periodProducts.length}
            icon={<Inventory2 fontSize="small" />}
            change={`${quota.used}/${quota.maxProducts}`}
            hint={periodLabel}
            sparkline={[18, 24, 30, 36, 42, 48].map((v) => Math.round(v * scale))}
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, xl: 3 }}>
          <AnalyticsWidget
            title={t("company.dashboard.statActive")}
            value={Math.round(products.active * scale)}
            icon={<CheckCircle fontSize="small" />}
            change="+8.2%"
            trend="up"
            hint={t("company.dashboard.statActiveHint")}
            sparkline={[12, 18, 22, 28, 35, 40].map((v) => Math.round(v * scale))}
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, xl: 3 }}>
          <AnalyticsWidget
            title={t("company.dashboard.statPending")}
            value={Math.round(products.pending * scale)}
            icon={<PendingActions fontSize="small" />}
            change="-1.4%"
            trend="down"
            hint={t("company.dashboard.statPendingHint")}
            sparkline={[40, 36, 32, 28, 24, 20].map((v) => Math.round(v * scale))}
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, xl: 3 }}>
          <AnalyticsWidget
            title={t("company.dashboard.statRejected")}
            value={Math.round(products.rejected * scale)}
            icon={<HighlightOff fontSize="small" />}
            change="-0.8%"
            trend="down"
            hint={t("company.dashboard.statRejectedHint")}
            sparkline={[22, 20, 18, 16, 14, 12].map((v) => Math.round(v * scale))}
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, xl: 3 }}>
          <AnalyticsWidget
            title={t("company.dashboard.statDraft")}
            value={Math.round(products.draft * scale)}
            icon={<Drafts fontSize="small" />}
            change={`${products.draft}`}
            hint={periodLabel}
            sparkline={[8, 10, 9, 12, 11, 13].map((v) => Math.round(v * scale))}
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, xl: 3 }}>
          <AnalyticsWidget
            title={t("company.dashboard.quotaRemaining")}
            value={quota.remaining}
            icon={<SpaceDashboard fontSize="small" />}
            change={`${quota.used}/${quota.maxProducts}`}
            hint={t("company.dashboard.quotaUsed")}
            sparkline={[30, 28, 26, 24, 22, quota.remaining || 1].map((v) => Math.max(v, 1))}
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, xl: 3 }}>
          <AnalyticsWidget
            title={t("company.dashboard.listing")}
            value={
              company.listingActive
                ? t("company.dashboard.listingActive")
                : t("company.dashboard.listingInactive")
            }
            icon={company.listingActive ? <CheckCircle fontSize="small" /> : <WarningAmber fontSize="small" />}
            change={company.status}
            hint={listingHint}
            sparkline={[40, 42, 44, 43, 45, company.listingActive ? 48 : 20]}
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, xl: 3 }}>
          <AnalyticsWidget
            title={t("company.profile.rating")}
            value={company.rating.toFixed(1)}
            icon={<Star fontSize="small" />}
            change={`${company.reviewCount}`}
            hint={t("company.dashboard.reviewsHint")}
            sparkline={[20, 24, 28, 30, 34, 38]}
          />
        </Grid>
      </Grid>

      <Grid container spacing={2}>
        <Grid size={{ xs: 12, xl: 6 }}>
          <ChartCard title={t("company.dashboard.charts.catalog")} badge={t("company.dashboard.charts.catalogBadge")}>
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={catalogData}>
                <defs>
                  <linearGradient id="companyActive" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#23673A" stopOpacity={0.35} />
                    <stop offset="95%" stopColor="#23673A" stopOpacity={0.02} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="4 4" vertical={false} stroke="#E4E7EC" />
                <XAxis axisLine={false} tickLine={false} dataKey="name" />
                <Tooltip formatter={chartTooltipFormatter} />
                <Area type="monotone" dataKey="active" stroke="#23673A" strokeWidth={2.5} fill="url(#companyActive)" />
                <Area type="monotone" dataKey="pending" stroke="#69A87B" strokeWidth={2} fill="transparent" />
              </AreaChart>
            </ResponsiveContainer>
          </ChartCard>
        </Grid>
        <Grid size={{ xs: 12, xl: 6 }}>
          <ChartCard title={t("company.dashboard.charts.status")} badge={t("company.dashboard.charts.statusBadge")}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={statusBreakdown}>
                <CartesianGrid strokeDasharray="4 4" vertical={false} stroke="#E4E7EC" />
                <XAxis axisLine={false} tickLine={false} dataKey="label" />
                <Tooltip formatter={chartTooltipFormatter} />
                <Bar dataKey="value" fill="#23673A" radius={[8, 8, 0, 0]} barSize={12} />
              </BarChart>
            </ResponsiveContainer>
          </ChartCard>
        </Grid>
        <Grid size={{ xs: 12, xl: 6 }}>
          <ChartCard title={t("company.dashboard.charts.flow")} badge={t("dashboard.charts.productsBadge")}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={productFlowData}>
                <CartesianGrid strokeDasharray="4 4" vertical={false} stroke="#E4E7EC" />
                <XAxis axisLine={false} tickLine={false} dataKey="step" />
                <Tooltip formatter={chartTooltipFormatter} />
                <Bar dataKey="count" fill="#15803D" radius={[8, 8, 0, 0]} barSize={12} />
              </BarChart>
            </ResponsiveContainer>
          </ChartCard>
        </Grid>
        <Grid size={{ xs: 12, xl: 6 }}>
          <ChartCard
            title={t("company.dashboard.charts.activity")}
            subtitle={t("dashboard.charts.analyticsSubtitle")}
          >
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={weeklyActivity} barGap={10} barCategoryGap="44%">
                <CartesianGrid strokeDasharray="3 5" vertical={false} stroke="#dbe7de" />
                <XAxis axisLine={false} tickLine={false} dataKey="day" tick={{ fill: "#6b7280", fontSize: 11 }} />
                <Tooltip cursor={{ fill: "rgba(35, 103, 58, 0.08)" }} formatter={chartTooltipFormatter} />
                <Bar dataKey="active" fill="#82b695" radius={[8, 8, 0, 0]} barSize={6} />
                <Bar dataKey="pending" fill="#23673A" radius={[8, 8, 0, 0]} barSize={6} />
                <Bar dataKey="rejected" fill="#c7ddcd" radius={[8, 8, 0, 0]} barSize={6} />
              </BarChart>
            </ResponsiveContainer>
          </ChartCard>
        </Grid>
      </Grid>

      <Grid container spacing={2}>
        <Grid size={{ xs: 12, xl: 4 }}>
          <Paper sx={{ p: 2, height: "100%" }}>
            <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 2 }}>
              {t("company.dashboard.quotaTitle")}
            </Typography>
            <Stack spacing={1.5}>
              <Box sx={{ display: "flex", justifyContent: "space-between" }}>
                <Typography variant="body2" color="text.secondary">
                  {t("company.dashboard.quotaUsed")}
                </Typography>
                <Typography variant="body2" sx={{ fontWeight: 600 }}>
                  {quota.used} / {quota.maxProducts}
                </Typography>
              </Box>
              <Box sx={{ display: "flex", justifyContent: "space-between" }}>
                <Typography variant="body2" color="text.secondary">
                  {t("company.dashboard.quotaRemaining")}
                </Typography>
                <Typography variant="body2" sx={{ fontWeight: 600 }}>
                  {quota.remaining}
                </Typography>
              </Box>
              <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <Typography variant="body2" color="text.secondary">
                  {t("company.profile.status")}
                </Typography>
                <Chip
                  size="small"
                  label={company.status}
                  color={company.status === "APPROVED" ? "success" : "warning"}
                />
              </Box>
              <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <Typography variant="body2" color="text.secondary">
                  {t("company.dashboard.listing")}
                </Typography>
                <Chip
                  size="small"
                  icon={company.listingActive ? <CheckCircle /> : <WarningAmber />}
                  label={
                    company.listingActive
                      ? t("company.dashboard.listingActive")
                      : t("company.dashboard.listingInactive")
                  }
                  color={company.listingActive ? "success" : "warning"}
                  variant="outlined"
                />
              </Box>
              <Typography variant="caption" color="text.secondary">
                {listingHint}
              </Typography>
            </Stack>
          </Paper>
        </Grid>

        <Grid size={{ xs: 12, xl: 8 }}>
          <Paper sx={{ p: 2, height: "100%" }}>
            <Stack direction="row" sx={{ justifyContent: "space-between", alignItems: "center", mb: 2 }}>
              <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
                {t("company.dashboard.recentTitle")}
              </Typography>
              <Button component={RouterLink} to="/company/products" size="small">
                {t("company.dashboard.viewAll")}
              </Button>
            </Stack>
            {recentProducts.length === 0 ? (
              <Typography variant="body2" color="text.secondary" sx={{ py: 4, textAlign: "center" }}>
                {t("company.products.empty")}
              </Typography>
            ) : (
              <TableContainer>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>{t("company.products.col.image")}</TableCell>
                      <TableCell>{t("company.products.col.title")}</TableCell>
                      <TableCell>{t("company.products.col.status")}</TableCell>
                      <TableCell>{t("company.products.col.price")}</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {(period === "month" ? recentProducts : periodProducts).slice(0, 6).map((product) => (
                      <TableRow key={product.id} hover>
                        <TableCell>
                          {product.images?.[0]?.path ? (
                            <Avatar
                              variant="rounded"
                              src={resolveAssetUrl(product.images[0].path)}
                              alt=""
                              sx={{ width: 36, height: 36 }}
                            />
                          ) : (
                            <Avatar variant="rounded" sx={{ width: 36, height: 36, bgcolor: "grey.300" }} />
                          )}
                        </TableCell>
                        <TableCell>{product.title}</TableCell>
                        <TableCell>
                          <Chip
                            label={productStatusLabel(product.status)}
                            color={statusChipColor(product.status)}
                            size="small"
                          />
                        </TableCell>
                        <TableCell sx={{ color: "primary.main" }}>
                          {product.price ? `EGP ${Number(product.price).toLocaleString(locale)}` : "-"}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            )}
          </Paper>
        </Grid>
      </Grid>

      <Paper sx={{ p: 2 }}>
        <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 2 }}>
          {t("dashboard.quickActions")}
        </Typography>
        <Grid container spacing={2}>
          {quickActions.map((action, index) => (
            <Grid key={`${action.to}-${index}`} size={{ xs: 12, sm: 6, lg: 3 }}>
              <Button
                component={RouterLink}
                to={action.to}
                variant="contained"
                fullWidth
                disabled={action.disabled}
              >
                {action.label}
              </Button>
            </Grid>
          ))}
        </Grid>
      </Paper>
    </Stack>
  );
}
