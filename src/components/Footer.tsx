import React from 'react';
import { Link } from 'react-router-dom';
import { Mail, Phone, ExternalLink } from 'lucide-react';

export const Footer: React.FC = () => {
    return (
        <footer className="bg-white border-t border-gray-200 mt-auto">
            <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 py-12">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    {/* Brand */}
                    <div className="space-y-4">
                        <Link to="/" className="flex items-center gap-2">
                            <div className="bg-primary-600 text-white p-2 rounded-lg">
                                <span className="font-bold text-xl">✂️</span>
                            </div>
                            <span className="text-2xl font-bold bg-gradient-to-r from-primary-700 to-primary-500 bg-clip-text text-transparent">
                                Kuaförüm
                            </span>
                        </Link>
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
                                <a href="mailto:admin@kuaforum.com" className="hover:text-primary-600 transition-colors">
                                    admin@kuaforum.com
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
                    <p>&copy; {new Date().getFullYear()} Kuaförüm. Tüm hakları saklıdır.</p>
                    <div className="flex gap-4 mt-4 md:mt-0">
                        <a href="#" className="hover:text-gray-900">Gizlilik Politikası</a>
                        <a href="#" className="hover:text-gray-900">Kullanım Şartları</a>
                    </div>
                </div>
            </div>
        </footer>
    );
};
