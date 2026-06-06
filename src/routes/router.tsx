import { createBrowserRouter } from "react-router-dom";
import { DashboardLayout } from "../layouts/dashboard-layout";
import { DashboardPage } from "../modules/dashboard/dashboard-page";
import { UsersPage } from "../modules/users/users-page";
import { ProductManagementPage } from "../modules/products/product-management-page";
import { CompanyManagementPage } from "../modules/companies/company-management-page";
import { DynamicFormBuilderPage } from "../modules/dynamic-fields/dynamic-form-builder-page";
import { SystemSettingsPage } from "../modules/system-settings/system-settings-page";
import { RolesPermissionsPage } from "../modules/roles-permissions/roles-permissions-page";
import { AppearanceSettingsPage } from "../modules/appearance/appearance-settings-page";
import { OrdersPage } from "../modules/orders/orders-page";
import { CategoriesPage } from "../modules/categories/categories-page";
import { BannersPage } from "../modules/banners/banners-page";
import { NotificationsPage } from "../modules/notifications/notifications-page";
import { ConsultantsPage } from "../modules/consultants/consultants-page";
import { CropPricesPage } from "../modules/crop-prices/crop-prices-page";
import { MarketPage } from "../modules/market/market-page";
import { WeatherSettingsPage } from "../modules/weather/weather-settings-page";
import { AiSettingsPage } from "../modules/ai-settings/ai-settings-page";
import { PlaceholderPage } from "../pages/placeholder-page";
import { LoginPage } from "../modules/auth/login-page";
import { ForgotPasswordPage } from "../modules/auth/forgot-password-page";
import { ProtectedRoute } from "./protected-route";
import { CompanyProtectedRoute } from "./company-protected-route";
import { CompanyLayout } from "../layouts/company-layout";
import { CompanyApplicationsPage } from "../modules/companies/company-applications-page";
import { JoinRequestsPage } from "../modules/join-us/join-requests-page";
import { CompanyProductsPage } from "../modules/company-portal/company-products-page";

const placeholderRoutes = [
  { path: "order-tracking", title: "Order Tracking", description: "Track order states and shipment progress." },
  {
    path: "service-providers",
    title: "Service Providers",
    description: "Manage all service provider profiles and statuses.",
  },
  {
    path: "advertisements",
    title: "Advertisements",
    description: "Manage advertising campaigns and placements.",
  },
  { path: "coupons", title: "Coupons", description: "Manage discount coupons and usage limits." },
  { path: "reports", title: "Reports", description: "View analytics and downloadable reports." },
  { path: "activity-logs", title: "Activity Logs", description: "Audit admin and system activities." },
  { path: "admins", title: "Admins", description: "Manage admin users, access levels, and sessions." },
  {
    path: "content-management",
    title: "Content Management",
    description: "Manage static content, pages, and localized texts.",
  },
  { path: "faq", title: "FAQ", description: "Manage frequently asked questions and answers." },
  {
    path: "contact-requests",
    title: "Contact Requests",
    description: "View and process contact and support requests.",
  },
];

export const router = createBrowserRouter([
  {
    path: "/login",
    element: <LoginPage />,
  },
  {
    path: "/forgot-password",
    element: <ForgotPasswordPage />,
  },
  {
    element: <ProtectedRoute />,
    children: [
      {
        path: "/",
        element: <DashboardLayout />,
        children: [
          { index: true, element: <DashboardPage /> },
          { path: "users", element: <UsersPage /> },
          { path: "companies", element: <CompanyManagementPage /> },
          { path: "join-requests", element: <JoinRequestsPage /> },
          { path: "company-applications", element: <CompanyApplicationsPage /> },
          { path: "pending-products", element: <ProductManagementPage pendingOnly /> },
          { path: "products", element: <ProductManagementPage /> },
          { path: "orders", element: <OrdersPage /> },
          { path: "categories", element: <CategoriesPage /> },
          { path: "banners", element: <BannersPage /> },
          { path: "notifications", element: <NotificationsPage /> },
          { path: "consultants", element: <ConsultantsPage /> },
          { path: "crop-prices", element: <CropPricesPage /> },
          { path: "market", element: <MarketPage /> },
          { path: "weather-settings", element: <WeatherSettingsPage /> },
          { path: "ai-settings", element: <AiSettingsPage /> },
          { path: "dynamic-fields", element: <DynamicFormBuilderPage /> },
          { path: "system-settings", element: <SystemSettingsPage /> },
          { path: "roles-permissions", element: <RolesPermissionsPage /> },
          { path: "appearance-settings", element: <AppearanceSettingsPage /> },
          ...placeholderRoutes.map((route) => ({
            path: route.path,
            element: <PlaceholderPage title={route.title} description={route.description} />,
          })),
        ],
      },
    ],
  },
  {
    element: <CompanyProtectedRoute />,
    children: [
      {
        path: "/company",
        element: <CompanyLayout />,
        children: [{ path: "products", element: <CompanyProductsPage /> }],
      },
    ],
  },
]);
