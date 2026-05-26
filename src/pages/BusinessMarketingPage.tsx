import React from 'react';
import { Link } from 'react-router-dom';
import { 
    Store, Calendar, BellRing, Users, MapPin, 
    CheckCircle2, TrendingUp, Sparkles, ChevronRight,
    Smartphone, BarChart3, Clock
} from 'lucide-react';

export const BusinessMarketingPage: React.FC = () => {
    return (
        <div className="min-h-screen bg-white">
            {/* HERO SECTION */}
            <section className="relative overflow-hidden bg-slate-900 text-white pt-20 pb-24 sm:pt-28 sm:pb-32">
                <div className="absolute inset-0 overflow-hidden">
                    <div className="absolute -top-1/2 -right-1/4 w-[1000px] h-[1000px] rounded-full bg-primary-600/20 blur-3xl" />
                    <div className="absolute -bottom-1/2 -left-1/4 w-[800px] h-[800px] rounded-full bg-indigo-600/20 blur-3xl" />
                </div>
                
                <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center animate-in fade-in slide-in-from-bottom-8 duration-1000">
                    <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 border border-white/20 mb-8 backdrop-blur-md">
                        <Sparkles className="w-4 h-4 text-primary-400" />
                        <span className="text-sm font-medium text-primary-50">Kuaforum İş Ortaklığı Programı</span>
                    </div>
                    
                    <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight mb-6 leading-tight">
                        İşletmenizi Dijitale Taşıyın,<br className="hidden sm:block" />
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary-400 to-indigo-400">
                            Müşterilerinizi İkiye Katlayın
                        </span>
                    </h1>
                    
                    <p className="mt-4 text-lg sm:text-xl text-slate-300 max-w-2xl mx-auto mb-10 leading-relaxed">
                        Kuaforum ile 7/24 randevu alın, otomatik SMS'ler gönderin ve işletmenizi binlerce yeni müşteriye ulaştırın. Salon yönetimini zahmetsiz hale getirin.
                    </p>
                    
                    <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
                        <Link to="/apply-salon">
                            <button className="w-full sm:w-auto px-8 py-4 bg-primary-600 hover:bg-primary-500 text-white rounded-2xl font-bold text-lg transition-all shadow-[0_0_40px_-10px_rgba(255,255,255,0.3)] hover:shadow-[0_0_60px_-15px_rgba(255,255,255,0.5)] flex items-center justify-center gap-2 group">
                                Hemen Ücretsiz Başvur
                                <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                            </button>
                        </Link>
                        <a href="#ozellikler" className="w-full sm:w-auto px-8 py-4 bg-white/5 hover:bg-white/10 border border-white/10 text-white rounded-2xl font-semibold text-lg transition-all flex items-center justify-center">
                            Özellikleri Keşfet
                        </a>
                    </div>
                    
                    <div className="mt-12 flex flex-wrap justify-center gap-6 text-sm text-slate-400 font-medium">
                        <div className="flex items-center gap-2">
                            <CheckCircle2 className="w-5 h-5 text-green-400" />
                            <span>Ücretsiz Kurulum</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <CheckCircle2 className="w-5 h-5 text-green-400" />
                            <span>Sınırsız Randevu</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <CheckCircle2 className="w-5 h-5 text-green-400" />
                            <span>7/24 Destek</span>
                        </div>
                    </div>
                </div>
            </section>

            {/* STATS SECTION */}
            <section className="py-12 bg-gray-50 border-b border-gray-100">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
                        <div className="text-center">
                            <div className="text-4xl font-extrabold text-primary-600 mb-2">%40</div>
                            <div className="text-sm font-medium text-gray-600">Daha Fazla Randevu</div>
                        </div>
                        <div className="text-center">
                            <div className="text-4xl font-extrabold text-indigo-600 mb-2">7/24</div>
                            <div className="text-sm font-medium text-gray-600">Kesintisiz Rezervasyon</div>
                        </div>
                        <div className="text-center">
                            <div className="text-4xl font-extrabold text-rose-500 mb-2">%90</div>
                            <div className="text-sm font-medium text-gray-600">Daha Az Randevu İptali</div>
                        </div>
                        <div className="text-center">
                            <div className="text-4xl font-extrabold text-teal-600 mb-2">0</div>
                            <div className="text-sm font-medium text-gray-600">Telefon Karmaşası</div>
                        </div>
                    </div>
                </div>
            </section>

            {/* FEATURES GRID */}
            <section id="ozellikler" className="py-24">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="text-center max-w-3xl mx-auto mb-16">
                        <h2 className="text-3xl font-bold text-gray-900 mb-4">İşletmeniz İçin Her Şeyi Düşündük</h2>
                        <p className="text-lg text-gray-600">
                            Modern bir salon yönetimi için ihtiyacınız olan tüm araçlar tek bir platformda toplandı. Kuaforum ile zaman kazanın, müşteri memnuniyetini artırın.
                        </p>
                    </div>

                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
                        {/* Feature 1 */}
                        <div className="bg-white p-8 rounded-3xl border border-gray-100 shadow-xl shadow-gray-200/40 hover:-translate-y-2 transition-transform duration-300">
                            <div className="w-14 h-14 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center mb-6">
                                <Store className="w-7 h-7" />
                            </div>
                            <h3 className="text-xl font-bold text-gray-900 mb-3">Pazaryeri Görünürlüğü</h3>
                            <p className="text-gray-600 leading-relaxed">
                                Şehrinizdeki yeni müşterilere ulaşın. Salonunuz Kuaforum vitrininde yerini alsın, potansiyel müşteriler sizi anında keşfetsin.
                            </p>
                        </div>

                        {/* Feature 2 */}
                        <div className="bg-white p-8 rounded-3xl border border-gray-100 shadow-xl shadow-gray-200/40 hover:-translate-y-2 transition-transform duration-300">
                            <div className="w-14 h-14 bg-primary-50 text-primary-600 rounded-2xl flex items-center justify-center mb-6">
                                <Calendar className="w-7 h-7" />
                            </div>
                            <h3 className="text-xl font-bold text-gray-900 mb-3">Kolay Randevu Takvimi</h3>
                            <p className="text-gray-600 leading-relaxed">
                                Akıllı takvim ile randevuları saniyeler içinde yönetin. Boş saatlerinizi otomatik doldurun, telefon trafiğinden tamamen kurtulun.
                            </p>
                        </div>

                        {/* Feature 3 */}
                        <div className="bg-white p-8 rounded-3xl border border-gray-100 shadow-xl shadow-gray-200/40 hover:-translate-y-2 transition-transform duration-300">
                            <div className="w-14 h-14 bg-orange-50 text-orange-600 rounded-2xl flex items-center justify-center mb-6">
                                <BellRing className="w-7 h-7" />
                            </div>
                            <h3 className="text-xl font-bold text-gray-900 mb-3">Otomatik SMS Bildirimleri</h3>
                            <p className="text-gray-600 leading-relaxed">
                                Müşterilerinize randevu onayı ve hatırlatma SMS'leri otomatik gitsin. İptalleri ve "gelmeyen müşteri" (No-Show) oranını sıfıra indirin.
                            </p>
                        </div>

                        {/* Feature 4 */}
                        <div className="bg-white p-8 rounded-3xl border border-gray-100 shadow-xl shadow-gray-200/40 hover:-translate-y-2 transition-transform duration-300">
                            <div className="w-14 h-14 bg-purple-50 text-purple-600 rounded-2xl flex items-center justify-center mb-6">
                                <Users className="w-7 h-7" />
                            </div>
                            <h3 className="text-xl font-bold text-gray-900 mb-3">Personel Yönetimi</h3>
                            <p className="text-gray-600 leading-relaxed">
                                Çalışanlarınızın çalışma saatlerini, izinlerini ve hizmetlerini kendi özel panellerinden yönetmelerine olanak tanıyın.
                            </p>
                        </div>

                        {/* Feature 5 */}
                        <div className="bg-white p-8 rounded-3xl border border-gray-100 shadow-xl shadow-gray-200/40 hover:-translate-y-2 transition-transform duration-300">
                            <div className="w-14 h-14 bg-teal-50 text-teal-600 rounded-2xl flex items-center justify-center mb-6">
                                <MapPin className="w-7 h-7" />
                            </div>
                            <h3 className="text-xl font-bold text-gray-900 mb-3">Konum ve Harita Erişimi</h3>
                            <p className="text-gray-600 leading-relaxed">
                                Harita entegrasyonu sayesinde yakınlardaki müşteriler sizi kolayca bulsun. Konum bazlı aramalarda üst sıralara çıkın.
                            </p>
                        </div>

                        {/* Feature 6 */}
                        <div className="bg-white p-8 rounded-3xl border border-gray-100 shadow-xl shadow-gray-200/40 hover:-translate-y-2 transition-transform duration-300">
                            <div className="w-14 h-14 bg-rose-50 text-rose-600 rounded-2xl flex items-center justify-center mb-6">
                                <BarChart3 className="w-7 h-7" />
                            </div>
                            <h3 className="text-xl font-bold text-gray-900 mb-3">Gelişmiş İstatistikler</h3>
                            <p className="text-gray-600 leading-relaxed">
                                İşletmenizin gelirini, en popüler hizmetleri ve personel performanslarını gelişmiş grafiklerle anlık olarak takip edin.
                            </p>
                        </div>
                    </div>
                </div>
            </section>

            {/* HOW IT WORKS */}
            <section className="py-24 bg-slate-900 text-white overflow-hidden relative">
                <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-primary-600/10 rounded-full blur-3xl" />
                
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
                    <div className="text-center mb-16">
                        <h2 className="text-3xl font-bold mb-4">Nasıl Başlarım?</h2>
                        <p className="text-gray-400 text-lg">Sadece 3 adımda işletmenizi dijitale taşıyın.</p>
                    </div>

                    <div className="grid md:grid-cols-3 gap-12 relative">
                        {/* Connecting Line */}
                        <div className="hidden md:block absolute top-12 left-[15%] right-[15%] h-0.5 bg-gradient-to-r from-slate-800 via-primary-500 to-slate-800" />
                        
                        {/* Step 1 */}
                        <div className="relative flex flex-col items-center text-center">
                            <div className="w-24 h-24 rounded-full bg-slate-800 border-4 border-slate-900 flex items-center justify-center z-10 mb-6 shadow-xl">
                                <Smartphone className="w-10 h-10 text-primary-400" />
                            </div>
                            <h3 className="text-xl font-bold mb-2">1. Başvurunuzu Yapın</h3>
                            <p className="text-slate-400">Ücretsiz formumuzu doldurarak salon profilinizi saniyeler içinde oluşturun.</p>
                        </div>

                        {/* Step 2 */}
                        <div className="relative flex flex-col items-center text-center">
                            <div className="w-24 h-24 rounded-full bg-slate-800 border-4 border-slate-900 flex items-center justify-center z-10 mb-6 shadow-xl">
                                <TrendingUp className="w-10 h-10 text-indigo-400" />
                            </div>
                            <h3 className="text-xl font-bold mb-2">2. Kurulumu Tamamlayın</h3>
                            <p className="text-slate-400">Personellerinizi, çalışma saatlerinizi ve hizmetlerinizi fiyatlarıyla birlikte ekleyin.</p>
                        </div>

                        {/* Step 3 */}
                        <div className="relative flex flex-col items-center text-center">
                            <div className="w-24 h-24 rounded-full bg-slate-800 border-4 border-slate-900 flex items-center justify-center z-10 mb-6 shadow-xl">
                                <Clock className="w-10 h-10 text-emerald-400" />
                            </div>
                            <h3 className="text-xl font-bold mb-2">3. Randevuları Yönetin</h3>
                            <p className="text-slate-400">Artık hazırsınız! Yeni müşterilerinizi karşılayın ve randevularınızı otomatikleştirin.</p>
                        </div>
                    </div>
                </div>
            </section>

            {/* CTA SECTION */}
            <section className="py-24 bg-white relative overflow-hidden">
                <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
                    <div className="bg-gradient-to-br from-primary-600 to-indigo-700 rounded-[3rem] p-8 sm:p-16 text-center text-white shadow-2xl shadow-primary-900/20">
                        <h2 className="text-3xl sm:text-4xl font-bold mb-6">İşletmenizi Büyütmeye Hazır Mısınız?</h2>
                        <p className="text-primary-100 text-lg mb-10 max-w-2xl mx-auto">
                            Bugün Kuaforum ailesine katılın, modern salon yönetimi ile tanışın. İlk 30 gün boyunca hiçbir ek ücret ödemeden tüm özellikleri deneyin.
                        </p>
                        <Link to="/apply-salon">
                            <button className="px-10 py-5 bg-white text-primary-700 hover:bg-gray-50 rounded-2xl font-bold text-lg transition-transform hover:scale-105 shadow-xl flex items-center gap-2 mx-auto">
                                Ücretsiz Profil Oluştur
                                <ChevronRight className="w-5 h-5" />
                            </button>
                        </Link>
                    </div>
                </div>
            </section>
        </div>
    );
};
