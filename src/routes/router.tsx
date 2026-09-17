import { createBrowserRouter } from "react-router-dom";
import { Navigate } from "react-router-dom";
import { DashboardLayout } from "../layouts/dashboard-layout";
import { DashboardPage } from "../modules/dashboard/dashboard-page";
import { UsersPage } from "../modules/users/users-page";
import { UserDetailPage } from "../modules/users/user-detail-page";
import { ProductManagementPage } from "../modules/products/product-management-page";
import { ProductCreatePage, ProductEditPage } from "../modules/products/product-form-page";
import { PendingProductDetailPage, ProductDetailPage } from "../modules/products/product-detail-page";
import { PendingProductsPage } from "../modules/products/pending-products-page";
import { CompanyManagementPage } from "../modules/companies/company-management-page";
import { CompanyDetailPage } from "../modules/companies/company-detail-page";
import { DynamicFormBuilderPage } from "../modules/dynamic-fields/dynamic-form-builder-page";
import { SystemSettingsPage } from "../modules/system-settings/system-settings-page";
import { RolesPermissionsPage } from "../modules/roles-permissions/roles-permissions-page";
import { AppearanceSettingsPage } from "../modules/appearance/appearance-settings-page";
import { OrdersPage } from "../modules/orders/orders-page";
import { OrderDetailPage } from "../modules/orders/order-detail-page";
import { CategoriesPage } from "../modules/categories/categories-page";
import { BannersPage } from "../modules/banners/banners-page";
import { BannerCreatePage } from "../modules/banners/banner-form-page";
import { OnboardingPage } from "../modules/onboarding/onboarding-page";
import { OnboardingCreatePage } from "../modules/onboarding/onboarding-form-page";
import { NotificationsPage } from "../modules/notifications/notifications-page";
import { FinancePage } from "../modules/finance/finance-page";
import { FinanceDetailPage } from "../modules/finance/finance-detail-page";
import { ConsultantsPage } from "../modules/consultants/consultants-page";
import { ConsultantDetailPage } from "../modules/consultants/consultant-detail-page";
import { CropPricesPage } from "../modules/crop-prices/crop-prices-page";
import { MarketPage } from "../modules/market/market-page";
import { WeatherSettingsPage } from "../modules/weather/weather-settings-page";
import { AiSettingsPage } from "../modules/ai-settings/ai-settings-page";
import { PlaceholderPage } from "../pages/placeholder-page";
import { LoginPage } from "../modules/auth/login-page";
import { NotFoundPage, RouteErrorPage } from "../pages/not-found-page";
import { ProtectedRoute } from "./protected-route";
import { CompanyProtectedRoute } from "./company-protected-route";
import { CompanyLayout } from "../layouts/company-layout";
import { JoinRequestsPage } from "../modules/join-us/join-requests-page";
import { JoinRequestDetailPage } from "../modules/join-us/join-request-detail-page";
import { CompanyProductsPage } from "../modules/company-portal/company-products-page";
import { CompanyDashboardPage } from "../modules/company-portal/company-dashboard-page";
import { CompanyProfilePage } from "../modules/company-portal/company-profile-page";
import { ContentManagementPage } from "../modules/content-management/content-management-page";
import { FaqCreatePage, FaqEditPage } from "../modules/content-management/faq-form-page";
import { TermCreatePage, TermEditPage } from "../modules/content-management/term-form-page";

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
    path: "contact-requests",
    title: "Contact Requests",
    description: "View and process contact and support requests.",
  },
];

export const router = createBrowserRouter([
  {
    path: "/login",
    element: <LoginPage />,
    errorElement: <RouteErrorPage />,
  },
  {
    path: "/forgot-password",
    element: <Navigate to="/login" replace />,
  },
  {
    element: <ProtectedRoute />,
    errorElement: <RouteErrorPage />,
    children: [
      {
        path: "/",
        element: <DashboardLayout />,
        errorElement: <RouteErrorPage />,
        children: [
          { index: true, element: <DashboardPage /> },
          { path: "users", element: <UsersPage /> },
          { path: "users/:id", element: <UserDetailPage /> },
          { path: "companies", element: <CompanyManagementPage /> },
          { path: "companies/:id", element: <CompanyDetailPage /> },
          { path: "join-requests", element: <JoinRequestsPage /> },
          { path: "join-requests/:id", element: <JoinRequestDetailPage /> },
          { path: "company-applications", element: <Navigate to="/companies" replace /> },
          { path: "pending-products", element: <PendingProductsPage /> },
          { path: "pending-products/:id", element: <PendingProductDetailPage /> },
          { path: "products", element: <ProductManagementPage /> },
          { path: "products/new", element: <ProductCreatePage /> },
          { path: "products/:id", element: <ProductDetailPage /> },
          { path: "products/:id/edit", element: <ProductEditPage /> },
          { path: "orders", element: <OrdersPage /> },
          { path: "orders/:id", element: <OrderDetailPage /> },
          { path: "finance", element: <FinancePage /> },
          { path: "finance/:companyId", element: <FinanceDetailPage /> },
          { path: "categories", element: <CategoriesPage /> },
          { path: "banners", element: <BannersPage /> },
          { path: "banners/new", element: <BannerCreatePage /> },
          { path: "onboarding", element: <OnboardingPage /> },
          { path: "onboarding/new", element: <OnboardingCreatePage /> },
          { path: "notifications", element: <NotificationsPage /> },
          { path: "content-management", element: <ContentManagementPage /> },
          { path: "content-management/terms/new", element: <TermCreatePage /> },
          { path: "content-management/terms/:id/edit", element: <TermEditPage /> },
          { path: "content-management/faq/new", element: <FaqCreatePage /> },
          { path: "content-management/faq/:id/edit", element: <FaqEditPage /> },
          { path: "faq", element: <ContentManagementPage /> },
          { path: "terms", element: <ContentManagementPage /> },
          { path: "privacy-policy", element: <ContentManagementPage /> },
          { path: "consultants", element: <ConsultantsPage /> },
          { path: "consultants/:id", element: <ConsultantDetailPage /> },
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
          { path: "*", element: <NotFoundPage /> },
        ],
      },
    ],
  },
  {
    element: <CompanyProtectedRoute />,
    errorElement: <RouteErrorPage />,
    children: [
      {
        path: "/company",
        element: <CompanyLayout />,
        children: [
          { index: true, element: <CompanyDashboardPage /> },
          { path: "products", element: <CompanyProductsPage /> },
          { path: "profile", element: <CompanyProfilePage /> },
          { path: "notifications", element: <NotificationsPage /> },
          { path: "*", element: <NotFoundPage /> },
        ],
      },
    ],
  },
  { path: "*", element: <NotFoundPage /> },
]);
