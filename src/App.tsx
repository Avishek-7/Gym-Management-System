import { BrowserRouter, Route, Routes, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
// import { ProtectedRoute } from './components/auth/ProtectedRoute';
import LoginPage from './pages/auth/LoginPage';
import RegisterPage from './pages/auth/RegisterPage';
import PasswordResetPage from './pages/auth/PasswordResetPage';
import UnauthorizedPage from './pages/auth/UnauthorizedPage';
// import DashboardPage from './pages/DashboardPage';

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

          {/* Protected Routes - Require Authentication */}
          {/* <Route 
            path="/dashboard" 
            element={
              <ProtectedRoute>
                <DashboardPage />
              </ProtectedRoute>
            } 
          /> */}

          {/* Admin Only Routes */}
          {/* <Route 
            path="/admin/*" 
            element={
              <ProtectedRoute requiredRole="admin">
                <AdminRoutes />
              </ProtectedRoute>
            } 
          /> */}

          {/* Member Routes */}
          {/* <Route 
            path="/member/*" 
            element={
              <ProtectedRoute requiredRole="member">
                <MemberRoutes />
              </ProtectedRoute>
            } 
          /> */}

          {/* Trainer Routes */}
          {/* <Route 
            path="/trainer/*" 
            element={
              <ProtectedRoute requiredRole="trainer">
                <TrainerRoutes />
              </ProtectedRoute>
            } 
          /> */}

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
