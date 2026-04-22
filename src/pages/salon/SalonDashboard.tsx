import React, { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { appointmentService } from '../../api/appointment.service';
import { employeeService } from '../../api/employee.service';
import { serviceManagementService } from '../../api/service.service';
import { shopService } from '../../api/shop.service';
import { toast } from 'react-hot-toast';

export const SalonDashboard: React.FC = () => {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [stats, setStats] = useState({
        appointments: 0,
        employees: 0,
        services: 0
    });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const loadStats = async () => {
            try {
                const shop = await shopService.getMyShop();
                if (!shop) return;

                const [appointments, employees, services] = await Promise.all([
                    appointmentService.getShopAppointments(shop.id),
                    employeeService.getEmployees(),
                    serviceManagementService.getShopServices() // Returns categories
                ]);

                // Calculate total services from categories
                const totalServices = services.reduce((acc, cat) => acc + cat.services.length, 0);

                // Filter today's appointments
                const today = new Date().toISOString().split('T')[0];
                const todayAppointments = appointments.items.filter(a => a.startTime.startsWith(today));

                setStats({
                    appointments: todayAppointments.length,
                    employees: employees.filter(e => e.isActive).length,
                    services: totalServices
                });
            } catch (error) {
                console.error('Failed to load dashboard stats', error);
                toast.error('Failed to load dashboard statistics');
            } finally {
                setLoading(false);
            }
        };

        loadStats();
    }, []);

    return (
        <div>
            <h1 className="text-2xl font-bold text-gray-800 mb-6">Tekrar Hoş Geldiniz, {user?.firstName || 'Salon Sahibi'}!</h1>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                    <h3 className="text-gray-500 text-sm font-medium">Bugünkü Randevular</h3>
                    <p className="text-3xl font-bold text-gray-900 mt-2">{loading ? '-' : stats.appointments}</p>
                </div>

                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                    <h3 className="text-gray-500 text-sm font-medium">Aktif Çalışanlar</h3>
                    <p className="text-3xl font-bold text-gray-900 mt-2">{loading ? '-' : stats.employees}</p>
                </div>

                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                    <h3 className="text-gray-500 text-sm font-medium">Toplam Hizmetler</h3>
                    <p className="text-3xl font-bold text-gray-900 mt-2">{loading ? '-' : stats.services}</p>
                </div>
            </div>

            <div className="mt-8 bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                <h2 className="text-lg font-bold text-gray-800 mb-4">Hızlı İşlemler</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <button
                        onClick={() => navigate('/salon/services')}
                        className="p-4 border border-gray-200 rounded-lg text-left hover:bg-gray-50 transition-colors"
                    >
                        <span className="block font-medium text-gray-900">Hizmet Ekle</span>
                        <span className="text-sm text-gray-500">Yeni bir hizmet tanımla</span>
                    </button>
                    <button
                        onClick={() => navigate('/salon/employees')}
                        className="p-4 border border-gray-200 rounded-lg text-left hover:bg-gray-50 transition-colors"
                    >
                        <span className="block font-medium text-gray-900">Çalışan Ekle</span>
                        <span className="text-sm text-gray-500">Yeni personel kaydet</span>
                    </button>
                    <button
                        onClick={() => navigate('/salon/shop')}
                        className="p-4 border border-gray-200 rounded-lg text-left hover:bg-gray-50 transition-colors"
                    >
                        <span className="block font-medium text-gray-900">Dükkan Bilgilerini Güncelle</span>
                        <span className="text-sm text-gray-500">Adres veya açıklama düzenle</span>
                    </button>
                </div>
            </div>
        </div >
    );
};
