import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { userService } from '../../api/user.service';
import type { UserDto } from '../../api/user.service';
import { toast } from 'react-hot-toast';
import { Trash2, UserX, ChevronLeft, ChevronRight, Shield, Store, Scissors, Search } from 'lucide-react';

export const UserListPage: React.FC = () => {
    const [users, setUsers] = useState<UserDto[]>([]);
    const [loading, setLoading] = useState(true);
    const [userToDelete, setUserToDelete] = useState<{ id: string, name: string } | null>(null);
    const [page, setPage] = useState(1);
    const [totalCount, setTotalCount] = useState(0);
    const [searchTerm, setSearchTerm] = useState('');
    const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('');
    const pageSize = 12;

    useEffect(() => {
        const handler = setTimeout(() => {
            setDebouncedSearchTerm(searchTerm);
        }, 400); // 400ms debounce
        return () => clearTimeout(handler);
    }, [searchTerm]);

    useEffect(() => {
        setPage(1);
    }, [debouncedSearchTerm]);

    const fetchUsers = async () => {
        setLoading(true);
        try {
            const data = await userService.getAllUsers(page, pageSize, debouncedSearchTerm);
            setUsers(data.users);
            setTotalCount(data.totalCount);
        } catch (error: any) {
            console.error('Error fetching users:', error);
            const errorMessage = error.response?.data?.message || error.message || 'Failed to load users';
            toast.error(errorMessage);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchUsers();
    }, [page, debouncedSearchTerm]);

    const executeDelete = async (id: string) => {
        try {
            await userService.deleteUserByAdmin(id);
            setUsers(prevUsers => prevUsers.filter(user => user.id !== id));
            setTotalCount(prev => prev - 1);
            toast.success('User deleted successfully');
            if (users.length === 1 && page > 1) {
                setPage(page - 1);
            } else {
                fetchUsers(); // Refresh to get next user from pagination
            }
        } catch (error: any) {
            console.error('Error deleting user:', error);
            const errorMessage = error.response?.data?.message || error.message || 'Failed to delete user';
            toast.error(errorMessage);
        }
    };

    const totalPages = Math.ceil(totalCount / pageSize);

    if (loading && users.length === 0) {
        return <div className="p-4 text-center">Loading...</div>;
    }

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h2 className="text-2xl font-bold text-gray-800">Registered Users</h2>
                    <div className="text-sm text-gray-500">
                        Total: <span className="font-semibold text-gray-900">{totalCount}</span>
                    </div>
                </div>
                
                <div className="relative w-full md:w-80">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Search className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                        type="text"
                        className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-primary-500 focus:border-primary-500 sm:text-sm transition duration-150 ease-in-out"
                        placeholder="İsim, e-posta, tel veya kullanıcı adı ara..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
            </div>

            <div className="bg-white rounded-lg shadow overflow-hidden border border-gray-200">
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    User
                                </th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Telefon / E-posta
                                </th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Connections & Roles
                                </th>
                                <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Actions
                                </th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {users.map((user) => (
                                <tr key={user.id} className="hover:bg-gray-50 transition-colors">
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="flex items-center">
                                            <div className="h-10 w-10 flex-shrink-0 bg-primary-100 rounded-full flex items-center justify-center text-primary-700 font-bold">
                                                {user.firstName?.charAt(0) || '?'}
                                            </div>
                                            <div className="ml-4">
                                                <div className="text-sm font-medium text-gray-900">
                                                    {user.firstName} {user.lastName}
                                                </div>
                                                <div className="text-sm text-gray-500">
                                                    {user.phoneNumber || 'Telefon yok'}
                                                </div>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="text-sm font-medium text-gray-900">{user.phoneNumber || '-'}</div>
                                        {user.email && <div className="text-xs text-gray-400 mt-0.5">{user.email}</div>}
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex flex-col gap-2">
                                            {/* Roles */}
                                            {user.roles && user.roles.length > 0 && (
                                                <div className="flex flex-wrap gap-1">
                                                    {user.roles.map(role => (
                                                        <span key={role} className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800">
                                                            <Shield className="w-3 h-3 mr-1" />
                                                            {role}
                                                        </span>
                                                    ))}
                                                </div>
                                            )}
                                            
                                            {/* Owned Shops */}
                                            {user.ownedShops && user.ownedShops.length > 0 && (
                                                <div className="flex flex-wrap gap-1">
                                                    {user.ownedShops.map(shop => (
                                                        <span key={shop} className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-purple-100 text-purple-800">
                                                            <Store className="w-3 h-3 mr-1" />
                                                            {shop} (Sahibi)
                                                        </span>
                                                    ))}
                                                </div>
                                            )}

                                            {/* Employed Shops */}
                                            {user.employedShops && user.employedShops.length > 0 && (
                                                <div className="flex flex-wrap gap-1">
                                                    {user.employedShops.map(shop => (
                                                        <span key={shop} className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800">
                                                            <Scissors className="w-3 h-3 mr-1" />
                                                            {shop} (Personel)
                                                        </span>
                                                    ))}
                                                </div>
                                            )}

                                            {(!user.roles || user.roles.length === 0) && (!user.ownedShops || user.ownedShops.length === 0) && (!user.employedShops || user.employedShops.length === 0) && (
                                                <span className="text-sm text-gray-400">No connections</span>
                                            )}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                        {user.roles && user.roles.includes('Admin') ? (
                                            <span className="inline-flex items-center text-gray-400 text-xs font-semibold px-2 py-1 rounded bg-gray-50 border border-gray-200" title="Sistem Yöneticileri silinemez">
                                                <Shield className="w-3 h-3 mr-1" />
                                                Protected
                                            </span>
                                        ) : (
                                            <button
                                                onClick={() => setUserToDelete({ id: user.id, name: `${user.firstName} ${user.lastName}`.trim() || user.userName })}
                                                className="text-red-600 hover:text-red-900 p-2 rounded-full hover:bg-red-50 transition-colors focus:outline-none"
                                                title="Kullanıcıyı Sil"
                                            >
                                                <Trash2 className="w-5 h-5" />
                                            </button>
                                        )}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {users.length === 0 && !loading && (
                    <div className="flex flex-col items-center justify-center p-12 bg-white border-t border-gray-200">
                        <UserX className="h-12 w-12 text-gray-400 mb-4" />
                        <p className="text-lg text-gray-500">No users found.</p>
                    </div>
                )}
            </div>

            {/* Pagination Controls */}
            {totalPages > 1 && (
                <div className="flex items-center justify-center space-x-2 mt-8">
                    <button
                        onClick={() => setPage(p => Math.max(1, p - 1))}
                        disabled={page === 1}
                        className="p-2 rounded-md border border-gray-300 bg-white text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                        <ChevronLeft className="w-5 h-5" />
                    </button>
                    <span className="text-sm text-gray-700 font-medium px-4">
                        Page {page} of {totalPages}
                    </span>
                    <button
                        onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                        disabled={page === totalPages}
                        className="p-2 rounded-md border border-gray-300 bg-white text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                        <ChevronRight className="w-5 h-5" />
                    </button>
                </div>
            )}

            {/* Delete Confirmation Modal */}
            {userToDelete && typeof document !== 'undefined' && createPortal(
                <div className="fixed inset-0 z-[99999] flex items-center justify-center p-4 bg-black/50 transition-opacity">
                    <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6 transform transition-all scale-100 opacity-100">
                        <h3 className="text-xl font-bold text-gray-900 mb-3">
                            Kullanıcıyı Sil
                        </h3>
                        <p className="text-gray-600 mb-6">
                            <strong>"{userToDelete.name}"</strong> adlı kullanıcıyı silmek istediğinize emin misiniz? Bu işlem kullanıcıya ait tüm verileri (yorumlar, randevular, dükkanı varsa dükkanı, favorileri vb.) kalıcı olarak silecektir. <span className="font-semibold text-red-600">Bu işlem geri alınamaz.</span>
                        </p>
                        <div className="flex justify-end gap-3">
                            <button
                                onClick={() => setUserToDelete(null)}
                                className="px-4 py-2 text-sm font-semibold text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 transition-colors"
                            >
                                İptal
                            </button>
                            <button
                                onClick={() => {
                                    executeDelete(userToDelete.id);
                                    setUserToDelete(null);
                                }}
                                className="px-4 py-2 text-sm font-semibold text-white bg-red-600 rounded-lg hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 transition-colors"
                            >
                                Evet, Sil
                            </button>
                        </div>
                    </div>
                </div>,
                document.body
            )}
        </div>
    );
};
