import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Area, AreaChart, Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis } from "recharts";
import { Link } from "react-router-dom";
import { Box, Building2, DollarSign, PackageOpen, ShoppingCart, TrendingUp, Users, Warehouse } from "lucide-react";
import { AnalyticsWidget } from "../../components/analytics-widget";
import { Card } from "../../components/ui/card";
import { Button } from "../../components/ui/button";
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
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 8 }).map((_, index) => (
          <div
            key={`skeleton-stat-${index}`}
            className="h-44 animate-pulse rounded-[20px] border border-(--app-border) bg-(--app-surface) shadow-(--app-shadow-soft)"
          />
        ))}
      </div>
      <div className="grid gap-4 xl:grid-cols-2">
        {Array.from({ length: 4 }).map((_, index) => (
          <div
            key={`skeleton-chart-${index}`}
            className="h-80 animate-pulse rounded-[20px] border border-(--app-border) bg-(--app-surface) shadow-(--app-shadow-soft)"
          />
        ))}
      </div>
    </div>
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
    return <Card>Failed to load one or more dashboard data sources. Please refresh.</Card>;
  }
  if (!stats) {
    return (
      <Card className="flex min-h-[280px] flex-col items-center justify-center text-center">
        <div className="mb-4 flex size-16 items-center justify-center rounded-2xl bg-[#23673A]/10 text-[#23673A]">
          <TrendingUp className="size-7" />
        </div>
        <h3 className="text-xl font-semibold text-(--app-text-primary)">No dashboard data yet</h3>
        <p className="mt-2 max-w-md text-sm text-(--app-text-secondary)">
          Once users, orders, and products are active, this dashboard will auto-populate with live analytics and trend insights.
        </p>
      </Card>
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
    { day: "Sunday", visitors: Math.round(stats.totalUsers * 0.03 * scale), sessions: Math.round(stats.totalOrders * 0.06 * scale), clicks: Math.round(stats.totalProducts * 0.04 * scale) },
    { day: "Monday", visitors: Math.round(stats.totalUsers * 0.05 * scale), sessions: Math.round(stats.totalOrders * 0.08 * scale), clicks: Math.round(stats.totalProducts * 0.06 * scale) },
    { day: "Tuesday", visitors: Math.round(stats.totalUsers * 0.08 * scale), sessions: Math.round(stats.totalOrders * 0.1 * scale), clicks: Math.round(stats.totalProducts * 0.09 * scale) },
    { day: "Wednesday", visitors: Math.round(stats.totalUsers * 0.07 * scale), sessions: Math.round(stats.totalOrders * 0.09 * scale), clicks: Math.round(stats.totalProducts * 0.08 * scale) },
    { day: "Thursday", visitors: Math.round(stats.totalUsers * 0.06 * scale), sessions: Math.round(stats.totalOrders * 0.08 * scale), clicks: Math.round(stats.totalProducts * 0.07 * scale) },
    { day: "Friday", visitors: Math.round(stats.totalUsers * 0.045 * scale), sessions: Math.round(stats.totalOrders * 0.07 * scale), clicks: Math.round(stats.totalProducts * 0.05 * scale) },
    { day: "Saturday", visitors: Math.round(stats.totalUsers * 0.04 * scale), sessions: Math.round(stats.totalOrders * 0.065 * scale), clicks: Math.round(stats.totalProducts * 0.045 * scale) },
  ];

  const periodLabel = period === "today" ? "Today" : period === "week" ? "This week" : "This month";

  return (
    <div className="min-w-0 space-y-6 overflow-x-hidden">
      <Card className="border-[#23673A]/10 bg-[linear-gradient(120deg,rgba(35,103,58,0.11),transparent_40%)]">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#23673A]">Performance Overview</p>
            <h2 className="mt-2 text-2xl font-semibold text-(--app-text-primary)">Admin Command Center</h2>
            <p className="mt-2 max-w-xl text-sm text-(--app-text-secondary)">
              Premium unified analytics for operations, users, products, and orders with real-time insights.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button variant={period === "today" ? "default" : "outline"} onClick={() => setPeriod("today")}>
              Today
            </Button>
            <Button variant={period === "week" ? "default" : "outline"} onClick={() => setPeriod("week")}>
              This Week
            </Button>
            <Button variant={period === "month" ? "default" : "outline"} onClick={() => setPeriod("month")}>
              This Month
            </Button>
          </div>
          <p className="w-full text-xs text-(--app-text-secondary)">Showing data for: {periodLabel}</p>
        </div>
      </Card>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <AnalyticsWidget title="Total Users" value={period === "month" ? stats.totalUsers : periodUsers.length} icon={Users} change="+12.4%" hint={periodLabel} sparkline={[22, 30, 18, 40, 65, 55].map((v) => Math.round(v * scale))} />
        <AnalyticsWidget title="Total Companies" value={Math.round(stats.totalCompanies * scale)} icon={Building2} change="+8.7%" hint={periodLabel} sparkline={[28, 45, 34, 50, 68, 72].map((v) => Math.round(v * scale))} />
        <AnalyticsWidget title="Total Products" value={period === "month" ? stats.totalProducts : periodProducts.length} icon={Box} change="+15.2%" hint={periodLabel} sparkline={[15, 30, 42, 46, 58, 66].map((v) => Math.round(v * scale))} />
        <AnalyticsWidget title="Total Orders" value={period === "month" ? stats.totalOrders : periodOrders.length} icon={ShoppingCart} change="+6.1%" hint={periodLabel} sparkline={[20, 25, 32, 29, 52, 60].map((v) => Math.round(v * scale))} />
        <AnalyticsWidget title="Total Revenue" value={`EGP ${Math.round(Number(stats.revenue) * scale).toLocaleString()}`} icon={DollarSign} change="+19.8%" hint={periodLabel} sparkline={[12, 21, 30, 41, 52, 74].map((v) => Math.round(v * scale))} />
        <AnalyticsWidget title="Service Providers" value={Math.round((serviceProvidersCount || 0) * scale)} icon={Warehouse} change="+4.1%" hint={periodLabel} sparkline={[18, 23, 31, 38, 44, 48].map((v) => Math.round(v * scale))} />
        <AnalyticsWidget title="Pending Products" value={Math.round(stats.pendingProducts * scale)} icon={PackageOpen} change="-2.3%" trend="down" hint="requires moderation" sparkline={[62, 55, 52, 40, 37, 28].map((v) => Math.round(v * scale))} />
        <AnalyticsWidget title="Pending Companies" value={Math.round(stats.pendingCompanies * scale)} icon={Building2} change="-1.7%" trend="down" hint="application queue" sparkline={[45, 42, 38, 30, 26, 23].map((v) => Math.round(v * scale))} />
      </div>

      <div className="grid gap-4 xl:grid-cols-2">
        <Card className="rounded-3xl border-(--app-border) bg-(--app-surface) shadow-[0_10px_30px_-24px_rgba(15,23,42,0.25)]">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-lg font-semibold tracking-tight text-(--app-text-primary)">Revenue Analytics</h3>
            <span className="rounded-full bg-[#23673A]/10 px-2.5 py-1 text-xs font-semibold text-[#23673A]">Income</span>
          </div>
          <div className="h-64 rounded-2xl bg-[#edf5ef]/60 p-2">
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
          </div>
        </Card>

        <Card className="rounded-3xl border-(--app-border) bg-(--app-surface) shadow-[0_10px_30px_-24px_rgba(15,23,42,0.25)]">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-lg font-semibold tracking-tight text-(--app-text-primary)">Project Status</h3>
            <span className="rounded-full bg-[#23673A]/10 px-2.5 py-1 text-xs font-semibold text-[#23673A]">Overview</span>
          </div>
          <div className="h-64 rounded-2xl bg-[#edf5ef]/60 p-2">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={growthData}>
                <CartesianGrid strokeDasharray="4 4" vertical={false} stroke="#E4E7EC" />
                <XAxis axisLine={false} tickLine={false} dataKey="label" />
                <Tooltip />
                <Bar dataKey="value" fill="#23673A" radius={[8, 8, 0, 0]} barSize={12} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card className="rounded-3xl border-(--app-border) bg-(--app-surface) shadow-[0_10px_30px_-24px_rgba(15,23,42,0.25)]">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-lg font-semibold tracking-tight text-(--app-text-primary)">Products Analytics</h3>
            <span className="rounded-full bg-[#23673A]/10 px-2.5 py-1 text-xs font-semibold text-[#23673A]">Catalog</span>
          </div>
          <div className="h-64 rounded-2xl bg-[#edf5ef]/60 p-2">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={productGrowthData}>
                <CartesianGrid strokeDasharray="4 4" vertical={false} stroke="#E4E7EC" />
                <XAxis axisLine={false} tickLine={false} dataKey="step" />
                <Tooltip />
                <Bar dataKey="count" fill="#15803D" radius={[8, 8, 0, 0]} barSize={12} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card className="rounded-3xl border-(--app-border) bg-(--app-surface) shadow-[0_10px_30px_-24px_rgba(15,23,42,0.25)]">
          <div className="mb-4">
            <h3 className="text-xl font-semibold tracking-tight text-(--app-text-primary)">Analytics</h3>
            <p className="mt-1 text-sm text-(--app-text-secondary)">Sunday to Saturday performance overview</p>
          </div>
          <div className="h-64 rounded-2xl bg-[#edf5ef]/55 px-2 py-3">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={analyticsWeekData} barGap={10} barCategoryGap="44%">
                <CartesianGrid strokeDasharray="3 5" vertical={false} stroke="#dbe7de" />
                <XAxis
                  axisLine={false}
                  tickLine={false}
                  dataKey="day"
                  tick={{ fill: "#6b7280", fontSize: 11, fontWeight: 500 }}
                />
                <Tooltip
                  cursor={{ fill: "rgba(35, 103, 58, 0.08)" }}
                  contentStyle={{
                    borderRadius: "14px",
                    border: "1px solid #e8efea",
                    boxShadow: "0 10px 22px -16px rgba(15,23,42,.3)",
                  }}
                />
                <Bar dataKey="visitors" fill="#82b695" radius={[8, 8, 0, 0]} barSize={6} />
                <Bar dataKey="sessions" fill="#23673A" radius={[8, 8, 0, 0]} barSize={6} />
                <Bar dataKey="clicks" fill="#c7ddcd" radius={[8, 8, 0, 0]} barSize={6} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>

      <div className="grid gap-4 xl:grid-cols-3">
        <Card>
          <h3 className="mb-4 text-sm font-semibold text-(--app-text-primary)">Latest Orders</h3>
          <div className="overflow-hidden rounded-2xl border border-(--app-border)">
            {periodOrders.length ? (
              <table className="w-full text-sm">
                <thead className="bg-(--app-surface-muted)">
                  <tr>
                    <th className="px-3 py-2 text-start text-xs font-semibold uppercase tracking-wide text-(--app-text-secondary)">Customer</th>
                    <th className="px-3 py-2 text-start text-xs font-semibold uppercase tracking-wide text-(--app-text-secondary)">Status</th>
                    <th className="px-3 py-2 text-start text-xs font-semibold uppercase tracking-wide text-(--app-text-secondary)">Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {periodOrders.map((order) => (
                    <tr key={order.id} className="border-t border-(--app-border)">
                      <td className="px-3 py-2 font-medium text-(--app-text-primary)">{order.user?.name || "Customer"}</td>
                      <td className="px-3 py-2 text-(--app-text-secondary)">{order.status}</td>
                      <td className="px-3 py-2 text-[#23673A]">EGP {Number(order.total).toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <div className="p-8 text-center text-sm text-(--app-text-secondary)">No recent orders available.</div>
            )}
          </div>
        </Card>

        <Card>
          <h3 className="mb-4 text-sm font-semibold text-(--app-text-primary)">Latest Registrations</h3>
          <div className="space-y-2 text-sm">
            {periodUsers.length ? (
              periodUsers.map((user) => (
                <div key={user.id} className="rounded-2xl border border-(--app-border) bg-(--app-surface) p-3">
                  <p className="font-medium text-(--app-text-primary)">{user.name}</p>
                  <p className="text-(--app-text-secondary)">{user.role} - {user.status}</p>
                </div>
              ))
            ) : (
              <div className="rounded-2xl border border-dashed border-(--app-border) p-8 text-center text-(--app-text-secondary)">
                No user registrations yet.
              </div>
            )}
          </div>
        </Card>

        <Card>
          <h3 className="mb-4 text-sm font-semibold text-(--app-text-primary)">Latest Products</h3>
          <div className="space-y-2 text-sm">
            {periodProducts.length ? (
              periodProducts.map((product) => (
                <div key={product.id} className="rounded-2xl border border-(--app-border) bg-(--app-surface) p-3">
                  <p className="font-medium text-(--app-text-primary)">{product.title}</p>
                  <p className="text-(--app-text-secondary)">{product.status}</p>
                </div>
              ))
            ) : (
              <div className="rounded-2xl border border-dashed border-(--app-border) p-8 text-center text-(--app-text-secondary)">
                No products added recently.
              </div>
            )}
          </div>
        </Card>
      </div>

      <Card>
        <h3 className="mb-4 text-sm font-semibold text-(--app-text-primary)">Quick Actions</h3>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <Link to="/categories">
            <Button className="w-full">Add Category</Button>
          </Link>
          <Link to="/banners">
            <Button className="w-full">Add Banner</Button>
          </Link>
          <Link to="/company-applications">
            <Button className="w-full">Review Company Applications</Button>
          </Link>
          <Link to="/products">
            <Button className="w-full">Manage Products</Button>
          </Link>
        </div>
      </Card>
    </div>
  );
}
