import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Layout from './components/Layout.jsx';
import ProtectedRoute from './components/ProtectedRoute.jsx';
import OverviewPage from './pages/OverviewPage.jsx';
import OrdersPage from './pages/OrdersPage.jsx';
import AddOrderPage from './pages/AddOrderPage.jsx';
import CustomersPage from './pages/CustomersPage.jsx';
import AddsPage from './pages/AddsPage.jsx';
import { FabricSalePage, MachinerySalePage } from './pages/SalesFormPages.jsx';
import SalesHistoryPage from './pages/SalesHistoryPage.jsx';
import StockPage from './pages/StockPage.jsx';
import DakhalPage from './pages/DakhalPage.jsx';
import ExpensesPage from './pages/ExpensesPage.jsx';
import SettingsPage from './pages/SettingsPage.jsx';
import LoginPage from './pages/LoginPage.jsx';
import { CustomerProvider } from './context/CustomerContext.jsx';
import { SalesCustomerProvider } from './context/SalesCustomerContext.jsx';
import { OrderProvider } from './context/OrderContext.jsx';
import { SaleProvider } from './context/SaleContext.jsx';
import { StockProvider } from './context/StockContext.jsx';
import { SettingsProvider } from './context/SettingsContext.jsx';
import { AuthProvider } from './context/AuthContext.jsx';
import { ThemeProvider } from './context/ThemeContext.jsx';

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <SettingsProvider>
          <StockProvider>
            <CustomerProvider>
              <SalesCustomerProvider>
                <OrderProvider>
                  <SaleProvider>
                    <BrowserRouter>
                      <Routes>
                        <Route path="/login" element={<LoginPage />} />
                        <Route element={<ProtectedRoute />}>
                          <Route element={<Layout />}>
                            <Route index element={<OverviewPage />} />
                            <Route path="orders" element={<OrdersPage />} />
                            <Route path="orders/new" element={<AddOrderPage />} />
                            <Route path="customers" element={<CustomersPage />} />
                            <Route path="adds" element={<AddsPage />} />
                            <Route path="sales/fabric" element={<FabricSalePage />} />
                            <Route path="sales/machinery" element={<MachinerySalePage />} />
                            <Route path="sales" element={<SalesHistoryPage />} />
                            <Route path="stock" element={<StockPage />} />
                            <Route path="dakhal" element={<DakhalPage />} />
                            <Route path="expenses" element={<ExpensesPage />} />
                            <Route path="settings" element={<SettingsPage />} />
                          </Route>
                        </Route>
                      </Routes>
                    </BrowserRouter>
                  </SaleProvider>
                </OrderProvider>
              </SalesCustomerProvider>
            </CustomerProvider>
          </StockProvider>
        </SettingsProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}
