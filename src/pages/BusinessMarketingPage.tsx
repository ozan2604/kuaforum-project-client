import React from 'react';
import { Link } from 'react-router-dom';
import { 
    Store, Calendar, BellRing, Users, MapPin, 
    CheckCircle2, TrendingUp, Sparkles, ChevronRight,
    Smartphone, BarChart3, Clock, ShieldCheck, HeartHandshake
} from 'lucide-react';

export const BusinessMarketingPage: React.FC = () => {
    return (
        <div className="min-h-screen bg-slate-50 font-sans text-slate-800">
            {/* HERO SECTION - CLEAN & LIGHT */}
            <section className="relative overflow-hidden bg-white border-b border-slate-100 pt-20 pb-24 sm:pt-32 sm:pb-36">
                <div className="absolute inset-0 overflow-hidden pointer-events-none">
                    {/* Subtle professional background accents */}
                    <div className="absolute -top-1/2 -right-1/4 w-[800px] h-[800px] rounded-full bg-primary-50/50 blur-3xl" />
                    <div className="absolute -bottom-1/2 -left-1/4 w-[600px] h-[600px] rounded-full bg-slate-50/50 blur-3xl" />
                </div>
                
                <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center animate-in fade-in slide-in-from-bottom-8 duration-1000">
                    <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary-50 border border-primary-100 mb-8">
                        <Sparkles className="w-4 h-4 text-primary-600" />
                        <span className="text-sm font-semibold text-primary-700">SALONBİR İş Ortaklığı Programı</span>
                    </div>
                    
                    <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight mb-6 leading-tight text-slate-900">
                        İşletmenizi Dijitale Taşıyın,<br className="hidden sm:block" />
                        <span className="text-primary-600">
                            Müşterilerinizi İkiye Katlayın
                        </span>
                    </h1>
                    
                    <p className="mt-4 text-lg sm:text-xl text-slate-600 max-w-2xl mx-auto mb-10 leading-relaxed">
                        SALONBİR ile randevularınızı dijitalleştirin, müşteri portföyünüzü genişletin ve salon yönetiminizi tek bir ekrandan profesyonelce yapın.
                    </p>
                    
                    <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
                        <Link to="/apply-salon">
                            <button className="w-full sm:w-auto px-8 py-4 bg-primary-600 hover:bg-primary-700 text-white rounded-xl font-bold text-lg transition-all shadow-lg shadow-primary-600/20 hover:shadow-xl hover:shadow-primary-600/30 flex items-center justify-center gap-2 group">
                                Hemen Ücretsiz Başvur
                                <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                            </button>
                        </Link>
                        <a href="#ozellikler" className="w-full sm:w-auto px-8 py-4 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 rounded-xl font-semibold text-lg transition-all flex items-center justify-center shadow-sm">
                            Özellikleri Keşfet
                        </a>
                    </div>
                    
                    <div className="mt-12 flex flex-wrap justify-center gap-8 text-sm text-slate-600 font-medium">
                        <div className="flex items-center gap-2">
                            <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                            <span>Ücretsiz Profil Kurulumu</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                            <span>Kesintisiz Kullanım</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                            <span>Profesyonel Destek</span>
                        </div>
                    </div>
                </div>
            </section>

            {/* REALISTIC BENEFITS SECTION */}
            <section className="py-16 bg-white border-b border-slate-100">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center divide-y md:divide-y-0 md:divide-x divide-slate-100">
                        <div className="p-4">
                            <div className="mx-auto w-12 h-12 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center mb-4">
                                <ShieldCheck className="w-6 h-6" />
                            </div>
                            <h3 className="text-xl font-bold text-slate-900 mb-2">Güvenilir Altyapı</h3>
                            <p className="text-slate-600 text-sm">Tüm müşteri ve randevu verileriniz güvenle saklanır, veri kaybı yaşamazsınız.</p>
                        </div>
                        <div className="p-4">
                            <div className="mx-auto w-12 h-12 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center mb-4">
                                <TrendingUp className="w-6 h-6" />
                            </div>
                            <h3 className="text-xl font-bold text-slate-900 mb-2">Sürekli Büyüme</h3>
                            <p className="text-slate-600 text-sm">SALONBİR uygulamasında arama yapan yeni müşteriler tarafından kolayca keşfedilirsiniz.</p>
                        </div>
                        <div className="p-4">
                            <div className="mx-auto w-12 h-12 bg-rose-50 text-rose-600 rounded-full flex items-center justify-center mb-4">
                                <HeartHandshake className="w-6 h-6" />
                            </div>
                            <h3 className="text-xl font-bold text-slate-900 mb-2">Müşteri Sadakati</h3>
                            <p className="text-slate-600 text-sm">Otomatik hatırlatmalar ve profesyonel profiliniz ile müşteri memnuniyetini zirveye taşıyın.</p>
                        </div>
                    </div>
                </div>
            </section>

            {/* FEATURES GRID - CHIC & MINIMALIST */}
            <section id="ozellikler" className="py-24 bg-slate-50">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="text-center max-w-3xl mx-auto mb-16">
                        <h2 className="text-3xl font-bold text-slate-900 mb-4">İşletmeniz İçin Tasarlanmış Özellikler</h2>
                        <p className="text-lg text-slate-600">
                            Karmaşık sistemleri unutun. SALONBİR ile salon yönetimi artık çok daha kolay, şık ve anlaşılır.
                        </p>
                    </div>

                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
                        {/* Feature 1 */}
                        <div className="bg-white p-8 rounded-2xl border border-slate-100 hover:shadow-lg transition-all duration-300">
                            <div className="w-12 h-12 bg-slate-50 text-slate-700 rounded-xl flex items-center justify-center mb-6 border border-slate-100">
                                <Store className="w-6 h-6" />
                            </div>
                            <h3 className="text-xl font-bold text-slate-900 mb-3">Pazaryeri Görünürlüğü</h3>
                            <p className="text-slate-600 leading-relaxed text-sm">
                                Şehrinizdeki yeni müşterilere doğrudan ulaşın. Salonunuz SALONBİR vitrininde yerini alsın, görünürlüğünüz artsın.
                            </p>
                        </div>

                        {/* Feature 2 */}
                        <div className="bg-white p-8 rounded-2xl border border-slate-100 hover:shadow-lg transition-all duration-300">
                            <div className="w-12 h-12 bg-slate-50 text-slate-700 rounded-xl flex items-center justify-center mb-6 border border-slate-100">
                                <Calendar className="w-6 h-6" />
                            </div>
                            <h3 className="text-xl font-bold text-slate-900 mb-3">Akıllı Randevu Takvimi</h3>
                            <p className="text-slate-600 leading-relaxed text-sm">
                                Tüm randevuları saniyeler içinde yönetin. Çakışmaları önleyin, boş saatlerinizi doldurun ve telefon trafiğini hafifletin.
                            </p>
                        </div>

                        {/* Feature 3 */}
                        <div className="bg-white p-8 rounded-2xl border border-slate-100 hover:shadow-lg transition-all duration-300">
                            <div className="w-12 h-12 bg-slate-50 text-slate-700 rounded-xl flex items-center justify-center mb-6 border border-slate-100">
                                <BellRing className="w-6 h-6" />
                            </div>
                            <h3 className="text-xl font-bold text-slate-900 mb-3">Anlık Bildirimler</h3>
                            <p className="text-slate-600 leading-relaxed text-sm">
                                Müşterilerinize randevu öncesi otomatik hatırlatmalar gönderin. İptalleri ve randevuya gelmeme oranını minimuma indirin.
                            </p>
                        </div>

                        {/* Feature 4 */}
                        <div className="bg-white p-8 rounded-2xl border border-slate-100 hover:shadow-lg transition-all duration-300">
                            <div className="w-12 h-12 bg-slate-50 text-slate-700 rounded-xl flex items-center justify-center mb-6 border border-slate-100">
                                <Users className="w-6 h-6" />
                            </div>
                            <h3 className="text-xl font-bold text-slate-900 mb-3">Personel Yönetimi</h3>
                            <p className="text-slate-600 leading-relaxed text-sm">
                                Çalışanlarınızın mesai saatlerini, özel hizmetlerini ve performanslarını kendilerine ait özel panellerden kontrol edin.
                            </p>
                        </div>

                        {/* Feature 5 */}
                        <div className="bg-white p-8 rounded-2xl border border-slate-100 hover:shadow-lg transition-all duration-300">
                            <div className="w-12 h-12 bg-slate-50 text-slate-700 rounded-xl flex items-center justify-center mb-6 border border-slate-100">
                                <MapPin className="w-6 h-6" />
                            </div>
                            <h3 className="text-xl font-bold text-slate-900 mb-3">Konum Odaklı Keşif</h3>
                            <p className="text-slate-600 leading-relaxed text-sm">
                                Harita ve konum entegrasyonu sayesinde yakınlardaki potansiyel müşteriler, salonunuzu tek tıkla bulsun ve yol tarifi alsın.
                            </p>
                        </div>

                        {/* Feature 6 */}
                        <div className="bg-white p-8 rounded-2xl border border-slate-100 hover:shadow-lg transition-all duration-300">
                            <div className="w-12 h-12 bg-slate-50 text-slate-700 rounded-xl flex items-center justify-center mb-6 border border-slate-100">
                                <BarChart3 className="w-6 h-6" />
                            </div>
                            <h3 className="text-xl font-bold text-slate-900 mb-3">Hizmet ve Fiyat Yönetimi</h3>
                            <p className="text-slate-600 leading-relaxed text-sm">
                                Sunduğunuz hizmetleri kategorilendirin, sürelerini ve fiyatlarını şeffaf bir şekilde müşterilerinizle paylaşın.
                            </p>
                        </div>
                    </div>
                </div>
            </section>

            {/* HOW IT WORKS - CLEAN */}
            <section className="py-24 bg-white border-t border-slate-100">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="text-center mb-16">
                        <h2 className="text-3xl font-bold mb-4 text-slate-900">Nasıl Başlarım?</h2>
                        <p className="text-slate-600 text-lg">Sadece 3 adımda işletmenizi SALONBİR'e taşıyın.</p>
                    </div>

                    <div className="grid md:grid-cols-3 gap-12 relative">
                        {/* Connecting Line */}
                        <div className="hidden md:block absolute top-12 left-[15%] right-[15%] h-[1px] bg-slate-200" />
                        
                        {/* Step 1 */}
                        <div className="relative flex flex-col items-center text-center">
                            <div className="w-24 h-24 rounded-full bg-white border border-slate-200 flex items-center justify-center z-10 mb-6 shadow-sm">
                                <Smartphone className="w-10 h-10 text-primary-600" />
                            </div>
                            <h3 className="text-xl font-bold mb-2 text-slate-900">1. Profilinizi Oluşturun</h3>
                            <p className="text-slate-600 text-sm">Kayıt formunu doldurarak salonunuzun temel bilgilerini sisteme girin.</p>
                        </div>

                        {/* Step 2 */}
                        <div className="relative flex flex-col items-center text-center">
                            <div className="w-24 h-24 rounded-full bg-white border border-slate-200 flex items-center justify-center z-10 mb-6 shadow-sm">
                                <Store className="w-10 h-10 text-primary-600" />
                            </div>
                            <h3 className="text-xl font-bold mb-2 text-slate-900">2. Detayları Ekleyin</h3>
                            <p className="text-slate-600 text-sm">Personellerinizi, çalışma saatlerinizi, hizmet ve fiyatlarınızı belirleyin.</p>
                        </div>

                        {/* Step 3 */}
                        <div className="relative flex flex-col items-center text-center">
                            <div className="w-24 h-24 rounded-full bg-white border border-slate-200 flex items-center justify-center z-10 mb-6 shadow-sm">
                                <Clock className="w-10 h-10 text-primary-600" />
                            </div>
                            <h3 className="text-xl font-bold mb-2 text-slate-900">3. Randevu Almaya Başlayın</h3>
                            <p className="text-slate-600 text-sm">Artık hazırsınız! Dijital profiliniz üzerinden yeni randevular kabul edin.</p>
                        </div>
                    </div>
                </div>
            </section>

            {/* CTA SECTION - LIGHT */}
            <section className="py-24 bg-slate-50 relative overflow-hidden border-t border-slate-100">
                <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
                    <div className="bg-white rounded-3xl p-10 sm:p-16 text-center shadow-lg border border-slate-100">
                        <h2 className="text-3xl sm:text-4xl font-bold mb-6 text-slate-900">İşletmenizi Büyütmeye Hazır Mısınız?</h2>
                        <p className="text-slate-600 text-lg mb-10 max-w-2xl mx-auto">
                            Bugün SALONBİR'e katılın, modern salon yönetimi ile tanışın. Kayıt işlemi tamamen ücretsizdir.
                        </p>
                        <Link to="/apply-salon">
                            <button className="px-10 py-5 bg-primary-600 text-white hover:bg-primary-700 rounded-xl font-bold text-lg transition-transform hover:scale-105 shadow-md flex items-center gap-2 mx-auto">
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
