import React, { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { Button } from '../../components/Button';
import { Input } from '../../components/Input';
import { employeeService } from '../../api/employee.service';
import { serviceManagementService } from '../../api/service.service';
import type { Employee, CreateEmployeeDto } from '../../types/employee';
import type { ServiceCategoryDto } from '../../types/service';
import { toast } from 'react-hot-toast';
import { Plus, Users, Mail, User as UserIcon, Scissors, Clock } from 'lucide-react';

const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

export const EmployeesPage: React.FC = () => {
    const [employees, setEmployees] = useState<Employee[]>([]);
    const [loading, setLoading] = useState(true);
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [isServicesModalOpen, setIsServicesModalOpen] = useState(false);
    const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);
    const [availableServices, setAvailableServices] = useState<ServiceCategoryDto[]>([]);
    const [assignedServiceIds, setAssignedServiceIds] = useState<string[]>([]);
    const [servicesLoading, setServicesLoading] = useState(false);

    const loadEmployees = async () => {
        setLoading(true);
        try {
            const data = await employeeService.getEmployees();
            setEmployees(data);
        } catch (error) {
            console.error('Failed to load employees:', error);
            toast.error('Failed to load employees');
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
            // Load all shop services
            const allServices = await serviceManagementService.getShopServices();
            setAvailableServices(allServices);

            // Load employee's assigned services
            const assigned = await employeeService.getEmployeeServices(employee.id);
            setAssignedServiceIds(assigned.map((s: any) => s.id));
        } catch (error) {
            toast.error('Failed to load services data');
        } finally {
            setServicesLoading(false);
        }
    };

    const handleAssignServices = async () => {
        if (!selectedEmployee) return;
        try {
            await employeeService.assignServices(selectedEmployee.id, assignedServiceIds);
            toast.success('Services assigned successfully');
            setIsServicesModalOpen(false);
        } catch (error) {
            toast.error('Failed to assign services');
        }
    };

    const toggleService = (serviceId: string) => {
        setAssignedServiceIds(prev =>
            prev.includes(serviceId)
                ? prev.filter(id => id !== serviceId)
                : [...prev, serviceId]
        );
    };

    // Schedule Logic
    const [isScheduleModalOpen, setIsScheduleModalOpen] = useState(false);
    const [schedule, setSchedule] = useState<any[]>([]);

    const handleOpenScheduleModal = async (employee: Employee) => {
        setSelectedEmployee(employee);
        setIsScheduleModalOpen(true);
        try {
            const data = await employeeService.getSchedule(employee.id);
            // Initialize with default 7 days using 0-6 index
            const fullSchedule = Array.from({ length: 7 }, (_, i) => {
                const existing = data.find((s: any) => s.dayOfWeek === i);
                return existing || {
                    dayOfWeek: i,
                    isWorking: false,
                    startTime: '09:00',
                    endTime: '18:00',
                    breakStartTime: '',
                    breakEndTime: ''
                };
            });
            setSchedule(fullSchedule);
        } catch (error) {
            toast.error('Failed to load schedule');
        }
    };

    const handleSaveSchedule = async () => {
        if (!selectedEmployee) return;
        try {
            await employeeService.updateSchedule(selectedEmployee.id, { schedules: schedule });
            toast.success('Schedule updated successfully');
            setIsScheduleModalOpen(false);
        } catch (error) {
            toast.error('Failed to update schedule');
        }
    };

    const updateDaySchedule = (index: number, field: string, value: any) => {
        const newSchedule = [...schedule];
        newSchedule[index] = { ...newSchedule[index], [field]: value };
        setSchedule(newSchedule);
    };

    const AddEmployeeForm = () => {
        const { register, handleSubmit, reset } = useForm<CreateEmployeeDto>();
        const [isSubmitting, setIsSubmitting] = useState(false);

        const onSubmit = async (data: CreateEmployeeDto) => {
            setIsSubmitting(true);
            try {
                // Default password for simplicity if not in UI, or add field
                const payload = { ...data, password: 'Password123!' };
                await employeeService.addEmployee(payload);
                toast.success('Employee added successfully. Default password: Password123!');
                setIsAddModalOpen(false);
                reset();
                loadEmployees();
            } catch (error: any) {
                toast.error(error.response?.data?.message || 'Failed to add employee');
            } finally {
                setIsSubmitting(false);
            }
        };

        return (
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                    <Input
                        label="First Name"
                        {...register('firstName', { required: true })}
                        icon={<UserIcon className="h-4 w-4" />}
                    />
                    <Input
                        label="Last Name"
                        {...register('lastName', { required: true })}
                        icon={<UserIcon className="h-4 w-4" />}
                    />
                </div>
                <Input
                    label="Email"
                    type="email"
                    {...register('email', { required: true })}
                    icon={<Mail className="h-4 w-4" />}
                />
                <Input
                    label="Title"
                    {...register('title', { required: true })}
                    placeholder="e.g. Senior Stylist"
                />

                <div className="flex justify-end space-x-2 mt-6">
                    <Button variant="outline" onClick={() => setIsAddModalOpen(false)} type="button">Cancel</Button>
                    <Button isLoading={isSubmitting} type="submit">Add Employee</Button>
                </div>
            </form>
        );
    };

    if (loading) return <div>Loading...</div>;

    return (
        <div className="max-w-6xl mx-auto">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-bold text-gray-800 flex items-center">
                    <Users className="mr-3 h-8 w-8 text-primary-600" />
                    Employees
                </h1>
                <Button onClick={() => setIsAddModalOpen(true)}>
                    <Plus className="h-4 w-4 mr-2" />
                    New Employee
                </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {employees.map((employee) => (
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
                            <span className={`px-2 py-1 rounded-full text-xs font-semibold ${employee.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                                {employee.isActive ? 'Active' : 'Inactive'}
                            </span>
                        </div>

                        <div className="mt-4 pt-4 border-t border-gray-100 grid grid-cols-2 gap-2">
                            <Button size="sm" variant="outline" onClick={() => handleOpenServicesModal(employee)}>
                                <Scissors className="h-3 w-3 mr-1" />
                                Services
                            </Button>
                            <Button size="sm" variant="outline" onClick={() => handleOpenScheduleModal(employee)}>
                                <Clock className="h-3 w-3 mr-1" />
                                Schedule
                            </Button>
                        </div>
                    </div>
                ))}
            </div>

            {/* Add Employee Modal */}
            {isAddModalOpen && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
                    <div className="bg-white rounded-xl p-6 w-full max-w-md">
                        <h2 className="text-xl font-bold mb-4">Add New Employee</h2>
                        <AddEmployeeForm />
                    </div>
                </div>
            )}

            {/* Schedule Modal */}
            {isScheduleModalOpen && selectedEmployee && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
                    <div className="bg-white rounded-xl p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto">
                        <h2 className="text-xl font-bold mb-4">Work Schedule for {selectedEmployee.firstName}</h2>

                        <div className="space-y-4">
                            {schedule.map((day, index) => (
                                <div key={index} className="flex flex-col md:flex-row items-center gap-4 p-3 border rounded-lg bg-gray-50">
                                    <div className="w-32 flex items-center">
                                        <input
                                            type="checkbox"
                                            checked={day.isWorking}
                                            onChange={(e) => updateDaySchedule(index, 'isWorking', e.target.checked)}
                                            className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded mr-2"
                                        />
                                        <span className="font-medium text-gray-900">{DAYS[index]}</span>
                                    </div>

                                    {day.isWorking && (
                                        <div className="flex-1 grid grid-cols-2 md:grid-cols-4 gap-2">
                                            <div>
                                                <label className="text-xs text-gray-500 block mb-1">Start</label>
                                                <input
                                                    type="time"
                                                    value={day.startTime}
                                                    onChange={(e) => updateDaySchedule(index, 'startTime', e.target.value)}
                                                    className="w-full text-sm border-gray-300 rounded-md shadow-sm focus:border-primary-500 focus:ring-primary-500"
                                                />
                                            </div>
                                            <div>
                                                <label className="text-xs text-gray-500 block mb-1">End</label>
                                                <input
                                                    type="time"
                                                    value={day.endTime}
                                                    onChange={(e) => updateDaySchedule(index, 'endTime', e.target.value)}
                                                    className="w-full text-sm border-gray-300 rounded-md shadow-sm focus:border-primary-500 focus:ring-primary-500"
                                                />
                                            </div>
                                            <div>
                                                <label className="text-xs text-gray-500 block mb-1">Break Start</label>
                                                <input
                                                    type="time"
                                                    value={day.breakStartTime || ''}
                                                    onChange={(e) => updateDaySchedule(index, 'breakStartTime', e.target.value)}
                                                    className="w-full text-sm border-gray-300 rounded-md shadow-sm focus:border-primary-500 focus:ring-primary-500"
                                                />
                                            </div>
                                            <div>
                                                <label className="text-xs text-gray-500 block mb-1">Break End</label>
                                                <input
                                                    type="time"
                                                    value={day.breakEndTime || ''}
                                                    onChange={(e) => updateDaySchedule(index, 'breakEndTime', e.target.value)}
                                                    className="w-full text-sm border-gray-300 rounded-md shadow-sm focus:border-primary-500 focus:ring-primary-500"
                                                />
                                            </div>
                                        </div>
                                    )}
                                    {!day.isWorking && (
                                        <div className="flex-1 text-sm text-gray-400 italic">
                                            Not working
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>

                        <div className="flex justify-end space-x-2 mt-6 pt-4 border-t border-gray-100">
                            <Button variant="outline" onClick={() => setIsScheduleModalOpen(false)}>Cancel</Button>
                            <Button onClick={handleSaveSchedule}>Save Schedule</Button>
                        </div>
                    </div>
                </div>
            )}

            {/* Assign Services Modal */}
            {isServicesModalOpen && selectedEmployee && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
                    <div className="bg-white rounded-xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
                        <h2 className="text-xl font-bold mb-4">Assign Services to {selectedEmployee.firstName}</h2>

                        {servicesLoading ? (
                            <div>Loading services...</div>
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
                            <Button variant="outline" onClick={() => setIsServicesModalOpen(false)}>Cancel</Button>
                            <Button onClick={handleAssignServices}>Save Assignments</Button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
