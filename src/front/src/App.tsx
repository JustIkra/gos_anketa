import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './auth/AuthContext';
import { ProtectedRoute } from './auth/ProtectedRoute';
import { LoginPage } from './auth/LoginPage';
import { AppLayout } from './components/layout/AppLayout';
import { InstitutionListPage } from './pages/InstitutionListPage';
import { InstitutionDetailPage } from './pages/InstitutionDetailPage';
import { SearchPage } from './pages/SearchPage';
import { TerritorialOrgsPage } from './pages/TerritorialOrgsPage';
import { ImportPage } from './pages/ImportPage';
import { SettingsPage } from './pages/SettingsPage';

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route element={<ProtectedRoute />}>
            <Route element={<AppLayout />}>
              <Route
                path="/"
                element={<Navigate to="/institutions" replace />}
              />
              <Route
                path="/institutions"
                element={<InstitutionListPage />}
              />
              <Route
                path="/institutions/:id"
                element={<InstitutionDetailPage />}
              />
              <Route path="/search" element={<SearchPage />} />
              <Route element={<ProtectedRoute requiredRole="admin" />}>
                <Route
                  path="/territorial-orgs"
                  element={<TerritorialOrgsPage />}
                />
                <Route path="/import" element={<ImportPage />} />
                <Route path="/settings" element={<SettingsPage />} />
              </Route>
            </Route>
          </Route>
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
