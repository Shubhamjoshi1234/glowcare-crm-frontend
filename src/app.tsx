import { Route, Routes } from "react-router-dom";
import { Layout } from "./components/layout";
import { CampaignDetailPage } from "./pages/campaign-detail";
import { CampaignsPage } from "./pages/campaigns";
import { CustomersPage } from "./pages/customers";
import { DashboardPage } from "./pages/dashboard";
import { OrdersPage } from "./pages/orders";
import { SegmentsPage } from "./pages/segments";
import { AnalyticsPage } from "./pages/analytics";
import { NotFoundPage } from "./pages/not-found";

export function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route index element={<DashboardPage />} />
        <Route path="customers" element={<CustomersPage />} />
        <Route path="orders" element={<OrdersPage />} />
        <Route path="segments" element={<SegmentsPage />} />
        <Route path="analytics" element={<AnalyticsPage />} />
        <Route path="campaigns" element={<CampaignsPage />} />
        <Route path="campaigns/:id" element={<CampaignDetailPage />} />
        <Route path="*" element={<NotFoundPage />} />
      </Route>
    </Routes>
  );
}
