import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider, CssBaseline } from '@mui/material';
import theme from './theme';
import LoginPage from './pages/LoginPage';
import SignupPage from './pages/SignupPage';
import DashboardPage from './pages/DashboardPage';
import TimesheetsPage from './pages/TimesheetsPage';
import TimeOffPage from './pages/TimeOffPage';
import ApprovalsPage from './pages/ApprovalsPage';

import EmployeesPage from './pages/EmployeesPage';
import { AuthProvider, useAuth } from './utils/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import MainLayout from './layouts/MainLayout';
import './App.css';

const RoleProtectedRoute: React.FC<{ children: React.ReactNode; allowedRoles: string[] }> = ({ children, allowedRoles }) => {
  const { userRole } = useAuth();
  if (!userRole || !allowedRoles.includes(userRole)) {
    return <Navigate to="/dashboard" replace />;
  }
  return <>{children}</>;
};

function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <AuthProvider>
        <Router>
          <Routes>
            <Route path="/login" element={<LoginPage />} />
            <Route path="/signup" element={<SignupPage />} />
            <Route path="/dashboard" element={
              <ProtectedRoute>
                <MainLayout>
                  <DashboardPage />
                </MainLayout>
              </ProtectedRoute>
            } />
            <Route path="/timesheets" element={
              <ProtectedRoute>
                <RoleProtectedRoute allowedRoles={["consultant"]}>
                  <MainLayout>
                    <TimesheetsPage />
                  </MainLayout>
                </RoleProtectedRoute>
              </ProtectedRoute>
            } />
            <Route path="/time-off" element={
              <ProtectedRoute>
                <RoleProtectedRoute allowedRoles={["consultant"]}>
                  <MainLayout>
                    <TimeOffPage />
                  </MainLayout>
                </RoleProtectedRoute>
              </ProtectedRoute>
            } />
            <Route path="/approvals" element={
              <ProtectedRoute>
                <RoleProtectedRoute allowedRoles={["client_manager"]}>
                  <MainLayout>
                    <ApprovalsPage />
                  </MainLayout>
                </RoleProtectedRoute>
              </ProtectedRoute>
            } />

            <Route path="/employees" element={
              <ProtectedRoute>
                <RoleProtectedRoute allowedRoles={["dew_admin"]}>
                  <MainLayout>
                    <EmployeesPage />
                  </MainLayout>
                </RoleProtectedRoute>
              </ProtectedRoute>
            } />
            <Route path="/" element={<Navigate to="/login" replace />} />
          </Routes>
        </Router>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App; 