import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { appointmentService } from '../../api/appointment.service';
import { employeeService } from '../../api/employee.service';
import { type Appointment, AppointmentStatus } from '../../types/appointment';
import { type EmployeeProfile } from '../../types/employee';
import { useAuth } from '../../context/AuthContext';
import { toast } from 'react-hot-toast';
import { getApiError } from '../../utils/storage';
import {
    Calendar, Clock, CheckCircle, Star, User,
    ChevronRight, Scissors, AlertCircle
} from 'lucide-react';
import { format, isToday, isTomorrow, parseISO } from 'date-fns';
import { tr } from 'date-fns/locale';
import { LoadingSpinner } from '../../components/LoadingSpinner';

export const EmployeeDashboardPage: React.FC = () => {
    const { user } = useAuth();
    const [profile, setProfile] = useState<EmployeeProfile | null>(null);
    const [appointments, setAppointments] = useState<Appointment[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const load = async () => {
            try {
                const [prof, appts] = await Promise.all([
                    employeeService.getProfile(),
                    appointmentService.getAssignedAppointments(),
                ]);
                setProfile(prof);
                setAppointments(appts);
            } catch (err) {
                toast.error(getApiError(err, 'Veriler yüklenemedi'));
            } finally {
                setLoading(false);
            }
        };
        load();
    }, []);

    const now = new Date();

    const todayAppts = appointments.filter(a =>
        isToday(parseISO(a.startTime)) &&
        a.status !== AppointmentStatus.Cancelled &&
        a.status !== AppointmentStatus.Rejected
    ).sort((a, b) => a.startTime.localeCompare(b.startTime));

    const tomorrowAppts = appointments.filter(a =>
        isTomorrow(parseISO(a.startTime)) &&
        a.status !== AppointmentStatus.Cancelled &&
        a.status !== AppointmentStatus.Rejected
    ).sort((a, b) => a.startTime.localeCompare(b.startTime));

    const pendingCount = appointments.filter(a => a.status === AppointmentStatus.Pending).length;
    const completedToday = todayAppts.filter(a => a.status === AppointmentStatus.Completed).length;

    const nextAppt = todayAppts.find(a =>
        parseISO(a.startTime) > now &&
        (a.status === AppointmentStatus.Pending || a.status === AppointmentStatus.Confirmed)
    );

    const statusBadge = (status: AppointmentStatus) => {
        switch (status) {
            case AppointmentStatus.Pending:   return <span className="px-2 py-0.5 bg-yellow-100 text-yellow-700 rounded-full text-xs font-medium">Bekliyor</span>;
            case AppointmentStatus.Confirmed: return <span className="px-2 py-0.5 bg-blue-100 text-blue-700 rounded-full text-xs font-medium">Onaylandı</span>;
            case AppointmentStatus.Completed: return <span className="px-2 py-0.5 bg-green-100 text-green-700 rounded-full text-xs font-medium">Tamamlandı</span>;
            default: return null;
        }
    };

    if (loading) {
        return <LoadingSpinner />;
    }

    return (
        <div className="max-w-5xl mx-auto space-y-6">
            {/* Greeting */}
            <div>
                <h1 className="text-2xl font-bold text-gray-900">
                    Merhaba, {user?.firstName} 👋
                </h1>
                <p className="text-gray-500 text-sm mt-1">
                    {format(now, "d MMMM yyyy, EEEE", { locale: tr })}
                    {profile?.shopName && <> · <span className="text-indigo-600 font-medium">{profile.shopName}</span></>}
                </p>
            </div>

            {/* Stats row */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
                    <div className="flex items-center gap-2 mb-1">
                        <Calendar className="h-4 w-4 text-indigo-500" />
                        <span className="text-xs font-medium text-gray-500">Bugün</span>
                    </div>
                    <p className="text-2xl font-bold text-gray-900">{todayAppts.length}</p>
                    <p className="text-xs text-gray-400">randevu</p>
                </div>

                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
                    <div className="flex items-center gap-2 mb-1">
                        <CheckCircle className="h-4 w-4 text-green-500" />
                        <span className="text-xs font-medium text-gray-500">Tamamlanan</span>
                    </div>
                    <p className="text-2xl font-bold text-gray-900">{completedToday}</p>
                    <p className="text-xs text-gray-400">bugün</p>
                </div>

                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
                    <div className="flex items-center gap-2 mb-1">
                        <AlertCircle className="h-4 w-4 text-amber-500" />
                        <span className="text-xs font-medium text-gray-500">Bekleyen</span>
                    </div>
                    <p className="text-2xl font-bold text-gray-900">{pendingCount}</p>
                    <p className="text-xs text-gray-400">onay bekliyor</p>
                </div>

                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
                    <div className="flex items-center gap-2 mb-1">
                        <Star className="h-4 w-4 text-yellow-400" />
                        <span className="text-xs font-medium text-gray-500">Puanım</span>
                    </div>
                    <p className="text-2xl font-bold text-gray-900">
                        {profile?.averageRating ? profile.averageRating.toFixed(1) : '—'}
                    </p>
                    <p className="text-xs text-gray-400">{profile?.reviewCount ?? 0} değerlendirme</p>
                </div>
            </div>

            {/* Next appointment highlight */}
            {nextAppt && (
                <div className="bg-indigo-600 rounded-2xl p-5 text-white">
                    <p className="text-indigo-200 text-xs font-medium uppercase tracking-wide mb-1">Sıradaki Randevu</p>
                    <div className="flex items-start justify-between gap-4">
                        <div>
                            <p className="text-xl font-bold">{nextAppt.customerName}</p>
                            <p className="text-indigo-200 text-sm mt-0.5 flex items-center gap-1">
                                <Scissors className="h-3.5 w-3.5" />
                                {nextAppt.serviceName} · {nextAppt.duration} dk
                            </p>
                            <p className="text-indigo-100 text-sm mt-1 flex items-center gap-1">
                                <Clock className="h-3.5 w-3.5" />
                                {format(parseISO(nextAppt.startTime), 'HH:mm')} – {format(parseISO(nextAppt.endTime), 'HH:mm')}
                            </p>
                        </div>
                        <Link
                            to="/employee-panel/appointments"
                            className="flex items-center gap-1 bg-white/20 hover:bg-white/30 transition-colors text-white text-xs font-semibold px-3 py-1.5 rounded-lg whitespace-nowrap"
                        >
                            Randevular <ChevronRight className="h-3.5 w-3.5" />
                        </Link>
                    </div>
                </div>
            )}

            {/* Today's schedule */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
                    <h2 className="font-bold text-gray-900 flex items-center gap-2">
                        <Calendar className="h-5 w-5 text-indigo-500" />
                        Bugünün Programı
                    </h2>
                    <Link to="/employee-panel/appointments" className="text-xs text-indigo-600 hover:text-indigo-700 font-medium flex items-center gap-0.5">
                        Tümü <ChevronRight className="h-3.5 w-3.5" />
                    </Link>
                </div>

                {todayAppts.length === 0 ? (
                    <div className="py-12 text-center">
                        <div className="bg-gray-100 p-4 rounded-full w-fit mx-auto mb-3">
                            <Calendar className="h-6 w-6 text-gray-400" />
                        </div>
                        <p className="text-gray-500 text-sm">Bugün randevunuz bulunmuyor</p>
                    </div>
                ) : (
                    <div className="divide-y divide-gray-50">
                        {todayAppts.map(a => (
                            <div key={a.id} className="px-5 py-3.5 flex items-center gap-4">
                                <div className="text-center w-12 shrink-0">
                                    <p className="text-sm font-bold text-gray-900">{format(parseISO(a.startTime), 'HH:mm')}</p>
                                    <p className="text-[10px] text-gray-400">{a.duration} dk</p>
                                </div>
                                <div className="h-8 w-8 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 font-bold text-sm shrink-0">
                                    {a.customerName.charAt(0).toUpperCase()}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm font-semibold text-gray-900 truncate">{a.customerName}</p>
                                    <p className="text-xs text-gray-500 truncate">{a.serviceName}</p>
                                </div>
                                {statusBadge(a.status)}
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Tomorrow */}
            {tomorrowAppts.length > 0 && (
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                    <div className="px-5 py-4 border-b border-gray-100">
                        <h2 className="font-bold text-gray-900 flex items-center gap-2">
                            <Clock className="h-5 w-5 text-gray-400" />
                            Yarın ({tomorrowAppts.length} randevu)
                        </h2>
                    </div>
                    <div className="divide-y divide-gray-50">
                        {tomorrowAppts.map(a => (
                            <div key={a.id} className="px-5 py-3.5 flex items-center gap-4">
                                <div className="text-center w-12 shrink-0">
                                    <p className="text-sm font-bold text-gray-900">{format(parseISO(a.startTime), 'HH:mm')}</p>
                                    <p className="text-[10px] text-gray-400">{a.duration} dk</p>
                                </div>
                                <div className="h-8 w-8 rounded-full bg-gray-100 flex items-center justify-center text-gray-600 font-bold text-sm shrink-0">
                                    {a.customerName.charAt(0).toUpperCase()}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm font-semibold text-gray-900 truncate">{a.customerName}</p>
                                    <p className="text-xs text-gray-500 truncate">{a.serviceName}</p>
                                </div>
                                {statusBadge(a.status)}
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Quick links */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {[
                    { to: '/employee-panel/appointments', icon: Calendar,   label: 'Randevular' },
                    { to: '/employee-panel/schedule',     icon: Clock,      label: 'Çalışma Saatleri' },
                    { to: '/employee-panel/leave',        icon: User,       label: 'İzin Günleri' },
                    { to: '/employee-panel/profile',      icon: User,       label: 'Profilim' },
                ].map(item => (
                    <Link
                        key={item.to}
                        to={item.to}
                        className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 flex flex-col items-center gap-2 hover:border-indigo-200 hover:bg-indigo-50/30 transition-colors group"
                    >
                        <div className="bg-indigo-50 p-2.5 rounded-xl group-hover:bg-indigo-100 transition-colors">
                            <item.icon className="h-5 w-5 text-indigo-600" />
                        </div>
                        <span className="text-xs font-medium text-gray-700 text-center">{item.label}</span>
                    </Link>
                ))}
            </div>
        </div>
    );
};
