import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './auth/AuthContext';
import PlantsPage from './pages/PlantsPage';
import PlantDetailPage from './pages/PlantDetailPage';
import './index.css';
import { PrivateRoute } from './auth/PrivateRoute';
import LoginPage from './auth/LoginPage';
import RegisterPage from './auth/RegisterPage';
import { ToastProvider } from './components/Toast';
import { Navbar } from './components/Navbar';

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <ToastProvider>
          <Navbar></Navbar>
          <Routes>
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
            <Route
              path="/plants"
              element={
                <PrivateRoute>
                  <PlantsPage />
                </PrivateRoute>
              }
            />
            <Route
              path="/plants/:id"
              element={
                <PrivateRoute>
                  <PlantDetailPage />
                </PrivateRoute>
              }
            />
            <Route path="*" element={<Navigate to="/plants" replace />} />
          </Routes>
        </ToastProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}
