import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import DashboardLayout from "../layouts/DashboardLayout";
import Dashboard from "../pages/dashboard/index";
import InventoryPage from "../pages/inventory/InventoryPage";
import AdminDashboard from "../pages/admin/AdminDashboard";
import ProtectedRoute from "../components/ProtectedRoute";
import LoginPage from "../pages/auth/LoginPage";
import RegisterPage from "../pages/auth/RegisterPage";
import Reports from "../pages/reports/Reports";
import UsersPage from '../pages/user/UsersPage';
import WorldPage from "../pages/world/WorldPage";
import Security from "../pages/security/Security.jsx";
import AllTasksPage from "../pages/user/AllTasksPage.jsx";
import FuelProductionPage from "../pages/operations/FuelProductionPage.jsx";
import FuelForecastPage from "../pages/operations/FuelForecastPage.jsx";
import RevenueAnalysisPage from "../pages/financials/RevenueAnalysisPage.jsx";
import CapexAnalysisPage from "../pages/financials/CapexAnalysisPage.jsx";
import FuelProfitabilityPage from "../pages/financials/FuelProfitabilityPage.jsx";
import ThemeManager from "../pages/admin/ThemeManager.jsx";

const AppRoutes = () => {
    return (
        <Router>
            <Routes>
                {/* Rute BEZ sidebar-a i navbar-a */}
                <Route path="/" element={<LoginPage />} />
                <Route path="/login" element={<LoginPage />} />
                <Route path="/register" element={<RegisterPage />} />

                {/* Rute unutar DashboardLayout-a */}
                <Route
                    path="/*"
                    element={
                        <DashboardLayout>
                            <Routes>
                                <Route path="/dashboard" element={<Dashboard />} />
                                <Route path="/inventory" element={<ProtectedRoute><InventoryPage /></ProtectedRoute>} />
                                <Route path="/admin-dashboard" element={<ProtectedRoute checkRole="admin"><AdminDashboard /></ProtectedRoute>} />
                                <Route path="/reports" element={<ProtectedRoute><Reports /></ProtectedRoute>} />
                                <Route path="/users" element={<ProtectedRoute><UsersPage /></ProtectedRoute>} />
                                <Route path="/world" element={<ProtectedRoute> <WorldPage /></ProtectedRoute>} />
                                <Route path="/security" element={<ProtectedRoute> <Security /></ProtectedRoute>} />
                                <Route path="/tasks" element={<ProtectedRoute> <AllTasksPage /></ProtectedRoute>} />

                                {/* Operations */}
                                <Route path="/gas-stations" element={<ProtectedRoute><WorldPage /></ProtectedRoute>} />
                                <Route path="/stations-map" element={<ProtectedRoute><WorldPage /></ProtectedRoute>} />
                                <Route path="/fuel-production" element={<ProtectedRoute><FuelProductionPage /></ProtectedRoute>} />
                                <Route path="/fuel-forecast" element={<ProtectedRoute><FuelForecastPage /></ProtectedRoute>} />

                                {/* Financials */}
                                <Route path="/revenue-analysis" element={<ProtectedRoute><RevenueAnalysisPage /></ProtectedRoute>} />
                                <Route path="/capex-analysis" element={<ProtectedRoute><CapexAnalysisPage /></ProtectedRoute>} />
                                <Route path="/fuel-profitability" element={<ProtectedRoute><FuelProfitabilityPage /></ProtectedRoute>} />

                                {/* Security Routes */}
                                <Route path="/security/logs" element={<ProtectedRoute><Security /></ProtectedRoute>} />
                                <Route path="/security/blocked-ips" element={<ProtectedRoute><Security /></ProtectedRoute>} />
                                <Route path="/security/locked-users" element={<ProtectedRoute><Security /></ProtectedRoute>} />

                                {/* Admin Tools */}
                                <Route path="/admin/themes" element={<ProtectedRoute checkRole="admin"><ThemeManager /></ProtectedRoute>} />
                            </Routes>
                        </DashboardLayout>
                    }
                />
            </Routes>
        </Router>
    );
};

export default AppRoutes;
