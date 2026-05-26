import { Routes, Route, Navigate } from 'react-router-dom';
import { Toaster, ToastBar, toast } from 'react-hot-toast';
import { X } from 'lucide-react';
import { CookieBanner } from './components/CookieBanner';
import { ScrollToTop } from './components/ScrollToTop';

import { MainLayout } from './layouts/MainLayout';
import { SalonOwnerLayout } from './layouts/SalonOwnerLayout';
import { EmployeeLayout } from './layouts/EmployeeLayout';
import { AdminLayout } from './layouts/AdminLayout';
import { AuthLayout } from './layouts/AuthLayout';

import { ProtectedRoute } from './routes/ProtectedRoute';

import { HomePage } from './pages/HomePage';
import { BusinessMarketingPage } from './pages/BusinessMarketingPage';
import { ShopDetailsPage } from './pages/ShopDetailsPage';
import { ProfilePage } from './pages/ProfilePage';
import { LoginPage } from './pages/LoginPage';
import { RegisterPage } from './pages/RegisterPage';
import { ForgotPasswordPage } from './pages/ForgotPasswordPage';
import { SalonApplicationPage } from './pages/SalonApplicationPage';
import { CreateShopPage } from './pages/CreateShopPage';
import { MyAppointmentsPage } from './pages/MyAppointmentsPage';
import { UnauthorizedPage } from './pages/UnauthorizedPage';
import { LegalPage } from './pages/legal/LegalPage';
import { LEGAL_TEXTS } from './constants/legal';

import { AdminDashboard } from './pages/admin/AdminDashboard';
import { SalonApplicationsPage } from './pages/admin/SalonApplicationsPage';
import { ShopListPage } from './pages/admin/ShopListPage';
import { UserListPage } from './pages/admin/UserListPage';
import { SmsTestPage } from './pages/admin/SmsTestPage';

import { SalonDashboard } from './pages/salon/SalonDashboard';
import { SalonAppointmentsPage } from './pages/salon/SalonAppointmentsPage';
import { MyShopPage } from './pages/salon/MyShopPage';
import { BlockedCustomersPage } from './pages/salon/BlockedCustomersPage';
import { SalonQrCodePage } from './pages/salon/SalonQrCodePage';

import { EmployeeAppointmentsPage } from './pages/employee/EmployeeAppointmentsPage';
import { EmployeeSchedulePage } from './pages/employee/EmployeeSchedulePage';
import { EmployeeDashboardPage } from './pages/employee/EmployeeDashboardPage';
import { EmployeeProfilePage } from './pages/employee/EmployeeProfilePage';
import { EmployeeLeavePage } from './pages/employee/EmployeeLeavePage';

function App() {
  return (
    <>
      <ScrollToTop />
      <Toaster
        position="top-right"
        toastOptions={{ duration: 7500 }}
        containerStyle={{ top: 20, right: 20 }}
      >
        {(t) => (
          <ToastBar toast={t} style={{ padding: '14px 16px', maxWidth: 380, fontSize: '0.9rem' }}>
            {({ icon, message }) => (
              <div className="flex items-center gap-3 w-full">
                <span className="shrink-0">{icon}</span>
                <span className="flex-1 leading-snug">{message}</span>
                <button
                  onClick={() => toast.dismiss(t.id)}
                  className="shrink-0 ml-1 text-gray-400 hover:text-gray-700 transition-colors self-center"
                  aria-label="Kapat"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            )}
          </ToastBar>
        )}
      </Toaster>
      <CookieBanner />
      <Routes>

        {/* ── Genel Sayfalar ── */}
        <Route element={<MainLayout />}>
          <Route path="/" element={<HomePage />} />
          <Route path="/isletmeler-icin" element={<BusinessMarketingPage />} />
          <Route path="/shop/:id" element={<ShopDetailsPage />} />
          <Route path="/favorites" element={<HomePage showFavoritesOnly={true} />} />
          <Route path="/profile" element={<ProfilePage />} />
          <Route path="/account" element={<ProfilePage />} />
          <Route path="/unauthorized" element={<UnauthorizedPage />} />
          <Route path="/kvkk" element={<LegalPage title="KVKK Aydınlatma Metni" content={LEGAL_TEXTS.KVKK_DETAILS} />} />
          <Route path="/gizlilik-politikasi" element={<LegalPage title="Gizlilik Politikası" content={LEGAL_TEXTS.PRIVACY_POLICY} />} />
          <Route path="/cerez-politikasi" element={<LegalPage title="Çerez Politikası" content={LEGAL_TEXTS.COOKIE_POLICY} />} />
        </Route>

        {/* ── Auth ── */}
        <Route element={<AuthLayout />}>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/forgot-password" element={<ForgotPasswordPage />} />
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
            <Route path="/admin/sms-test" element={<SmsTestPage />} />
          </Route>
        </Route>

        {/* ── Salon Sahibi Paneli ── */}
        <Route element={<ProtectedRoute roles={['SalonOwner']} />}>
          <Route element={<SalonOwnerLayout />}>
            <Route path="/salon-panel" element={<SalonDashboard />} />
            <Route path="/salon-panel/appointments" element={<SalonAppointmentsPage />} />
            <Route path="/salon-panel/shop" element={<MyShopPage />} />
            <Route path="/salon-panel/services" element={<Navigate to="/salon-panel/shop" replace />} />
            <Route path="/salon-panel/employees" element={<Navigate to="/salon-panel/shop" replace />} />
            <Route path="/salon-panel/settings" element={<div className="p-8">Ayarlar Sayfası (Yakında)</div>} />
            <Route path="/salon-panel/blocked-customers" element={<BlockedCustomersPage />} />
            <Route path="/salon-panel/qr-kod" element={<SalonQrCodePage />} />
          </Route>
        </Route>

        {/* ── Çalışan Paneli ── */}
        <Route element={<ProtectedRoute roles={['Employee']} />}>
          <Route element={<EmployeeLayout />}>
            <Route path="/employee-panel" element={<EmployeeDashboardPage />} />
            <Route path="/employee-panel/appointments" element={<EmployeeAppointmentsPage />} />
            <Route path="/employee-panel/schedule" element={<EmployeeSchedulePage />} />
            <Route path="/employee-panel/profile" element={<EmployeeProfilePage />} />
            <Route path="/employee-panel/leave" element={<EmployeeLeavePage />} />
          </Route>
        </Route>

        {/* ── Eski URL Yönlendirmeleri ── */}
        <Route path="/salon-panel/employee-appointments" element={<Navigate to="/employee-panel/appointments" replace />} />
        <Route path="/salon-panel/employee-schedule" element={<Navigate to="/employee-panel/schedule" replace />} />

      </Routes>
    </>
  );
}

export default App;
