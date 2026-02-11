import React, { useEffect, useState } from 'react';
import { salonApplicationService } from '../../api/salon-application.service';
import { Button } from '../../components/Button';
import { Check, X } from 'lucide-react';
import { toast } from 'react-hot-toast';

interface SalonApplication {
    id: string;
    userId: string;
    shopName: string;
    description: string;
    taxNumber: string;
    userName: string; // Added userName
    createdAt: string;
    status: number;
}

export const SalonApplicationsPage: React.FC = () => {
    const [applications, setApplications] = useState<SalonApplication[]>([]);
    const [loading, setLoading] = useState(true);

    const fetchApplications = async () => {
        try {
            const data = await salonApplicationService.getPendingApplications();
            setApplications(data);
        } catch (error: any) {
            console.error('Error fetching applications:', error);
            const errorMessage = error.response?.data?.message || error.message || 'Failed to load applications';
            toast.error(errorMessage);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchApplications();
    }, []);

    const handleApprove = async (id: string) => {
        if (!window.confirm('Are you sure you want to approve this application?')) return;
        try {
            await salonApplicationService.approve(id);
            toast.success('Application approved');
            setApplications(applications.filter(app => app.id !== id));
        } catch (error) {
            console.error('Error approving application:', error);
            toast.error('Failed to approve application');
        }
    };

    const handleReject = async (id: string) => {
        if (!window.confirm('Are you sure you want to reject this application?')) return;
        try {
            await salonApplicationService.reject(id);
            toast.success('Application rejected');
            setApplications(applications.filter(app => app.id !== id));
        } catch (error) {
            console.error('Error rejecting application:', error);
            toast.error('Failed to reject application');
        }
    };

    if (loading) {
        return <div className="p-4 text-center">Loading...</div>;
    }

    return (
        <div className="bg-white shadow rounded-lg overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200">
                <h2 className="text-xl font-bold text-gray-800">Pending Applications</h2>
            </div>

            {applications.length === 0 ? (
                <div className="p-8 text-center text-gray-500">
                    No pending applications found.
                </div>
            ) : (
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Applicant</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Explanation</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Identity No</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {applications.map((app) => (
                                <tr key={app.id}>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="text-sm font-medium text-gray-900">{app.userName}</div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="text-sm text-gray-500 max-w-xs truncate" title={app.description}>
                                            {app.description}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="text-sm text-gray-500">{app.taxNumber}</div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="text-sm text-gray-500">
                                            {new Date(app.createdAt).toLocaleDateString()}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                        <div className="flex justify-end space-x-2">
                                            <Button
                                                size="sm"
                                                onClick={() => handleApprove(app.id)}
                                                className="bg-green-600 hover:bg-green-700 text-white"
                                            >
                                                <Check className="h-4 w-4 mr-1" />
                                                Approve
                                            </Button>
                                            <Button
                                                size="sm"
                                                variant="outline"
                                                onClick={() => handleReject(app.id)}
                                                className="text-red-600 border-red-200 hover:bg-red-50"
                                            >
                                                <X className="h-4 w-4 mr-1" />
                                                Reject
                                            </Button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
};
