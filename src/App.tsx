import { Routes, Route } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { MainLayout } from './layouts/MainLayout';
import { AuthLayout } from './layouts/AuthLayout';
import { HomePage } from './pages/HomePage';
import { LoginPage } from './pages/LoginPage';
import { RegisterPage } from './pages/RegisterPage';
import { CreateShopPage } from './pages/CreateShopPage';
import { SalonApplicationPage } from './pages/SalonApplicationPage';
import { ProtectedRoute } from './routes/ProtectedRoute';
import { AdminLayout } from './layouts/AdminLayout';
import { AdminDashboard } from './pages/admin/AdminDashboard';
import { SalonApplicationsPage } from './pages/admin/SalonApplicationsPage';
import { ShopListPage } from './pages/admin/ShopListPage';
import { SalonOwnerLayout } from './layouts/SalonOwnerLayout';
import { SalonDashboard } from './pages/salon/SalonDashboard';
import { MyShopPage } from './pages/salon/MyShopPage';
import { ServicesPage } from './pages/salon/ServicesPage';
import { EmployeesPage } from './pages/salon/EmployeesPage';
import { SalonAppointmentsPage } from './pages/salon/SalonAppointmentsPage';
import { ShopDetailsPage } from './pages/ShopDetailsPage';
import { MyAppointmentsPage } from './pages/MyAppointmentsPage';
import { ProfilePage } from './pages/ProfilePage';

function App() {
  return (
    <>
      <Toaster position="top-right" />
      <Routes>
        <Route element={<MainLayout />}>
          <Route path="/" element={<HomePage />} />
          <Route path="/shop/:id" element={<ShopDetailsPage />} />
          <Route path="/my-appointments" element={<MyAppointmentsPage />} />
        </Route>

        <Route element={<AuthLayout />}>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
        </Route>

        <Route element={<ProtectedRoute />}>
          <Route element={<MainLayout />}>
            <Route path="/apply-salon" element={<SalonApplicationPage />} />
          </Route>
        </Route>

        <Route element={<MainLayout />}>
          <Route path="/create-shop" element={<CreateShopPage />} />
          {/* Old route removed, moved to SalonLayout */}
        </Route>

        <Route element={<ProtectedRoute roles={['Admin']} />}>
          <Route element={<AdminLayout />}>
            <Route path="/admin" element={<AdminDashboard />} />
            <Route path="/admin/applications" element={<SalonApplicationsPage />} />
            <Route path="/admin/shops" element={<ShopListPage />} />
          </Route>
        </Route>

        <Route element={<ProtectedRoute roles={['SalonOwner']} />}>
          <Route element={<SalonOwnerLayout />}>
            <Route path="/salon-panel" element={<SalonDashboard />} />
            <Route path="/salon-panel/shop" element={<MyShopPage />} />
            <Route path="/salon-panel/services" element={<ServicesPage />} />
            <Route path="/salon-panel/employees" element={<EmployeesPage />} />
            <Route path="/salon-panel/appointments" element={<SalonAppointmentsPage />} />
            <Route path="/salon-panel/settings" element={<div className="p-8">Ayarlar Sayfası (Yakında)</div>} />
          </Route>
        </Route>

        {/* Placeholders for future implementation */}
        <Route element={<MainLayout />}>
          <Route path="/favorites" element={<div className="p-8 text-center">Favoriler (Yakında)</div>} />
          <Route path="/profile" element={<ProfilePage />} />
          {/* Legacy support or redirect */}
          <Route path="/my-appointments" element={<ProfilePage />} />
          <Route path="/account" element={<ProfilePage />} />
        </Route>
      </Routes>
    </>
  );
}

export default App;
