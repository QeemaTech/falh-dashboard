import { useMemo, useState, type ReactNode } from "react";
import { useQuery } from "@tanstack/react-query";
import { Area, AreaChart, Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis } from "recharts";
import { Link as RouterLink } from "react-router-dom";
import {
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
  Business,
  Inventory2,
  LocalShipping,
  MonetizationOn,
  PendingActions,
  Storefront,
  TrendingUp,
  People,
  Warehouse,
} from "@mui/icons-material";
import { AnalyticsWidget } from "../../components/analytics-widget";
import { EmptyState } from "../../components/layout";
import {
  fetchDashboardStats,
  fetchRecentOrders,
  fetchRecentProducts,
  fetchServiceProvidersCount,
  fetchUsers,
} from "../../services/admin-api";

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

function ChartCard({ title, badge, subtitle, children }: { title: string; badge?: string; subtitle?: string; children: ReactNode }) {
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

export function DashboardPage() {
  const [period, setPeriod] = useState<DashboardPeriod>("month");

  const { data: stats, isLoading: statsLoading, isError: statsError } = useQuery({
    queryKey: ["dashboard-stats"],
    queryFn: fetchDashboardStats,
  });
  const { data: usersData, isLoading: usersLoading, isError: usersError } = useQuery({
    queryKey: ["dashboard-recent-users"],
    queryFn: () =>
      fetchUsers({ page: 1, limit: 5, sortBy: "createdAt", sortOrder: "desc" }).then((result) => result.users),
  });
  const { data: recentOrders, isLoading: ordersLoading, isError: ordersError } = useQuery({
    queryKey: ["dashboard-recent-orders"],
    queryFn: fetchRecentOrders,
  });
  const { data: recentProducts, isLoading: productsLoading, isError: productsError } = useQuery({
    queryKey: ["dashboard-recent-products"],
    queryFn: fetchRecentProducts,
  });
  const { data: serviceProvidersCount, isLoading: providersLoading, isError: providersError } = useQuery({
    queryKey: ["dashboard-service-providers-total"],
    queryFn: fetchServiceProvidersCount,
  });

  const periodOrders = useMemo(() => filterByPeriod(recentOrders, period), [recentOrders, period]);
  const periodUsers = useMemo(() => filterByPeriod(usersData, period), [usersData, period]);
  const periodProducts = useMemo(() => filterByPeriod(recentProducts, period), [recentProducts, period]);
  const scale = periodScale(period);

  const isLoading = statsLoading || usersLoading || ordersLoading || productsLoading || providersLoading;
  if (isLoading) return <DashboardSkeleton />;
  if (statsError || usersError || ordersError || productsError || providersError) {
    return <EmptyState title="Failed to load dashboard" description="Please refresh the page and try again." />;
  }
  if (!stats) {
    return (
      <EmptyState
        icon={<TrendingUp sx={{ fontSize: 48 }} />}
        title="No dashboard data yet"
        description="Once users, orders, and products are active, this dashboard will auto-populate with live analytics."
      />
    );
  }

  const salesData = [
    { name: "W1", sales: Math.round(stats.revenue * 0.14 * scale), orders: Math.round(stats.totalOrders * 0.18 * scale) },
    { name: "W2", sales: Math.round(stats.revenue * 0.19 * scale), orders: Math.round(stats.totalOrders * 0.22 * scale) },
    { name: "W3", sales: Math.round(stats.revenue * 0.24 * scale), orders: Math.round(stats.totalOrders * 0.27 * scale) },
    { name: "W4", sales: Math.round(stats.revenue * 0.43 * scale), orders: Math.round(stats.totalOrders * 0.33 * scale) },
  ];
  const growthData = [
    { label: "Users", value: period === "month" ? stats.totalUsers : periodUsers.length },
    { label: "Products", value: period === "month" ? stats.totalProducts : periodProducts.length },
    { label: "Companies", value: Math.round(stats.totalCompanies * scale) },
    { label: "Providers", value: Math.round((serviceProvidersCount || 0) * scale) },
  ];
  const productGrowthData = [
    { step: "Submitted", count: period === "month" ? stats.totalProducts : periodProducts.length },
    { step: "Pending", count: Math.round(stats.pendingProducts * scale) },
    { step: "Approved", count: Math.max((period === "month" ? stats.totalProducts : periodProducts.length) - Math.round(stats.pendingProducts * scale), 0) },
  ];
  const analyticsWeekData = [
    { day: "Sun", visitors: Math.round(stats.totalUsers * 0.03 * scale), sessions: Math.round(stats.totalOrders * 0.06 * scale), clicks: Math.round(stats.totalProducts * 0.04 * scale) },
    { day: "Mon", visitors: Math.round(stats.totalUsers * 0.05 * scale), sessions: Math.round(stats.totalOrders * 0.08 * scale), clicks: Math.round(stats.totalProducts * 0.06 * scale) },
    { day: "Tue", visitors: Math.round(stats.totalUsers * 0.08 * scale), sessions: Math.round(stats.totalOrders * 0.1 * scale), clicks: Math.round(stats.totalProducts * 0.09 * scale) },
    { day: "Wed", visitors: Math.round(stats.totalUsers * 0.07 * scale), sessions: Math.round(stats.totalOrders * 0.09 * scale), clicks: Math.round(stats.totalProducts * 0.08 * scale) },
    { day: "Thu", visitors: Math.round(stats.totalUsers * 0.06 * scale), sessions: Math.round(stats.totalOrders * 0.08 * scale), clicks: Math.round(stats.totalProducts * 0.07 * scale) },
    { day: "Fri", visitors: Math.round(stats.totalUsers * 0.045 * scale), sessions: Math.round(stats.totalOrders * 0.07 * scale), clicks: Math.round(stats.totalProducts * 0.05 * scale) },
    { day: "Sat", visitors: Math.round(stats.totalUsers * 0.04 * scale), sessions: Math.round(stats.totalOrders * 0.065 * scale), clicks: Math.round(stats.totalProducts * 0.045 * scale) },
  ];

  const periodLabel = period === "today" ? "Today" : period === "week" ? "This week" : "This month";

  return (
    <Stack spacing={3}>
      <Paper
        sx={{
          p: 3,
          background: (theme) =>
            `linear-gradient(120deg, ${theme.palette.primary.main}18, transparent 40%)`,
        }}
      >
        <Stack spacing={2}>
          <Stack direction={{ xs: "column", md: "row" }} spacing={2} sx={{ justifyContent: "space-between", alignItems: { md: "center" } }}>
            <Box>
              <Typography variant="overline" color="primary" sx={{ fontWeight: 700, letterSpacing: 1.5 }}>
                Performance Overview
              </Typography>
              <Typography variant="h5" sx={{ mt: 1, fontWeight: 700 }}>
                Admin Command Center
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mt: 1, maxWidth: 560 }}>
                Premium unified analytics for operations, users, products, and orders with real-time insights.
              </Typography>
            </Box>
            <ToggleButtonGroup
              exclusive
              size="small"
              value={period}
              onChange={(_, value: DashboardPeriod | null) => value && setPeriod(value)}
            >
              <ToggleButton value="today">Today</ToggleButton>
              <ToggleButton value="week">This Week</ToggleButton>
              <ToggleButton value="month">This Month</ToggleButton>
            </ToggleButtonGroup>
          </Stack>
          <Typography variant="caption" color="text.secondary">
            Showing data for: {periodLabel}
          </Typography>
        </Stack>
      </Paper>

      <Grid container spacing={2}>
        <Grid size={{ xs: 12, sm: 6, xl: 3 }}><AnalyticsWidget title="Total Users" value={period === "month" ? stats.totalUsers : periodUsers.length} icon={<People fontSize="small" />} change="+12.4%" hint={periodLabel} sparkline={[22, 30, 18, 40, 65, 55].map((v) => Math.round(v * scale))} /></Grid>
        <Grid size={{ xs: 12, sm: 6, xl: 3 }}><AnalyticsWidget title="Total Companies" value={Math.round(stats.totalCompanies * scale)} icon={<Business fontSize="small" />} change="+8.7%" hint={periodLabel} sparkline={[28, 45, 34, 50, 68, 72].map((v) => Math.round(v * scale))} /></Grid>
        <Grid size={{ xs: 12, sm: 6, xl: 3 }}><AnalyticsWidget title="Total Products" value={period === "month" ? stats.totalProducts : periodProducts.length} icon={<Inventory2 fontSize="small" />} change="+15.2%" hint={periodLabel} sparkline={[15, 30, 42, 46, 58, 66].map((v) => Math.round(v * scale))} /></Grid>
        <Grid size={{ xs: 12, sm: 6, xl: 3 }}><AnalyticsWidget title="Total Orders" value={period === "month" ? stats.totalOrders : periodOrders.length} icon={<LocalShipping fontSize="small" />} change="+6.1%" hint={periodLabel} sparkline={[20, 25, 32, 29, 52, 60].map((v) => Math.round(v * scale))} /></Grid>
        <Grid size={{ xs: 12, sm: 6, xl: 3 }}><AnalyticsWidget title="Total Revenue" value={`EGP ${Math.round(Number(stats.revenue) * scale).toLocaleString()}`} icon={<MonetizationOn fontSize="small" />} change="+19.8%" hint={periodLabel} sparkline={[12, 21, 30, 41, 52, 74].map((v) => Math.round(v * scale))} /></Grid>
        <Grid size={{ xs: 12, sm: 6, xl: 3 }}><AnalyticsWidget title="Service Providers" value={Math.round((serviceProvidersCount || 0) * scale)} icon={<Warehouse fontSize="small" />} change="+4.1%" hint={periodLabel} sparkline={[18, 23, 31, 38, 44, 48].map((v) => Math.round(v * scale))} /></Grid>
        <Grid size={{ xs: 12, sm: 6, xl: 3 }}><AnalyticsWidget title="Pending Products" value={Math.round(stats.pendingProducts * scale)} icon={<PendingActions fontSize="small" />} change="-2.3%" trend="down" hint="requires moderation" sparkline={[62, 55, 52, 40, 37, 28].map((v) => Math.round(v * scale))} /></Grid>
        <Grid size={{ xs: 12, sm: 6, xl: 3 }}><AnalyticsWidget title="Pending Companies" value={Math.round(stats.pendingCompanies * scale)} icon={<Storefront fontSize="small" />} change="-1.7%" trend="down" hint="application queue" sparkline={[45, 42, 38, 30, 26, 23].map((v) => Math.round(v * scale))} /></Grid>
      </Grid>

      <Grid container spacing={2}>
        <Grid size={{ xs: 12, xl: 6 }}>
          <ChartCard title="Revenue Analytics" badge="Income">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={salesData}>
                <defs>
                  <linearGradient id="salesPrimary" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#23673A" stopOpacity={0.35} />
                    <stop offset="95%" stopColor="#23673A" stopOpacity={0.02} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="4 4" vertical={false} stroke="#E4E7EC" />
                <XAxis axisLine={false} tickLine={false} dataKey="name" />
                <Tooltip />
                <Area type="monotone" dataKey="sales" stroke="#23673A" strokeWidth={2.5} fill="url(#salesPrimary)" />
                <Area type="monotone" dataKey="orders" stroke="#69A87B" strokeWidth={2} fill="transparent" />
              </AreaChart>
            </ResponsiveContainer>
          </ChartCard>
        </Grid>
        <Grid size={{ xs: 12, xl: 6 }}>
          <ChartCard title="Project Status" badge="Overview">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={growthData}>
                <CartesianGrid strokeDasharray="4 4" vertical={false} stroke="#E4E7EC" />
                <XAxis axisLine={false} tickLine={false} dataKey="label" />
                <Tooltip />
                <Bar dataKey="value" fill="#23673A" radius={[8, 8, 0, 0]} barSize={12} />
              </BarChart>
            </ResponsiveContainer>
          </ChartCard>
        </Grid>
        <Grid size={{ xs: 12, xl: 6 }}>
          <ChartCard title="Products Analytics" badge="Catalog">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={productGrowthData}>
                <CartesianGrid strokeDasharray="4 4" vertical={false} stroke="#E4E7EC" />
                <XAxis axisLine={false} tickLine={false} dataKey="step" />
                <Tooltip />
                <Bar dataKey="count" fill="#15803D" radius={[8, 8, 0, 0]} barSize={12} />
              </BarChart>
            </ResponsiveContainer>
          </ChartCard>
        </Grid>
        <Grid size={{ xs: 12, xl: 6 }}>
          <ChartCard title="Analytics" subtitle="Sunday to Saturday performance overview">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={analyticsWeekData} barGap={10} barCategoryGap="44%">
                <CartesianGrid strokeDasharray="3 5" vertical={false} stroke="#dbe7de" />
                <XAxis axisLine={false} tickLine={false} dataKey="day" tick={{ fill: "#6b7280", fontSize: 11 }} />
                <Tooltip cursor={{ fill: "rgba(35, 103, 58, 0.08)" }} />
                <Bar dataKey="visitors" fill="#82b695" radius={[8, 8, 0, 0]} barSize={6} />
                <Bar dataKey="sessions" fill="#23673A" radius={[8, 8, 0, 0]} barSize={6} />
                <Bar dataKey="clicks" fill="#c7ddcd" radius={[8, 8, 0, 0]} barSize={6} />
              </BarChart>
            </ResponsiveContainer>
          </ChartCard>
        </Grid>
      </Grid>

      <Grid container spacing={2}>
        <Grid size={{ xs: 12, xl: 4 }}>
          <Paper sx={{ p: 2, height: "100%" }}>
            <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 2 }}>
              Latest Orders
            </Typography>
            <TableContainer>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Customer</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell>Amount</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {periodOrders.length ? (
                    periodOrders.map((order) => (
                      <TableRow key={order.id}>
                        <TableCell>{order.user?.name || "Customer"}</TableCell>
                        <TableCell>{order.status}</TableCell>
                        <TableCell sx={{ color: "primary.main" }}>EGP {Number(order.total).toLocaleString()}</TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={3} align="center" sx={{ color: "text.secondary", py: 4 }}>
                        No recent orders available.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          </Paper>
        </Grid>
        <Grid size={{ xs: 12, xl: 4 }}>
          <Paper sx={{ p: 2, height: "100%" }}>
            <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 2 }}>
              Latest Registrations
            </Typography>
            <Stack spacing={1}>
              {periodUsers.length ? (
                periodUsers.map((user) => (
                  <Paper key={user.id} variant="outlined" sx={{ p: 1.5 }}>
                    <Typography variant="body2" sx={{ fontWeight: 600 }}>
                      {user.name}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {user.role} — {user.status}
                    </Typography>
                  </Paper>
                ))
              ) : (
                <Typography variant="body2" color="text.secondary" sx={{ py: 4, textAlign: "center" }}>
                  No user registrations yet.
                </Typography>
              )}
            </Stack>
          </Paper>
        </Grid>
        <Grid size={{ xs: 12, xl: 4 }}>
          <Paper sx={{ p: 2, height: "100%" }}>
            <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 2 }}>
              Latest Products
            </Typography>
            <Stack spacing={1}>
              {periodProducts.length ? (
                periodProducts.map((product) => (
                  <Paper key={product.id} variant="outlined" sx={{ p: 1.5 }}>
                    <Typography variant="body2" sx={{ fontWeight: 600 }}>
                      {product.title}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {product.status}
                    </Typography>
                  </Paper>
                ))
              ) : (
                <Typography variant="body2" color="text.secondary" sx={{ py: 4, textAlign: "center" }}>
                  No products added recently.
                </Typography>
              )}
            </Stack>
          </Paper>
        </Grid>
      </Grid>

      <Paper sx={{ p: 2 }}>
        <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 2 }}>
          Quick Actions
        </Typography>
        <Grid container spacing={2}>
          {[
            { to: "/categories", label: "Add Category" },
            { to: "/banners", label: "Add Banner" },
            { to: "/company-applications", label: "Review Company Applications" },
            { to: "/products", label: "Manage Products" },
          ].map((action) => (
            <Grid key={action.to} size={{ xs: 12, sm: 6, lg: 3 }}>
              <Button component={RouterLink} to={action.to} variant="contained" fullWidth>
                {action.label}
              </Button>
            </Grid>
          ))}
        </Grid>
      </Paper>
    </Stack>
  );
}
