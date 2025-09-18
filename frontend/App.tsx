import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { Toaster } from "@/components/ui/toaster";
import { AuthProvider } from "./contexts/AuthContext";
import { ProtectedRoute } from "./components/ProtectedRoute";
import { Login } from "./pages/Login";
import { Dashboard } from "./pages/Dashboard";
import { CustomerList } from "./pages/CustomerList";
import { CustomerDetail } from "./pages/CustomerDetail";
import { EmployeeList } from "./pages/EmployeeList";
import { MasterDataManagement } from "./pages/MasterDataManagement";
import { AppointmentsList } from "./pages/AppointmentsList";
import { Layout } from "./components/Layout";

const queryClient = new QueryClient();

function AppInner() {
  return (
    <Router>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/" element={
          <ProtectedRoute>
            <Layout>
              <Navigate to="/customers" replace />
            </Layout>
          </ProtectedRoute>
        } />
        <Route path="/dashboard" element={
          <ProtectedRoute>
            <Layout>
              <Dashboard />
            </Layout>
          </ProtectedRoute>
        } />
        <Route path="/customers" element={
          <ProtectedRoute>
            <Layout>
              <CustomerList />
            </Layout>
          </ProtectedRoute>
        } />
        <Route path="/customers/:id" element={
          <ProtectedRoute>
            <Layout>
              <CustomerDetail />
            </Layout>
          </ProtectedRoute>
        } />
        <Route path="/appointments" element={
          <ProtectedRoute>
            <Layout>
              <AppointmentsList />
            </Layout>
          </ProtectedRoute>
        } />
        <Route path="/master-data" element={
          <ProtectedRoute>
            <Layout>
              <MasterDataManagement />
            </Layout>
          </ProtectedRoute>
        } />
        <Route path="/employees" element={
          <ProtectedRoute>
            <Layout>
              <EmployeeList />
            </Layout>
          </ProtectedRoute>
        } />
      </Routes>
    </Router>
  );
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <AppInner />
        <Toaster />
      </AuthProvider>
    </QueryClientProvider>
  );
}
