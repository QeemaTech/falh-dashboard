import { useMemo, useState, type ReactNode } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Link as RouterLink } from "react-router-dom";
import {
  Box,
  Button,
  Chip,
  Grid,
  IconButton,
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
  ArrowForward,
  Business,
  Inventory2,
  LocalShipping,
  MonetizationOn,
  PendingActions,
  People,
  Refresh,
  Storefront,
  Warehouse,
} from "@mui/icons-material";
import { EmptyState, PageHeader } from "../../components/layout";
import { AppStatCard } from "../../components/design-system";
import { useI18n } from "../../hooks/use-i18n";
import { fetchDashboardStats } from "../../services/admin-api";
import type { DashboardPeriod } from "../../types/dashboard";
import { formatCurrency } from "../../utils/format";

function formatChange(value?: number) {
  const n = Number(value || 0);
  const sign = n > 0 ? "+" : "";
  return `${sign}${n.toFixed(1)}%`;
}

function changeTrend(value?: number): "up" | "down" | "neutral" {
  const n = Number(value || 0);
  if (n > 0) return "up";
  if (n < 0) return "down";
  return "neutral";
}

function DashboardSkeleton() {
  return (
    <Stack spacing={2.5}>
      <Skeleton variant="rounded" height={72} sx={{ borderRadius: "8px" }} />
      <Grid container spacing={2}>
        {Array.from({ length: 8 }).map((_, index) => (
          <Grid key={`sk-stat-${index}`} size={{ xs: 12, sm: 6, xl: 3 }}>
            <Skeleton variant="rounded" height={112} sx={{ borderRadius: "8px" }} />
          </Grid>
        ))}
      </Grid>
      <Grid container spacing={2}>
        {Array.from({ length: 2 }).map((_, index) => (
          <Grid key={`sk-chart-${index}`} size={{ xs: 12, lg: 6 }}>
            <Skeleton variant="rounded" height={320} sx={{ borderRadius: "8px" }} />
          </Grid>
        ))}
      </Grid>
    </Stack>
  );
}

function ChartCard({
  title,
  subtitle,
  action,
  children,
}: {
  title: string;
  subtitle?: string;
  action?: ReactNode;
  children: ReactNode;
}) {
  return (
    <Paper
      variant="outlined"
      sx={{ p: { xs: 2, md: 2.5 }, height: "100%", borderRadius: "8px", borderColor: "divider" }}
    >
      <Stack
        direction="row"
        spacing={1}
        sx={{ justifyContent: "space-between", alignItems: "flex-start", mb: 2 }}
      >
        <Box sx={{ minWidth: 0 }}>
          <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
            {title}
          </Typography>
          {subtitle ? (
            <Typography variant="body2" color="text.secondary" sx={{ mt: 0.25 }}>
              {subtitle}
            </Typography>
          ) : null}
        </Box>
        {action}
      </Stack>
      <Box sx={{ height: 280 }}>{children}</Box>
    </Paper>
  );
}

function StatLinkCard({
  to,
  title,
  value,
  hint,
  change,
  trend,
  icon,
}: {
  to: string;
  title: string;
  value: string | number;
  hint?: string;
  change?: string;
  trend?: "up" | "down" | "neutral";
  icon: ReactNode;
}) {
  return (
    <Box
      component={RouterLink}
      to={to}
      sx={{
        display: "block",
        textDecoration: "none",
        color: "inherit",
        height: "100%",
        borderRadius: "8px",
        transition: "transform 0.15s ease, box-shadow 0.15s ease",
        "&:hover": {
          transform: "translateY(-2px)",
          "& .MuiCard-root": {
            borderColor: "primary.main",
          },
        },
      }}
    >
      <AppStatCard title={title} value={value} hint={hint} change={change} trend={trend} icon={icon} />
    </Box>
  );
}

export function DashboardPage() {
  const { t, language } = useI18n();
  const locale = language === "ar" ? "ar-EG" : "en-US";
  const currency = t("market.currency");
  const [period, setPeriod] = useState<DashboardPeriod>("month");

  const periodLabel =
    period === "today"
      ? t("dashboard.period.today")
      : period === "week"
        ? t("dashboard.period.week")
        : t("dashboard.period.month");

  const { data: stats, isLoading, isError, isFetching, refetch } = useQuery({
    queryKey: ["dashboard-stats", period],
    queryFn: () => fetchDashboardStats(period),
    placeholderData: (previous) => previous,
  });

  const series = useMemo(() => {
    return (stats?.series || []).map((point) => ({
      ...point,
      label: new Date(point.date).toLocaleDateString(locale, {
        month: "short",
        day: "numeric",
      }),
    }));
  }, [stats?.series, locale]);

  const growthData = useMemo(
    () => [
      { label: t("dashboard.growth.users"), value: stats?.periodTotals?.users ?? 0 },
      { label: t("dashboard.growth.products"), value: stats?.periodTotals?.products ?? 0 },
      { label: t("dashboard.growth.companies"), value: stats?.periodTotals?.companies ?? 0 },
      { label: t("dashboard.growth.orders"), value: stats?.periodTotals?.orders ?? 0 },
    ],
    [t, stats?.periodTotals]
  );

  const productFlowData = useMemo(
    () => [
      { step: t("dashboard.productFlow.draft"), count: stats?.productStatus?.draft ?? 0 },
      { step: t("dashboard.productFlow.pending"), count: stats?.productStatus?.pending ?? 0 },
      { step: t("dashboard.productFlow.approved"), count: stats?.productStatus?.active ?? 0 },
      { step: t("dashboard.productFlow.rejected"), count: stats?.productStatus?.rejected ?? 0 },
    ],
    [t, stats?.productStatus]
  );

  const activityData = useMemo(
    () =>
      series.map((point) => ({
        label: point.label,
        users: point.users,
        orders: point.orders,
        products: point.products,
      })),
    [series]
  );

  const chartValueLabels: Record<string, string> = {
    sales: t("dashboard.chart.sales"),
    orders: t("dashboard.chart.orders"),
    users: t("dashboard.growth.users"),
    products: t("dashboard.growth.products"),
    value: t("dashboard.col.amount"),
    count: t("dashboard.stats.totalProducts"),
  };

  const chartTooltipFormatter = (
    value: number | string | readonly (number | string)[] | undefined,
    name?: string | number
  ) => {
    const raw = Array.isArray(value) ? value[0] : value;
    const numeric = typeof raw === "number" ? raw : Number(raw);
    const display = Number.isFinite(numeric) ? numeric.toLocaleString(locale) : String(raw ?? "");
    const nameKey = String(name ?? "");
    return [display, chartValueLabels[nameKey] || nameKey];
  };

  const legendFormatter = (value: string) => chartValueLabels[value] || value;
  const yAxisTickFormatter = (value: number) => value.toLocaleString(locale);

  const orderStatusLabel = (status: string) => {
    const key = `orders.status.${status}`;
    const label = t(key);
    return label === key ? status : label;
  };

  const userRoleLabel = (role: string) => {
    const key = `users.role.${role}`;
    const label = t(key);
    return label === key ? role : label;
  };

  const userStatusLabel = (status: string) => {
    const key = `users.status.${status}`;
    const label = t(key);
    return label === key ? status : label;
  };

  const productStatusLabel = (status: string) => {
    const key = `products.status.${status}`;
    const label = t(key);
    return label === key ? status : label;
  };

  const quickActions = useMemo(
    () => [
      { to: "/pending-products", label: t("dashboard.action.manageProducts") },
      { to: "/companies", label: t("dashboard.action.reviewCompanies") },
      { to: "/categories", label: t("dashboard.action.addCategory") },
      { to: "/banners", label: t("dashboard.action.addBanner") },
    ],
    [t]
  );

  if (isLoading && !stats) return <DashboardSkeleton />;
  if (isError || !stats) {
    return <EmptyState title={t("dashboard.loadFailed")} description={t("dashboard.loadFailedHint")} />;
  }

  const periodTotals = stats.periodTotals || {
    users: 0,
    companies: 0,
    products: 0,
    orders: 0,
    revenue: 0,
  };
  const changes = stats.changes || { users: 0, companies: 0, products: 0, orders: 0, revenue: 0 };
  const recentOrders = stats.recent?.orders || [];
  const recentUsers = stats.recent?.users || [];
  const recentProducts = stats.recent?.products || [];

  return (
    <Stack spacing={2.5} key={language}>
      <Stack
        direction={{ xs: "column", md: "row" }}
        spacing={2}
        sx={{ justifyContent: "space-between", alignItems: { md: "center" } }}
      >
        <PageHeader title={t("dashboard.hero.title")} subtitle={t("dashboard.hero.subtitle")} />
        <Stack direction="row" spacing={1} sx={{ alignItems: "center", flexWrap: "wrap" }}>
          <ToggleButtonGroup
            exclusive
            size="small"
            value={period}
            onChange={(_, value: DashboardPeriod | null) => value && setPeriod(value)}
            sx={{
              bgcolor: "background.paper",
              border: 1,
              borderColor: "divider",
              borderRadius: "8px",
              "& .MuiToggleButton-root": {
                border: 0,
                borderRadius: "8px !important",
                px: 1.5,
                textTransform: "none",
                fontWeight: 600,
              },
              "& .Mui-selected": {
                bgcolor: "primary.main !important",
                color: "primary.contrastText !important",
              },
            }}
          >
            <ToggleButton value="today">{t("dashboard.period.today")}</ToggleButton>
            <ToggleButton value="week">{t("dashboard.period.week")}</ToggleButton>
            <ToggleButton value="month">{t("dashboard.period.month")}</ToggleButton>
          </ToggleButtonGroup>
          <IconButton
            onClick={() => refetch()}
            disabled={isFetching}
            sx={{
              borderRadius: "8px",
              border: 1,
              borderColor: "divider",
              width: 38,
              height: 38,
            }}
            aria-label="refresh"
          >
            <Refresh fontSize="small" />
          </IconButton>
        </Stack>
      </Stack>

      <Typography variant="caption" color="text.secondary">
        {t("dashboard.showingDataFor")} {periodLabel}
        {isFetching ? ` · ${t("common.loading")}` : ""}
      </Typography>

      <Grid container spacing={2}>
        <Grid size={{ xs: 12, sm: 6, xl: 3 }}>
          <StatLinkCard
            to="/users"
            title={t("dashboard.stats.totalUsers")}
            value={periodTotals.users.toLocaleString(locale)}
            change={formatChange(changes.users)}
            trend={changeTrend(changes.users)}
            hint={`${t("dashboard.stats.totalUsers")}: ${stats.totalUsers.toLocaleString(locale)}`}
            icon={<People fontSize="small" />}
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, xl: 3 }}>
          <StatLinkCard
            to="/companies"
            title={t("dashboard.stats.totalCompanies")}
            value={periodTotals.companies.toLocaleString(locale)}
            change={formatChange(changes.companies)}
            trend={changeTrend(changes.companies)}
            hint={`${t("dashboard.stats.totalCompanies")}: ${stats.totalCompanies.toLocaleString(locale)}`}
            icon={<Business fontSize="small" />}
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, xl: 3 }}>
          <StatLinkCard
            to="/products"
            title={t("dashboard.stats.totalProducts")}
            value={periodTotals.products.toLocaleString(locale)}
            change={formatChange(changes.products)}
            trend={changeTrend(changes.products)}
            hint={`${t("dashboard.stats.totalProducts")}: ${stats.totalProducts.toLocaleString(locale)}`}
            icon={<Inventory2 fontSize="small" />}
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, xl: 3 }}>
          <StatLinkCard
            to="/orders"
            title={t("dashboard.stats.totalOrders")}
            value={periodTotals.orders.toLocaleString(locale)}
            change={formatChange(changes.orders)}
            trend={changeTrend(changes.orders)}
            hint={`${t("dashboard.stats.totalOrders")}: ${stats.totalOrders.toLocaleString(locale)}`}
            icon={<LocalShipping fontSize="small" />}
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, xl: 3 }}>
          <StatLinkCard
            to="/finance"
            title={t("dashboard.stats.totalRevenue")}
            value={formatCurrency(periodTotals.revenue, language, currency)}
            change={formatChange(changes.revenue)}
            trend={changeTrend(changes.revenue)}
            hint={`${t("dashboard.stats.totalRevenue")}: ${formatCurrency(stats.revenue, language, currency)}`}
            icon={<MonetizationOn fontSize="small" />}
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, xl: 3 }}>
          <StatLinkCard
            to="/consultants"
            title={t("dashboard.stats.serviceProviders")}
            value={(stats.serviceProviders || 0).toLocaleString(locale)}
            hint={t("dashboard.hint.applicationQueue")}
            icon={<Warehouse fontSize="small" />}
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, xl: 3 }}>
          <StatLinkCard
            to="/pending-products"
            title={t("dashboard.stats.pendingProducts")}
            value={stats.pendingProducts.toLocaleString(locale)}
            hint={t("dashboard.hint.moderation")}
            icon={<PendingActions fontSize="small" />}
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, xl: 3 }}>
          <StatLinkCard
            to="/companies"
            title={t("dashboard.stats.pendingCompanies")}
            value={stats.pendingCompanies.toLocaleString(locale)}
            hint={t("dashboard.hint.applicationQueue")}
            icon={<Storefront fontSize="small" />}
          />
        </Grid>
      </Grid>

      <Grid container spacing={2}>
        <Grid size={{ xs: 12, lg: 7 }}>
          <ChartCard
            title={t("dashboard.charts.revenue")}
            subtitle={periodLabel}
            action={
              <Button
                component={RouterLink}
                to="/finance"
                size="small"
                endIcon={<ArrowForward fontSize="small" />}
                sx={{ borderRadius: "8px" }}
              >
                {t("nav.finance")}
              </Button>
            }
          >
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={series}>
                <defs>
                  <linearGradient id="dashSales" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#23673A" stopOpacity={0.28} />
                    <stop offset="95%" stopColor="#23673A" stopOpacity={0.02} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="4 4" vertical={false} stroke="#E4E7EC" />
                <XAxis dataKey="label" axisLine={false} tickLine={false} tick={{ fontSize: 11 }} minTickGap={28} />
                <YAxis axisLine={false} tickLine={false} width={48} tick={{ fontSize: 11 }} tickFormatter={yAxisTickFormatter} />
                <Tooltip formatter={chartTooltipFormatter} />
                <Legend formatter={legendFormatter} />
                <Area type="monotone" dataKey="sales" stroke="#23673A" strokeWidth={2.5} fill="url(#dashSales)" />
                <Area type="monotone" dataKey="orders" stroke="#69A87B" strokeWidth={2} fill="transparent" />
              </AreaChart>
            </ResponsiveContainer>
          </ChartCard>
        </Grid>
        <Grid size={{ xs: 12, lg: 5 }}>
          <ChartCard title={t("dashboard.charts.projectStatus")} subtitle={periodLabel}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={growthData}>
                <CartesianGrid strokeDasharray="4 4" vertical={false} stroke="#E4E7EC" />
                <XAxis dataKey="label" axisLine={false} tickLine={false} tick={{ fontSize: 11 }} />
                <YAxis axisLine={false} tickLine={false} width={44} tick={{ fontSize: 11 }} tickFormatter={yAxisTickFormatter} />
                <Tooltip formatter={chartTooltipFormatter} />
                <Bar dataKey="value" fill="#23673A" radius={[8, 8, 0, 0]} barSize={28} />
              </BarChart>
            </ResponsiveContainer>
          </ChartCard>
        </Grid>
        <Grid size={{ xs: 12, lg: 6 }}>
          <ChartCard title={t("dashboard.charts.products")} subtitle={t("dashboard.charts.productsBadge")}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={productFlowData}>
                <CartesianGrid strokeDasharray="4 4" vertical={false} stroke="#E4E7EC" />
                <XAxis dataKey="step" axisLine={false} tickLine={false} tick={{ fontSize: 11 }} />
                <YAxis axisLine={false} tickLine={false} width={44} tick={{ fontSize: 11 }} tickFormatter={yAxisTickFormatter} />
                <Tooltip formatter={chartTooltipFormatter} />
                <Bar dataKey="count" fill="#15803D" radius={[8, 8, 0, 0]} barSize={28} />
              </BarChart>
            </ResponsiveContainer>
          </ChartCard>
        </Grid>
        <Grid size={{ xs: 12, lg: 6 }}>
          <ChartCard title={t("dashboard.charts.analytics")} subtitle={periodLabel}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={activityData} barGap={6}>
                <CartesianGrid strokeDasharray="3 5" vertical={false} stroke="#dbe7de" />
                <XAxis dataKey="label" axisLine={false} tickLine={false} tick={{ fontSize: 11 }} minTickGap={24} />
                <YAxis axisLine={false} tickLine={false} width={44} tick={{ fontSize: 11 }} tickFormatter={yAxisTickFormatter} />
                <Tooltip cursor={{ fill: "rgba(35, 103, 58, 0.06)" }} formatter={chartTooltipFormatter} />
                <Legend formatter={legendFormatter} />
                <Bar dataKey="users" fill="#82b695" radius={[8, 8, 0, 0]} barSize={8} />
                <Bar dataKey="orders" fill="#23673A" radius={[8, 8, 0, 0]} barSize={8} />
                <Bar dataKey="products" fill="#c7ddcd" radius={[8, 8, 0, 0]} barSize={8} />
              </BarChart>
            </ResponsiveContainer>
          </ChartCard>
        </Grid>
      </Grid>

      <Grid container spacing={2}>
        <Grid size={{ xs: 12, lg: 4 }}>
          <Paper variant="outlined" sx={{ p: 2, height: "100%", borderRadius: "8px" }}>
            <Stack direction="row" sx={{ justifyContent: "space-between", alignItems: "center", mb: 1.5 }}>
              <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
                {t("dashboard.latestOrders")}
              </Typography>
              <Button component={RouterLink} to="/orders" size="small" sx={{ borderRadius: "8px" }}>
                {t("common.view", "View")}
              </Button>
            </Stack>
            <TableContainer>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>{t("dashboard.col.customer")}</TableCell>
                    <TableCell>{t("dashboard.col.status")}</TableCell>
                    <TableCell align="right">{t("dashboard.col.amount")}</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {recentOrders.length ? (
                    recentOrders.map((order) => (
                      <TableRow
                        key={order.id}
                        hover
                        sx={{ cursor: "pointer" }}
                        component={RouterLink}
                        to={`/orders/${order.id}`}
                        style={{ textDecoration: "none" }}
                      >
                        <TableCell>{order.user?.name || t("dashboard.customerFallback")}</TableCell>
                        <TableCell>
                          <Chip size="small" label={orderStatusLabel(order.status)} variant="outlined" />
                        </TableCell>
                        <TableCell align="right" sx={{ color: "primary.main", fontWeight: 600 }}>
                          {formatCurrency(order.total, language, currency)}
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={3} align="center" sx={{ color: "text.secondary", py: 4 }}>
                        {t("dashboard.noRecentOrders")}
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          </Paper>
        </Grid>

        <Grid size={{ xs: 12, lg: 4 }}>
          <Paper variant="outlined" sx={{ p: 2, height: "100%", borderRadius: "8px" }}>
            <Stack direction="row" sx={{ justifyContent: "space-between", alignItems: "center", mb: 1.5 }}>
              <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
                {t("dashboard.latestRegistrations")}
              </Typography>
              <Button component={RouterLink} to="/users" size="small" sx={{ borderRadius: "8px" }}>
                {t("common.view", "View")}
              </Button>
            </Stack>
            <Stack spacing={1}>
              {recentUsers.length ? (
                recentUsers.map((user) => (
                  <Paper
                    key={user.id}
                    component={RouterLink}
                    to={`/users/${user.id}`}
                    variant="outlined"
                    sx={{
                      p: 1.5,
                      borderRadius: "8px",
                      textDecoration: "none",
                      color: "inherit",
                      "&:hover": { borderColor: "primary.main" },
                    }}
                  >
                    <Typography variant="body2" sx={{ fontWeight: 600 }}>
                      {user.name}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {userRoleLabel(user.role)} — {userStatusLabel(user.status)}
                    </Typography>
                  </Paper>
                ))
              ) : (
                <Typography variant="body2" color="text.secondary" sx={{ py: 4, textAlign: "center" }}>
                  {t("dashboard.noRegistrations")}
                </Typography>
              )}
            </Stack>
          </Paper>
        </Grid>

        <Grid size={{ xs: 12, lg: 4 }}>
          <Paper variant="outlined" sx={{ p: 2, height: "100%", borderRadius: "8px" }}>
            <Stack direction="row" sx={{ justifyContent: "space-between", alignItems: "center", mb: 1.5 }}>
              <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
                {t("dashboard.latestProducts")}
              </Typography>
              <Button component={RouterLink} to="/products" size="small" sx={{ borderRadius: "8px" }}>
                {t("common.view", "View")}
              </Button>
            </Stack>
            <Stack spacing={1}>
              {recentProducts.length ? (
                recentProducts.map((product) => (
                  <Paper
                    key={product.id}
                    component={RouterLink}
                    to={`/products/${product.id}`}
                    variant="outlined"
                    sx={{
                      p: 1.5,
                      borderRadius: "8px",
                      textDecoration: "none",
                      color: "inherit",
                      "&:hover": { borderColor: "primary.main" },
                    }}
                  >
                    <Typography variant="body2" sx={{ fontWeight: 600 }}>
                      {product.title}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {productStatusLabel(product.status)}
                      {product.company?.name ? ` · ${product.company.name}` : ""}
                    </Typography>
                  </Paper>
                ))
              ) : (
                <Typography variant="body2" color="text.secondary" sx={{ py: 4, textAlign: "center" }}>
                  {t("dashboard.noRecentProducts")}
                </Typography>
              )}
            </Stack>
          </Paper>
        </Grid>
      </Grid>

      <Paper variant="outlined" sx={{ p: 2, borderRadius: "8px" }}>
        <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 2 }}>
          {t("dashboard.quickActions")}
        </Typography>
        <Grid container spacing={1.5}>
          {quickActions.map((action) => (
            <Grid key={action.to} size={{ xs: 12, sm: 6, lg: 3 }}>
              <Button
                component={RouterLink}
                to={action.to}
                variant="outlined"
                fullWidth
                sx={{ borderRadius: "8px", justifyContent: "space-between", py: 1.25 }}
                endIcon={<ArrowForward fontSize="small" />}
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
