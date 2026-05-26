import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Mail, Phone, ExternalLink } from 'lucide-react';
import { LegalModal } from './LegalModal';
import { LEGAL_TEXTS } from '../constants/legal';

type ModalType = 'kvkk' | 'gizlilik' | 'cerez' | null;

export const Footer: React.FC = () => {
    const [openModal, setOpenModal] = useState<ModalType>(null);

    const modals: Record<Exclude<ModalType, null>, { title: string; content: string }> = {
        kvkk: { title: 'KVKK Aydınlatma Metni', content: LEGAL_TEXTS.KVKK_DETAILS },
        gizlilik: { title: 'Gizlilik Politikası', content: LEGAL_TEXTS.PRIVACY_POLICY },
        cerez: { title: 'Çerez Politikası', content: LEGAL_TEXTS.COOKIE_POLICY },
    };

    return (
        <>
            <footer className="bg-white border-t border-gray-200 mt-auto">
                <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 py-12">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                        {/* Brand */}
                        <div className="space-y-4">
                            <div className="overflow-hidden h-24 w-[130px] sm:w-[280px] relative -ml-2 sm:-ml-4">
                                <Link to="/" className="absolute inset-0 flex items-center justify-center group">
                                    <img
                                        src="/logo.png"
                                        alt="SALONBİR Logo"
                                        className="w-[130px] sm:w-[280px] max-w-none transition-transform duration-300 group-hover:scale-105"
                                    />
                                </Link>
                            </div>
                            <p className="text-gray-500 text-sm max-w-xs">
                                Güzelliğinize değer katmak için en iyi kuaför ve güzellik salonlarını sizlerle buluşturuyoruz.
                            </p>
                        </div>

                        {/* Quick Links */}
                        <div>
                            <h3 className="font-semibold text-gray-900 mb-4">Hızlı Bağlantılar</h3>
                            <ul className="space-y-3 text-sm text-gray-600">
                                <li>
                                    <Link to="/" className="hover:text-primary-600 transition-colors">Ana Sayfa</Link>
                                </li>
                                <li>
                                    <Link to="/isletmeler-icin" className="hover:text-primary-600 transition-colors">İşletmeler İçin</Link>
                                </li>
                                <li>
                                    <Link to="/login" className="hover:text-primary-600 transition-colors">Giriş Yap</Link>
                                </li>
                                <li>
                                    <Link to="/register" className="hover:text-primary-600 transition-colors">Kayıt Ol</Link>
                                </li>
                            </ul>
                        </div>

                        {/* Contact & Corporate */}
                        <div>
                            <h3 className="font-semibold text-gray-900 mb-4">İletişim & Kurumsal</h3>
                            <ul className="space-y-3 text-sm text-gray-600">
                                <li className="flex items-center gap-2">
                                    <Mail className="h-4 w-4 text-primary-500" />
                                    <a href="mailto:salonbir26@gmail.com" className="hover:text-primary-600 transition-colors">
                                        salonbir26@gmail.com
                                    </a>
                                </li>
                                <li className="flex items-center gap-2">
                                    <Phone className="h-4 w-4 text-primary-500" />
                                    <a href="tel:05317788504" className="hover:text-primary-600 transition-colors">
                                        0531 778 85 04
                                    </a>
                                </li>
                                <li className="pt-2">
                                    <Link
                                        to="/salon-basvurusu"
                                        className="inline-flex items-center gap-2 text-primary-700 hover:text-primary-800 font-medium transition-colors"
                                    >
                                        Salon Sahibi Başvurusu <ExternalLink className="h-4 w-4" />
                                    </Link>
                                </li>
                            </ul>
                        </div>
                    </div>

                    <div className="border-t border-gray-100 mt-12 pt-8 flex flex-col md:flex-row justify-between items-center text-sm text-gray-500">
                        <p>&copy; {new Date().getFullYear()} SALONBİR. Tüm hakları saklıdır.</p>
                        <div className="flex flex-wrap justify-center gap-4 mt-4 md:mt-0">
                            <button onClick={() => setOpenModal('kvkk')} className="hover:text-gray-900 transition-colors">
                                KVKK Aydınlatma Metni
                            </button>
                            <button onClick={() => setOpenModal('gizlilik')} className="hover:text-gray-900 transition-colors">
                                Gizlilik Politikası
                            </button>
                            <button onClick={() => setOpenModal('cerez')} className="hover:text-gray-900 transition-colors">
                                Çerez Politikası
                            </button>
                        </div>
                    </div>
                </div>
            </footer>

            {openModal && (
                <LegalModal
                    isOpen={true}
                    onClose={() => setOpenModal(null)}
                    title={modals[openModal].title}
                    content={modals[openModal].content}
                />
            )}
        </>
    );
};
