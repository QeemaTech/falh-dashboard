/** Minimum permission required to open a dashboard route. */
export const ROUTE_PERMISSIONS: Record<string, string> = {
  "/": "dashboard.view",
  "/users": "users.view",
  "/companies": "companies.view",
  "/join-requests": "companies.view",
  "/products": "products.view",
  "/pending-products": "products.view",
  "/categories": "categories.view",
  "/orders": "orders.view",
  "/finance": "finance.view",
  "/banners": "banners.view",
  "/notifications": "notifications.view",
  "/consultants": "consultants.view",
  "/ai-settings": "settings.view",
  "/market": "settings.view",
  "/crop-prices": "settings.view",
  "/weather-settings": "settings.view",
  "/dynamic-fields": "categories.view",
  "/system-settings": "settings.view",
  "/roles-permissions": "roles.view",
  "/appearance-settings": "settings.view",
  "/reports": "reports.view",
};

export function permissionForPath(pathname: string) {
  if (ROUTE_PERMISSIONS[pathname]) return ROUTE_PERMISSIONS[pathname];
  const match = Object.keys(ROUTE_PERMISSIONS)
    .filter((route) => route !== "/")
    .sort((a, b) => b.length - a.length)
    .find((route) => pathname.startsWith(route));
  return match ? ROUTE_PERMISSIONS[match] : null;
}
