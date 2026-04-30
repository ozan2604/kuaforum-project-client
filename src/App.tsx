import { Routes, Route, Navigate } from 'react-router-dom';

import { MainLayout } from './layouts/MainLayout';
import { SalonOwnerLayout } from './layouts/SalonOwnerLayout';
import { AdminLayout } from './layouts/AdminLayout';
import { AuthLayout } from './layouts/AuthLayout';

import { ProtectedRoute } from './routes/ProtectedRoute';
import { ErrorBoundary } from './components/ErrorBoundary';

import { HomePage } from './pages/HomePage';
import { ShopDetailsPage } from './pages/ShopDetailsPage';
import { ProfilePage } from './pages/ProfilePage';
import { LoginPage } from './pages/LoginPage';
import { RegisterPage } from './pages/RegisterPage';
import { SalonApplicationPage } from './pages/SalonApplicationPage';
import { CreateShopPage } from './pages/CreateShopPage';
import { MyAppointmentsPage } from './pages/MyAppointmentsPage';
import { UnauthorizedPage } from './pages/UnauthorizedPage';

import { AdminDashboard } from './pages/admin/AdminDashboard';
import { SalonApplicationsPage } from './pages/admin/SalonApplicationsPage';
import { ShopListPage } from './pages/admin/ShopListPage';
import { UserListPage } from './pages/admin/UserListPage';

import { SalonDashboard } from './pages/salon/SalonDashboard';
import { SalonAppointmentsPage } from './pages/salon/SalonAppointmentsPage';
import { MyShopPage } from './pages/salon/MyShopPage';
import { ServicesPage } from './pages/salon/ServicesPage';
import { EmployeesPage } from './pages/salon/EmployeesPage';

import { EmployeeAppointmentsPage } from './pages/employee/EmployeeAppointmentsPage';
import { EmployeeSchedulePage } from './pages/employee/EmployeeSchedulePage';

function App() {
  return (
    <>
      <Routes>

        {/* ── Genel Sayfalar ── */}
        <Route element={<MainLayout />}>
          <Route path="/" element={<HomePage />} />
          <Route path="/shop/:id" element={<ShopDetailsPage />} />
          <Route path="/favorites" element={<HomePage showFavoritesOnly={true} />} />
          <Route path="/profile" element={<ProfilePage />} />
          <Route path="/account" element={<ProfilePage />} />
          <Route path="/unauthorized" element={<UnauthorizedPage />} />
        </Route>

        {/* ── Auth ── */}
        <Route element={<AuthLayout />}>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
        </Route>

        {/* ── Giriş Gerekli (herhangi bir kullanıcı) ── */}
        <Route element={<ProtectedRoute />}>
          <Route element={<MainLayout />}>
            <Route path="/apply-salon" element={<SalonApplicationPage />} />
            <Route path="/salon-basvurusu" element={<SalonApplicationPage />} />
            <Route path="/create-shop" element={<CreateShopPage />} />
            <Route path="/my-appointments" element={<MyAppointmentsPage />} />
          </Route>
        </Route>

        {/* ── Admin Paneli ── */}
        <Route element={<ProtectedRoute roles={['Admin']} />}>
          <Route element={<AdminLayout />}>
            <Route path="/admin" element={<AdminDashboard />} />
            <Route path="/admin/applications" element={<SalonApplicationsPage />} />
            <Route path="/admin/shops" element={<ShopListPage />} />
            <Route path="/admin/users" element={<UserListPage />} />
          </Route>
        </Route>

        {/* ── Salon Sahibi Paneli ── */}
        <Route element={<ProtectedRoute roles={['SalonOwner']} />}>
          <Route element={<SalonOwnerLayout />}>
            <Route path="/salon-panel" element={<SalonDashboard />} />
            <Route path="/salon-panel/appointments" element={<SalonAppointmentsPage />} />
            <Route path="/salon-panel/shop" element={<MyShopPage />} />
            <Route path="/salon-panel/services" element={<ErrorBoundary><ServicesPage /></ErrorBoundary>} />
            <Route path="/salon-panel/employees" element={<EmployeesPage />} />
            <Route path="/salon-panel/settings" element={<div className="p-8">Ayarlar Sayfası (Yakında)</div>} />
          </Route>
        </Route>

        {/* ── Çalışan Paneli ── */}
        <Route element={<ProtectedRoute roles={['Employee']} />}>
          <Route element={<SalonOwnerLayout />}>
            <Route path="/salon-panel/employee-appointments" element={<EmployeeAppointmentsPage />} />
            <Route path="/salon-panel/employee-schedule" element={<EmployeeSchedulePage />} />
          </Route>
        </Route>

        {/* ── Eski URL Yönlendirmeleri ── */}
        <Route path="/employee-panel" element={<Navigate to="/salon-panel/employee-appointments" replace />} />
        <Route path="/employee-panel/appointments" element={<Navigate to="/salon-panel/employee-appointments" replace />} />
        <Route path="/employee-panel/profile" element={<Navigate to="/profile" replace />} />

      </Routes>
    </>
  );
}

export default App;
