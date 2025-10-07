import { BrowserRouter, Route, Routes, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ProtectedRoute } from './components/auth/ProtectedRoute';
import LoginPage from './pages/auth/LoginPage';
import RegisterPage from './pages/auth/RegisterPage';
import PasswordResetPage from './pages/auth/PasswordResetPage';
import UnauthorizedPage from './pages/auth/UnauthorizedPage';
import MemberDashboard from './pages/member/MemberDashboard';
import AdminDashboard from './pages/admin/AdminDashboard';
import TrainerDashboard from './pages/trainer/TrainerDashboard';

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Public Auth Routes */}
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/password-reset" element={<PasswordResetPage />} />
          <Route path="/unauthorized" element={<UnauthorizedPage />} />

          {/* Member Dashboard - Protected Route */}
          <Route 
            path="/member/dashboard" 
            element={
              <ProtectedRoute requiredRole="member">
                <MemberDashboard />
              </ProtectedRoute>
            } 
          />

          {/* Redirect for backward compatibility */}
          <Route path="/MemberDashboard" element={<Navigate to="/member/dashboard" replace />} />

          {/* Admin Dashboard - Protected Route */}
          <Route 
            path="/admin/dashboard" 
            element={
              <ProtectedRoute requiredRole="admin">
                <AdminDashboard />
              </ProtectedRoute>
            } 
          />

          {/* Trainer Dashboard - Protected Route */}
          <Route 
            path="/trainer/dashboard" 
            element={
              <ProtectedRoute requiredRole="trainer">
                <TrainerDashboard />
              </ProtectedRoute>
            } 
          />

          {/* Default redirect to login */}
          <Route path="/" element={<Navigate to="/login" replace />} />

          {/* Redirect unknown routes to login */}
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
