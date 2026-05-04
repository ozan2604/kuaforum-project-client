import React, { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { Button } from '../../components/Button';
import { Input } from '../../components/Input';
import { employeeService } from '../../api/employee.service';
import { serviceManagementService } from '../../api/service.service';
import type { Employee, CreateEmployeeDto } from '../../types/employee';
import type { ServiceCategoryDto } from '../../types/service';
import { toast } from 'react-hot-toast';
import { Plus, Users, Phone, User as UserIcon, Scissors, Clock, Trash2, Edit, RotateCcw, CheckCircle, Copy } from 'lucide-react';
import { LoadingSpinner } from '../../components/LoadingSpinner';
import { EmptyState } from '../../components/EmptyState';
import type { UpdateEmployeeOwnerDto } from '../../types/employee';
import { ScheduleEditor, SCHEDULE_DAYS } from '../../components/ScheduleEditor';
import type { DaySchedule } from '../../components/ScheduleEditor';

export const EmployeesPage: React.FC<{ embedded?: boolean }> = ({ embedded = false }) => {
    const [employees, setEmployees] = useState<Employee[]>([]);
    const [loading, setLoading] = useState(true);
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [employeeToDelete, setEmployeeToDelete] = useState<Employee | null>(null);
    const [isRestoreModalOpen, setIsRestoreModalOpen] = useState(false);
    const [employeeToRestore, setEmployeeToRestore] = useState<Employee | null>(null);
    const [isServicesModalOpen, setIsServicesModalOpen] = useState(false);
    const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);
    const [availableServices, setAvailableServices] = useState<ServiceCategoryDto[]>([]);
    const [showSuccessModal, setShowSuccessModal] = useState(false);
    const [createdEmployeeInfo, setCreatedEmployeeInfo] = useState<{ name: string, phone: string, password?: string, isNewUser: boolean } | null>(null);
    
    const [activeTab, setActiveTab] = useState<'active' | 'deleted'>('active');
    
    const [assignedServiceIds, setAssignedServiceIds] = useState<string[]>([]);
    const [servicesLoading, setServicesLoading] = useState(false);

    const loadEmployees = async () => {
        setLoading(true);
        try {
            const data = await employeeService.getEmployees();
            setEmployees(data);
        } catch (error) {
            console.error('Çalışanlar yüklenemedi:', error);
            toast.error('Çalışanlar yüklenemedi');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadEmployees();
    }, []);

    const handleOpenServicesModal = async (employee: Employee) => {
        setSelectedEmployee(employee);
        setIsServicesModalOpen(true);
        setServicesLoading(true);
        try {
            const rawServices = await serviceManagementService.getShopServices();
            
            const getSafeArray = (arr: any) => {
                if (Array.isArray(arr)) return arr;
                if (arr && Array.isArray(arr.$values)) return arr.$values;
                if (arr && Array.isArray(arr.data)) return arr.data;
                return [];
            };

            // Sadece aktif kategori ve aktif hizmetleri filtrele
            const activeServices = getSafeArray(rawServices)
                .filter((c: any) => c && !c.isDeleted)
                .map((c: any) => ({
                    ...c,
                    services: getSafeArray(c.services).filter((s: any) => s && !s.isDeleted)
                }))
                .filter((c: any) => c.services.length > 0); // İçi boş kalan kategorileri gösterme
                
            setAvailableServices(activeServices);

            const assigned = await employeeService.getEmployeeServices(employee.id);
            setAssignedServiceIds(getSafeArray(assigned).map((s: any) => s.id));
        } catch (error) {
            toast.error('Hizmet verileri yüklenemedi');
        } finally {
            setServicesLoading(false);
        }
    };

    const handleAssignServices = async () => {
        if (!selectedEmployee) return;
        try {
            await employeeService.assignServices(selectedEmployee.id, assignedServiceIds);
            toast.success('Hizmetler başarıyla atandı');
            setIsServicesModalOpen(false);
        } catch (error) {
            toast.error('Hizmet ataması başarısız oldu');
        }
    };

    const toggleService = (serviceId: string) => {
        setAssignedServiceIds(prev =>
            prev.includes(serviceId)
                ? prev.filter(id => id !== serviceId)
                : [...prev, serviceId]
        );
    };

    const [isScheduleModalOpen, setIsScheduleModalOpen] = useState(false);
    const [schedule, setSchedule] = useState<DaySchedule[]>([]);

    const handleOpenScheduleModal = async (employee: Employee) => {
        setSelectedEmployee(employee);
        setIsScheduleModalOpen(true);
        try {
            const data = await employeeService.getSchedule(employee.id);
            const fullSchedule = SCHEDULE_DAYS.map((d) => {
                const existing = data.find((s: any) => s.dayOfWeek === d.index);
                return existing
                    ? { dayOfWeek: d.index, isWorking: existing.isWorking, startTime: existing.startTime ?? '09:00', endTime: existing.endTime ?? '18:00', breakStartTime: existing.breakStartTime ?? '', breakEndTime: existing.breakEndTime ?? '' }
                    : { dayOfWeek: d.index, isWorking: false, startTime: '09:00', endTime: '18:00', breakStartTime: '', breakEndTime: '' };
            });
            setSchedule(fullSchedule);
        } catch (error) {
            toast.error('Çalışma saatleri yüklenemedi');
        }
    };

    const handleSaveSchedule = async () => {
        if (!selectedEmployee) return;
        try {
            await employeeService.updateSchedule(selectedEmployee.id, { schedules: schedule });
            toast.success('Çalışma saatleri başarıyla güncellendi');
            setIsScheduleModalOpen(false);
        } catch (error) {
            toast.error('Çalışma saatleri güncellenemedi');
        }
    };

    const AddEmployeeForm = () => {
        const { register, handleSubmit, reset } = useForm<CreateEmployeeDto>();
        const [isSubmitting, setIsSubmitting] = useState(false);

        const onSubmit = async (data: CreateEmployeeDto) => {
            setIsSubmitting(true);
            try {
                const result = await employeeService.addEmployee(data);
                
                if (result.temporaryPassword) {
                    setCreatedEmployeeInfo({
                        name: `${data.firstName} ${data.lastName}`,
                        phone: data.phoneNumber,
                        password: result.temporaryPassword,
                        isNewUser: result.isNewUser
                    });
                    setShowSuccessModal(true);
                    setIsAddModalOpen(false);
                } else {
                    toast.success(result.message, { duration: 6000 });
                    setIsAddModalOpen(false);
                }
                
                reset();
                loadEmployees();
            } catch (error: any) {
                toast.error(error.response?.data?.message || 'Çalışan eklenemedi');
            } finally {
                setIsSubmitting(false);
            }
        };

        return (
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                    <Input label="Ad" {...register('firstName', { required: true })} icon={<UserIcon className="h-4 w-4" />} />
                    <Input label="Soyad" {...register('lastName', { required: true })} icon={<UserIcon className="h-4 w-4" />} />
                </div>
                <Input
                    label="Telefon Numarası"
                    type="tel"
                    {...register('phoneNumber', { 
                        required: true,
                        pattern: { value: /^05\d{9}$/, message: 'Format 05XXXXXXXXX şeklinde olmalıdır' }
                    })}
                    placeholder="05XXXXXXXXX"
                    maxLength={11}
                    icon={<Phone className="h-4 w-4" />}
                />
                <Input label="Ünvan (Örn: Kıdemli Stilist)" {...register('title', { required: true })} placeholder="Örn: Kıdemli Stilist" />
                <div className="flex justify-end space-x-2 mt-6">
                    <Button variant="outline" onClick={() => setIsAddModalOpen(false)} type="button">İptal</Button>
                    <Button isLoading={isSubmitting} type="submit">Uzman Ekle</Button>
                </div>
            </form>
        );
    };

    const confirmRestoreEmployee = (employee: Employee) => {
        setEmployeeToRestore(employee);
        setIsRestoreModalOpen(true);
    };

    const handleRestoreEmployee = async () => {
        if (!employeeToRestore) return;
        try {
            await employeeService.restoreEmployee(employeeToRestore.id);
            toast.success(`${employeeToRestore.firstName} ${employeeToRestore.lastName} başarıyla geri yüklendi.`);
            setIsRestoreModalOpen(false);
            setEmployeeToRestore(null);
            loadEmployees();
        } catch (error: any) {
            toast.error(error.response?.data?.message || 'Çalışan geri yüklenemedi');
        }
    };

    const confirmDeleteEmployee = (employee: Employee) => {
        setEmployeeToDelete(employee);
        setIsDeleteModalOpen(true);
    };

    const handleDeleteEmployee = async () => {
        if (!employeeToDelete) return;
        try {
            await employeeService.deleteEmployee(employeeToDelete.id);
            toast.success('Çalışan başarıyla silindi');
            setIsDeleteModalOpen(false);
            setEmployeeToDelete(null);
            loadEmployees();
        } catch (error) {
            toast.error('Çalışan silinemedi');
        }
    };

    const UpdateEmployeeForm = ({ employee }: { employee: Employee }) => {
        const { register, handleSubmit } = useForm<UpdateEmployeeOwnerDto>({
            defaultValues: {
                firstName: employee.firstName,
                lastName: employee.lastName,
                title: employee.title,
                isActive: employee.isActive
            }
        });
        const [isSubmitting, setIsSubmitting] = useState(false);

        const onSubmit = async (data: UpdateEmployeeOwnerDto) => {
            setIsSubmitting(true);
            try {
                await employeeService.updateEmployee(employee.id, data);
                toast.success('Çalışan bilgileri güncellendi.');
                setIsEditModalOpen(false);
                loadEmployees();
            } catch (error: any) {
                toast.error(error.response?.data?.message || 'Çalışan güncellenemedi');
            } finally {
                setIsSubmitting(false);
            }
        };

        return (
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                    <Input label="Ad" {...register('firstName', { required: true })} icon={<UserIcon className="h-4 w-4" />} />
                    <Input label="Soyad" {...register('lastName', { required: true })} icon={<UserIcon className="h-4 w-4" />} />
                </div>
                <Input label="Ünvan" {...register('title', { required: true })} placeholder="Örn: Kıdemli Stilist" />
                <div className="flex items-center space-x-2 mt-2">
                    <input type="checkbox" {...register('isActive')} id="isActiveCheckbox" className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded" />
                    <label htmlFor="isActiveCheckbox" className="text-sm font-medium text-gray-700">Aktif Çalışan</label>
                </div>
                <div className="flex justify-end space-x-2 mt-6">
                    <Button variant="outline" onClick={() => setIsEditModalOpen(false)} type="button">İptal</Button>
                    <Button isLoading={isSubmitting} type="submit">Güncelle</Button>
                </div>
            </form>
        );
    };

    const activeEmployees = employees.filter(e => !e.isDeleted);
    const deletedEmployees = employees.filter(e => e.isDeleted);

    if (loading) return <LoadingSpinner size="md" />;

    return (
        <div className={embedded ? 'space-y-4' : 'max-w-6xl mx-auto space-y-6'}>
            {!embedded && (
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <h1 className="text-2xl font-bold text-gray-900 flex items-center">
                        <Users className="mr-3 h-8 w-8 text-primary-600" />
                        Uzman Yönetimi
                    </h1>
                    <Button type="button" onClick={() => setIsAddModalOpen(true)} className="flex items-center shadow-md">
                        <Plus className="h-4 w-4 mr-2" />
                        Yeni Uzman Ekle
                    </Button>
                </div>
            )}
            {embedded && (
                <div className="flex justify-end">
                    <Button type="button" onClick={() => setIsAddModalOpen(true)} className="flex items-center">
                        <Plus className="h-4 w-4 mr-2" />
                        Yeni Uzman Ekle
                    </Button>
                </div>
            )}

            <div className="flex space-x-4 border-b border-gray-200">
                <button
                    onClick={() => setActiveTab('active')}
                    className={`pb-3 px-1 text-sm font-medium border-b-2 transition-colors ${activeTab === 'active' ? 'border-primary-600 text-primary-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
                >
                    Mevcut Uzmanlar ({activeEmployees.length})
                </button>
                <button
                    onClick={() => setActiveTab('deleted')}
                    className={`pb-3 px-1 text-sm font-medium border-b-2 transition-colors ${activeTab === 'deleted' ? 'border-red-600 text-red-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
                >
                    Silinenler ({deletedEmployees.length})
                </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {(activeTab === 'active' ? activeEmployees : deletedEmployees).map((employee) => (
                    <div key={employee.id} className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                        <div className="flex items-start justify-between">
                            <div className="flex items-center">
                                <div className="h-12 w-12 rounded-full bg-primary-100 flex items-center justify-center text-primary-600 font-bold text-lg">
                                    {employee.firstName[0]}{employee.lastName[0]}
                                </div>
                                <div className="ml-4">
                                    <h3 className="font-bold text-gray-900">{employee.firstName} {employee.lastName}</h3>
                                    <p className="text-sm text-gray-500">{employee.title}</p>
                                </div>
                            </div>
                            <div className="flex flex-col items-end space-y-2">
                                <span className={`px-2 py-1 rounded-full text-xs font-semibold ${employee.isDeleted ? 'bg-red-100 text-red-800' : employee.isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                                    {employee.isDeleted ? 'Silindi' : employee.isActive ? 'Aktif' : 'Pasif'}
                                </span>
                                {activeTab === 'active' ? (
                                    <div className="flex space-x-1">
                                        <button
                                            type="button"
                                            onClick={() => { setSelectedEmployee(employee); setIsEditModalOpen(true); }}
                                            className="p-1 text-gray-400 hover:text-primary-600 transition-colors"
                                            title="Düzenle"
                                        >
                                            <Edit className="h-4 w-4" />
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => confirmDeleteEmployee(employee)}
                                            className="p-1 text-gray-400 hover:text-red-600 transition-colors"
                                            title="Sil"
                                        >
                                            <Trash2 className="h-4 w-4" />
                                        </button>
                                    </div>
                                ) : (
                                    <button
                                        type="button"
                                        onClick={() => confirmRestoreEmployee(employee)}
                                        className="p-1 text-gray-400 hover:text-green-600 transition-colors"
                                        title="Geri Yükle"
                                    >
                                        <RotateCcw className="h-4 w-4" />
                                    </button>
                                )}
                            </div>
                        </div>

                        <div className="mt-4 pt-4 border-t border-gray-100 grid grid-cols-2 gap-2">
                            <Button type="button" size="sm" variant="outline" onClick={() => handleOpenServicesModal(employee)} disabled={employee.isDeleted}>
                                <Scissors className="h-3 w-3 mr-1" />
                                Hizmetler
                            </Button>
                            <Button type="button" size="sm" variant="outline" onClick={() => handleOpenScheduleModal(employee)} disabled={employee.isDeleted}>
                                <Clock className="h-3 w-3 mr-1" />
                                Çalışma Saatleri
                            </Button>
                        </div>
                    </div>
                ))}
                
                {(activeTab === 'active' ? activeEmployees : deletedEmployees).length === 0 && (
                    <div className="col-span-full">
                        <EmptyState
                            message={activeTab === 'active' ? 'Henüz uzman eklenmemiş.' : 'Silinmiş uzman bulunmuyor.'}
                            icon={<Users className="h-12 w-12" />}
                        />
                    </div>
                )}
            </div>

            {/* Add Employee Modal */}
            {isAddModalOpen && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
                    <div className="bg-white rounded-xl p-6 w-full max-w-md">
                        <h2 className="text-xl font-bold mb-4">Yeni Uzman Ekle</h2>
                        <AddEmployeeForm />
                    </div>
                </div>
            )}

            {/* Edit Employee Modal */}
            {isEditModalOpen && selectedEmployee && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
                    <div className="bg-white rounded-xl p-6 w-full max-w-md">
                        <h2 className="text-xl font-bold mb-4">Uzman Düzenle</h2>
                        <UpdateEmployeeForm employee={selectedEmployee} />
                    </div>
                </div>
            )}

            {/* Delete Confirmation Modal */}
            {isDeleteModalOpen && employeeToDelete && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
                    <div className="bg-white rounded-xl p-6 w-full max-w-sm">
                        <h2 className="text-xl font-bold mb-4 text-gray-900">Uzmanı Sil</h2>
                        <p className="text-gray-600 mb-6">
                            <span className="font-semibold">{employeeToDelete.firstName} {employeeToDelete.lastName}</span> isimli uzmanı silmek istediğinize emin misiniz? Bu işlem geri alınamaz.
                        </p>
                        <div className="flex justify-end space-x-2">
                            <Button variant="outline" onClick={() => setIsDeleteModalOpen(false)}>İptal</Button>
                            <Button onClick={handleDeleteEmployee} className="bg-red-600 hover:bg-red-700 text-white border-transparent">
                                Evet, Sil
                            </Button>
                        </div>
                    </div>
                </div>
            )}

            {/* Restore Confirmation Modal */}
            {isRestoreModalOpen && employeeToRestore && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
                    <div className="bg-white rounded-xl p-6 w-full max-w-sm">
                        <h2 className="text-xl font-bold mb-4 text-gray-900">Uzmanı Geri Yükle</h2>
                        <p className="text-gray-600 mb-6">
                            <span className="font-semibold">{employeeToRestore.firstName} {employeeToRestore.lastName}</span> isimli uzmanı geri yüklemek istediğinize emin misiniz? Uzman Employee rolü yeniden atanacak ve panele erişimi açılacaktır.
                        </p>
                        <div className="flex justify-end space-x-2">
                            <Button variant="outline" onClick={() => { setIsRestoreModalOpen(false); setEmployeeToRestore(null); }}>İptal</Button>
                            <Button onClick={handleRestoreEmployee} className="bg-green-600 hover:bg-green-700 text-white border-transparent">
                                Evet, Geri Yükle
                            </Button>
                        </div>
                    </div>
                </div>
            )}

            {/* Schedule Modal */}
            {isScheduleModalOpen && selectedEmployee && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
                    <div className="bg-white rounded-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
                        <div className="px-6 pt-6 pb-4">
                            <h2 className="text-xl font-bold text-gray-900">{selectedEmployee.firstName} İçin Çalışma Saatleri</h2>
                        </div>
                        <div className="border-t border-gray-100">
                            <ScheduleEditor schedule={schedule} onChange={setSchedule} />
                        </div>
                        <div className="flex justify-end gap-2 px-6 py-4 border-t border-gray-100">
                            <Button variant="outline" onClick={() => setIsScheduleModalOpen(false)}>İptal</Button>
                            <Button onClick={handleSaveSchedule}>Kaydet</Button>
                        </div>
                    </div>
                </div>
            )}

            {/* Assign Services Modal */}
            {isServicesModalOpen && selectedEmployee && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
                    <div className="bg-white rounded-xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
                        <h2 className="text-xl font-bold mb-4">{selectedEmployee.firstName} İçin Hizmet Ata</h2>

                        {servicesLoading ? (
                            <div>Hizmetler yükleniyor...</div>
                        ) : (
                            <div className="space-y-6">
                                {availableServices.map((cat) => (
                                    <div key={cat.id}>
                                        <h3 className="font-semibold text-gray-900 mb-2">{cat.name}</h3>
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                            {cat.services.map((service) => (
                                                <div
                                                    key={service.id}
                                                    onClick={() => toggleService(service.id)}
                                                    className={`p-3 rounded-lg border cursor-pointer transition-colors flex justify-between items-center ${assignedServiceIds.includes(service.id)
                                                        ? 'bg-primary-50 border-primary-500 text-primary-700'
                                                        : 'border-gray-200 hover:bg-gray-50'
                                                        }`}
                                                >
                                                    <span className="text-sm font-medium">{service.name}</span>
                                                    {assignedServiceIds.includes(service.id) && (
                                                        <div className="h-2 w-2 rounded-full bg-primary-600"></div>
                                                    )}
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}

                        <div className="flex justify-end space-x-2 mt-6 pt-4 border-t border-gray-100">
                            <Button variant="outline" onClick={() => setIsServicesModalOpen(false)}>İptal</Button>
                            <Button onClick={handleAssignServices}>Atamaları Kaydet</Button>
                        </div>
                    </div>
                </div>
            )}
            {/* Add Employee Success Modal */}
            {showSuccessModal && createdEmployeeInfo && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-[60]">
                    <div className="bg-white rounded-2xl p-8 w-full max-w-md shadow-2xl animate-in zoom-in-95 duration-300">
                        <div className="flex flex-col items-center text-center">
                            <div className="h-16 w-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center mb-4">
                                <CheckCircle className="h-10 w-10" />
                            </div>
                            <h2 className="text-2xl font-bold text-gray-900 mb-2">Uzman Eklendi!</h2>
                            <p className="text-gray-500 mb-6">
                                <span className="font-semibold text-gray-900">{createdEmployeeInfo.name}</span> başarıyla sisteme kaydedildi.
                            </p>

                            {createdEmployeeInfo.password ? (
                                <div className="w-full space-y-4 bg-gray-50 p-4 rounded-xl border border-gray-100 mb-6">
                                    <div className="text-left">
                                        <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block mb-1">Giriş Telefonu</label>
                                        <div className="flex justify-between items-center bg-white border border-gray-200 rounded-lg px-3 py-2">
                                            <span className="text-sm font-mono text-gray-700">{createdEmployeeInfo.phone}</span>
                                            <button 
                                                onClick={() => { navigator.clipboard.writeText(createdEmployeeInfo.phone); toast.success('Telefon kopyalandı'); }}
                                                className="p-1 hover:bg-gray-100 rounded text-gray-400 hover:text-primary-600 transition-colors"
                                            >
                                                <Copy className="h-4 w-4" />
                                            </button>
                                        </div>
                                    </div>
                                    <div className="text-left">
                                        <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block mb-1">Geçici Şifre</label>
                                        <div className="flex justify-between items-center bg-white border border-gray-200 rounded-lg px-3 py-2">
                                            <span className="text-sm font-mono font-bold text-primary-600">{createdEmployeeInfo.password}</span>
                                            <button 
                                                onClick={() => { navigator.clipboard.writeText(createdEmployeeInfo.password!); toast.success('Şifre kopyalandı'); }}
                                                className="p-1 hover:bg-gray-100 rounded text-gray-400 hover:text-primary-600 transition-colors"
                                            >
                                                <Copy className="h-4 w-4" />
                                            </button>
                                        </div>
                                    </div>
                                    <p className="text-[11px] text-amber-600 font-medium text-center">
                                        Lütfen bu şifreyi çalışanınıza iletin. İlk girişte şifresini değiştirmesi önerilir.
                                    </p>
                                </div>
                            ) : (
                                <p className="text-sm text-blue-600 bg-blue-50 p-3 rounded-lg mb-6">
                                    Bu kullanıcı zaten sistemde kayıtlı olduğu için mevcut şifresiyle giriş yapabilir.
                                </p>
                            )}

                            <Button 
                                className="w-full py-3 text-base font-bold shadow-lg shadow-primary-200" 
                                onClick={() => { setShowSuccessModal(false); setCreatedEmployeeInfo(null); }}
                            >
                                Tamam
                            </Button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
