import React, { useEffect, useState } from 'react';
import type { AdminPasswordStatus } from '../../api/adminPassword.service';
import { adminPasswordService } from '../../api/adminPassword.service';
import { Key, CheckCircle, Trash2, Edit2, Plus, AlertCircle } from 'lucide-react';

const AdminPasswordsPage: React.FC = () => {
    const [passwords, setPasswords] = useState<AdminPasswordStatus[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    // Modal state
    const [modalConfig, setModalConfig] = useState<{
        isOpen: boolean;
        type: 'set' | 'update' | 'delete' | null;
        key: string;
    }>({ isOpen: false, type: null, key: '' });
    
    const [inputValue, setInputValue] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        loadPasswords();
    }, []);

    const loadPasswords = async () => {
        try {
            setLoading(true);
            const data = await adminPasswordService.getAllStatuses();
            setPasswords(data);
        } catch (err) {
            setError('Şifre bilgileri yüklenirken bir hata oluştu.');
        } finally {
            setLoading(false);
        }
    };

    const openModal = (type: 'set' | 'update' | 'delete', key: string) => {
        setInputValue('');
        setModalConfig({ isOpen: true, type, key });
    };

    const closeModal = () => {
        setModalConfig({ isOpen: false, type: null, key: '' });
        setInputValue('');
    };

    const handleConfirm = async () => {
        if (!modalConfig.key) return;
        
        setIsSubmitting(true);
        try {
            if (modalConfig.type === 'delete') {
                await adminPasswordService.deletePassword(modalConfig.key);
            } else {
                if (!inputValue.trim()) {
                    setIsSubmitting(false);
                    return;
                }
                await adminPasswordService.setPassword({ key: modalConfig.key, password: inputValue });
            }
            await loadPasswords();
            closeModal();
        } catch (err: any) {
            alert('İşlem sırasında bir hata oluştu: ' + (err.response?.data?.message || err.message));
        } finally {
            setIsSubmitting(false);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Şifreler</h1>
                    <p className="text-gray-500 mt-1">Yönetici şifrelerini buradan güvenle belirleyebilir ve silebilirsiniz. Şifreler şifrelenerek saklanır ve asla görünür olmaz.</p>
                </div>
            </div>

            {error && (
                <div className="bg-red-50 text-red-600 p-4 rounded-xl border border-red-100 flex items-center gap-3">
                    <AlertCircle className="w-5 h-5" />
                    <span>{error}</span>
                </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {passwords.map((pwd) => (
                    <div key={pwd.key} className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 flex flex-col relative overflow-hidden">
                        <div className="flex items-center justify-between mb-6">
                            <div className="flex items-center gap-3">
                                <div className={`p-3 rounded-xl ${pwd.isSet ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-500'}`}>
                                    <Key className="w-6 h-6" />
                                </div>
                                <div>
                                    <h3 className="text-lg font-bold text-gray-900">{pwd.key}</h3>
                                    <p className="text-sm text-gray-500">
                                        {pwd.isSet ? 'Durum: Aktif' : 'Durum: Ayarlanmadı'}
                                    </p>
                                </div>
                            </div>
                            {pwd.isSet && <CheckCircle className="w-6 h-6 text-green-500" />}
                        </div>

                        <div className="mb-6">
                            <label className="block text-sm font-medium text-gray-700 mb-1">Şifre Değeri</label>
                            <input 
                                type="password" 
                                disabled 
                                value={pwd.isSet ? '********' : ''} 
                                placeholder={pwd.isSet ? 'Gizli' : 'Tanımlanmadı'}
                                className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-gray-500 cursor-not-allowed"
                            />
                        </div>

                        <div className="mt-auto flex items-center gap-3">
                            {pwd.isSet ? (
                                <>
                                    <button
                                        onClick={() => openModal('update', pwd.key)}
                                        className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-primary-50 text-primary-600 font-medium rounded-lg hover:bg-primary-100 transition-colors"
                                    >
                                        <Edit2 className="w-4 h-4" />
                                        Güncelle
                                    </button>
                                    <button
                                        onClick={() => openModal('delete', pwd.key)}
                                        className="flex items-center justify-center gap-2 px-4 py-2 bg-red-50 text-red-600 font-medium rounded-lg hover:bg-red-100 transition-colors"
                                        title="Sil"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                </>
                            ) : (
                                <button
                                    onClick={() => openModal('set', pwd.key)}
                                    className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-primary-600 text-white font-medium rounded-lg hover:bg-primary-700 transition-colors"
                                >
                                    <Plus className="w-4 h-4" />
                                    Şifre Belirle
                                </button>
                            )}
                        </div>
                    </div>
                ))}
            </div>

            {/* Modal */}
            {modalConfig.isOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
                    <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6">
                        <div className="mb-6">
                            <h3 className="text-xl font-bold text-gray-900 mb-2">
                                {modalConfig.type === 'delete' ? `${modalConfig.key} Silinecek` : `${modalConfig.key} ${modalConfig.type === 'update' ? 'Güncelle' : 'Belirle'}`}
                            </h3>
                            <p className="text-sm text-gray-500">
                                {modalConfig.type === 'delete'
                                    ? 'Bu şifreyi silmek istediğinize emin misiniz? Bu işlem geri alınamaz.'
                                    : 'Lütfen belirlemek istediğiniz şifreyi girin. Şifreler güvenli olarak saklanacaktır.'}
                            </p>
                        </div>

                        {modalConfig.type !== 'delete' && (
                            <div className="mb-6">
                                <label className="block text-sm font-medium text-gray-700 mb-2">Yeni Şifre</label>
                                <input
                                    type="password"
                                    autoFocus
                                    value={inputValue}
                                    onChange={(e) => setInputValue(e.target.value)}
                                    placeholder="••••••••"
                                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors"
                                />
                            </div>
                        )}

                        <div className="flex items-center gap-3">
                            <button
                                onClick={closeModal}
                                disabled={isSubmitting}
                                className="flex-1 px-4 py-2.5 text-gray-700 font-medium bg-gray-100 hover:bg-gray-200 rounded-xl transition-colors disabled:opacity-50"
                            >
                                İptal
                            </button>
                            <button
                                onClick={handleConfirm}
                                disabled={isSubmitting || (modalConfig.type !== 'delete' && !inputValue.trim())}
                                className={`flex-1 px-4 py-2.5 text-white font-medium rounded-xl transition-colors disabled:opacity-50 flex justify-center items-center ${
                                    modalConfig.type === 'delete' ? 'bg-red-600 hover:bg-red-700' : 'bg-primary-600 hover:bg-primary-700'
                                }`}
                            >
                                {isSubmitting ? (
                                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                ) : (
                                    modalConfig.type === 'delete' ? 'Evet, Sil' : 'Kaydet'
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AdminPasswordsPage;
