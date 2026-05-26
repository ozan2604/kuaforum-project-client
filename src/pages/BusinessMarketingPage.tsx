import React from 'react';
import { Link } from 'react-router-dom';
import { 
    Store, Calendar, BellRing, Users, MapPin, 
    CheckCircle2, TrendingUp, Sparkles, ChevronRight,
    Smartphone, BarChart3, Clock, ShieldCheck, HeartHandshake,
    MessageSquare
} from 'lucide-react';

export const BusinessMarketingPage: React.FC = () => {
    return (
        <div className="min-h-screen bg-slate-50 font-sans text-slate-800">
            {/* HERO SECTION - CHIC & COLORFUL */}
            <section className="relative overflow-hidden bg-white border-b border-slate-100 pt-20 pb-24 sm:pt-32 sm:pb-36">
                <div className="absolute inset-0 overflow-hidden pointer-events-none">
                    {/* Subtle professional background accents with secondary (Rose) and primary (Slate) */}
                    <div className="absolute -top-1/2 -right-1/4 w-[800px] h-[800px] rounded-full bg-secondary-50/60 blur-3xl" />
                    <div className="absolute -bottom-1/2 -left-1/4 w-[600px] h-[600px] rounded-full bg-slate-50/80 blur-3xl" />
                </div>
                
                <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center animate-in fade-in slide-in-from-bottom-8 duration-1000">
                    <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-secondary-50 border border-secondary-100 mb-8">
                        <Sparkles className="w-4 h-4 text-secondary-600" />
                        <span className="text-sm font-semibold text-secondary-700">SALONBİR İş Ortaklığı Programı</span>
                    </div>
                    
                    <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight mb-6 leading-tight text-slate-900 mx-auto max-w-4xl">
                        Salon Yönetiminde Yeni Dönem:<br className="hidden sm:block" />
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-secondary-500 to-secondary-700">
                            Dijitale Taşıyın, Hızla Büyüyün
                        </span>
                    </h1>
                    
                    <p className="mt-4 text-lg sm:text-xl text-slate-600 max-w-2xl mx-auto mb-10 leading-relaxed px-2">
                        Pazaryeri erişimi, 7/24 otomatik randevu alımı ve SMS hatırlatmaları ile salonunuzu tek bir ekrandan profesyonelce yönetin.
                    </p>
                    
                    <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
                        <Link to="/apply-salon">
                            <button className="w-full sm:w-auto px-8 py-4 bg-secondary-600 hover:bg-secondary-700 text-white rounded-xl font-bold text-lg transition-all shadow-lg shadow-secondary-600/20 hover:shadow-xl hover:shadow-secondary-600/30 flex items-center justify-center gap-2 group">
                                Hemen Ücretsiz Başvur
                                <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                            </button>
                        </Link>
                        <a href="#ozellikler" className="w-full sm:w-auto px-8 py-4 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 rounded-xl font-semibold text-lg transition-all flex items-center justify-center shadow-sm hover:border-slate-300">
                            Özellikleri Keşfet
                        </a>
                    </div>
                    
                    <div className="mt-12 flex flex-wrap justify-center gap-6 sm:gap-8 text-sm text-slate-600 font-medium">
                        <div className="flex items-center gap-2">
                            <CheckCircle2 className="w-5 h-5 text-secondary-500" />
                            <span>Ücretsiz Profil Kurulumu</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <CheckCircle2 className="w-5 h-5 text-secondary-500" />
                            <span>7/24 Randevu</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <CheckCircle2 className="w-5 h-5 text-secondary-500" />
                            <span>SMS Bildirimleri</span>
                        </div>
                    </div>
                </div>
            </section>

            {/* REALISTIC BENEFITS SECTION - HIGHLIGHTING THE SYSTEM */}
            <section className="py-16 bg-white border-b border-slate-100">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center divide-y md:divide-y-0 md:divide-x divide-slate-100">
                        <div className="p-4 sm:px-8 hover:-translate-y-1 transition-transform duration-300">
                            <div className="mx-auto w-16 h-16 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center mb-5 shadow-sm border border-blue-100">
                                <MapPin className="w-8 h-8" />
                            </div>
                            <h3 className="text-xl font-bold text-slate-900 mb-3">Pazaryeri Görünürlüğü</h3>
                            <p className="text-slate-600 text-sm leading-relaxed">
                                Sadece var olan müşterilerinize değil, SALONBİR üzerinden çevrenizdeki yeni kitlelere de doğrudan ulaşın ve keşfedilin.
                            </p>
                        </div>
                        <div className="p-4 sm:px-8 hover:-translate-y-1 transition-transform duration-300">
                            <div className="mx-auto w-16 h-16 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center mb-5 shadow-sm border border-emerald-100">
                                <Clock className="w-8 h-8" />
                            </div>
                            <h3 className="text-xl font-bold text-slate-900 mb-3">7/24 Randevu Kabulü</h3>
                            <p className="text-slate-600 text-sm leading-relaxed">
                                Siz uyurken veya çalışırken randevularınız otomatik dolsun. Telefon trafiğine son vererek tamamen işinize odaklanın.
                            </p>
                        </div>
                        <div className="p-4 sm:px-8 hover:-translate-y-1 transition-transform duration-300">
                            <div className="mx-auto w-16 h-16 bg-secondary-50 text-secondary-600 rounded-2xl flex items-center justify-center mb-5 shadow-sm border border-secondary-100">
                                <MessageSquare className="w-8 h-8" />
                            </div>
                            <h3 className="text-xl font-bold text-slate-900 mb-3">Otomatik SMS Sistemi</h3>
                            <p className="text-slate-600 text-sm leading-relaxed">
                                Randevu onayları ve hatırlatmaları SMS ile otomatik gitsin. İptalleri ve unutulmaları engelleyerek gelirinizi koruyun.
                            </p>
                        </div>
                    </div>
                </div>
            </section>

            {/* FEATURES GRID - CHIC & COLORFUL */}
            <section id="ozellikler" className="py-24 bg-slate-50 relative">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
                    <div className="text-center max-w-3xl mx-auto mb-16">
                        <h2 className="text-3xl sm:text-4xl font-bold text-slate-900 mb-5">
                            İşletmeniz İçin <span className="text-secondary-600">Akıllı Çözümler</span>
                        </h2>
                        <p className="text-lg text-slate-600">
                            Geleneksel yöntemleri geride bırakın. SALONBİR ile salon yönetimi profesyonel, şık ve çok daha kolay.
                        </p>
                    </div>

                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
                        {/* Feature 1 */}
                        <div className="bg-white p-8 rounded-2xl border border-slate-100 shadow-sm hover:shadow-xl hover:border-secondary-100 transition-all duration-300 group">
                            <div className="w-14 h-14 bg-slate-50 text-slate-700 group-hover:bg-secondary-50 group-hover:text-secondary-600 rounded-xl flex items-center justify-center mb-6 border border-slate-100 transition-colors">
                                <Calendar className="w-7 h-7" />
                            </div>
                            <h3 className="text-xl font-bold text-slate-900 mb-3">Akıllı Takvim & Yönetim</h3>
                            <p className="text-slate-600 leading-relaxed text-sm">
                                Tüm randevuları tek bir takvim üzerinden saniyeler içinde yönetin. Çakışmaları akıllı sistemle önleyin.
                            </p>
                        </div>

                        {/* Feature 2 */}
                        <div className="bg-white p-8 rounded-2xl border border-slate-100 shadow-sm hover:shadow-xl hover:border-secondary-100 transition-all duration-300 group">
                            <div className="w-14 h-14 bg-slate-50 text-slate-700 group-hover:bg-secondary-50 group-hover:text-secondary-600 rounded-xl flex items-center justify-center mb-6 border border-slate-100 transition-colors">
                                <BellRing className="w-7 h-7" />
                            </div>
                            <h3 className="text-xl font-bold text-slate-900 mb-3">Randevu Hatırlatmaları</h3>
                            <p className="text-slate-600 leading-relaxed text-sm">
                                Müşterilerinize yaklaşan randevuları için otomatik bildirimler gönderin, randevuya gelmeme oranını sıfıra indirin.
                            </p>
                        </div>

                        {/* Feature 3 */}
                        <div className="bg-white p-8 rounded-2xl border border-slate-100 shadow-sm hover:shadow-xl hover:border-secondary-100 transition-all duration-300 group">
                            <div className="w-14 h-14 bg-slate-50 text-slate-700 group-hover:bg-secondary-50 group-hover:text-secondary-600 rounded-xl flex items-center justify-center mb-6 border border-slate-100 transition-colors">
                                <Users className="w-7 h-7" />
                            </div>
                            <h3 className="text-xl font-bold text-slate-900 mb-3">Personel Asistanı</h3>
                            <p className="text-slate-600 leading-relaxed text-sm">
                                Her çalışanın kendi paneli olsun. Mesai saatlerini, kişisel takvimlerini ve performanslarını kolayca takip edin.
                            </p>
                        </div>

                        {/* Feature 4 */}
                        <div className="bg-white p-8 rounded-2xl border border-slate-100 shadow-sm hover:shadow-xl hover:border-secondary-100 transition-all duration-300 group">
                            <div className="w-14 h-14 bg-slate-50 text-slate-700 group-hover:bg-secondary-50 group-hover:text-secondary-600 rounded-xl flex items-center justify-center mb-6 border border-slate-100 transition-colors">
                                <BarChart3 className="w-7 h-7" />
                            </div>
                            <h3 className="text-xl font-bold text-slate-900 mb-3">Hizmet ve Fiyat Portföyü</h3>
                            <p className="text-slate-600 leading-relaxed text-sm">
                                Sunduğunuz hizmetleri şık bir listeyle sunun, fiyatları ve süreleri şeffaf bir şekilde müşterilerinizle paylaşın.
                            </p>
                        </div>
                        
                        {/* Feature 5 */}
                        <div className="bg-white p-8 rounded-2xl border border-slate-100 shadow-sm hover:shadow-xl hover:border-secondary-100 transition-all duration-300 group">
                            <div className="w-14 h-14 bg-slate-50 text-slate-700 group-hover:bg-secondary-50 group-hover:text-secondary-600 rounded-xl flex items-center justify-center mb-6 border border-slate-100 transition-colors">
                                <HeartHandshake className="w-7 h-7" />
                            </div>
                            <h3 className="text-xl font-bold text-slate-900 mb-3">Müşteri Sadakati</h3>
                            <p className="text-slate-600 leading-relaxed text-sm">
                                Profesyonel iletişim, SMS bildirimleri ve kolay randevu süreci ile ilk kez gelen müşteriyi müdavime dönüştürün.
                            </p>
                        </div>
                        
                        {/* Feature 6 */}
                        <div className="bg-white p-8 rounded-2xl border border-slate-100 shadow-sm hover:shadow-xl hover:border-secondary-100 transition-all duration-300 group">
                            <div className="w-14 h-14 bg-slate-50 text-slate-700 group-hover:bg-secondary-50 group-hover:text-secondary-600 rounded-xl flex items-center justify-center mb-6 border border-slate-100 transition-colors">
                                <ShieldCheck className="w-7 h-7" />
                            </div>
                            <h3 className="text-xl font-bold text-slate-900 mb-3">Güvenli Veri Altyapısı</h3>
                            <p className="text-slate-600 leading-relaxed text-sm">
                                İşletme verileriniz, müşteri bilgileriniz ve randevu geçmişiniz güvenli sunucularımızda eksiksiz şekilde yedeklenir.
                            </p>
                        </div>
                    </div>
                </div>
            </section>

            {/* HOW IT WORKS - CLEAN */}
            <section className="py-24 bg-white border-t border-slate-100">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="text-center mb-16">
                        <h2 className="text-3xl font-bold mb-4 text-slate-900">Sadece 3 Adımda Başlayın</h2>
                        <p className="text-slate-600 text-lg">Platforma katılmak hiç bu kadar kolay olmamıştı.</p>
                    </div>

                    <div className="grid md:grid-cols-3 gap-12 relative">
                        {/* Connecting Line */}
                        <div className="hidden md:block absolute top-12 left-[15%] right-[15%] h-[2px] bg-slate-100" />
                        
                        {/* Step 1 */}
                        <div className="relative flex flex-col items-center text-center">
                            <div className="w-24 h-24 rounded-2xl bg-white border-2 border-slate-100 flex items-center justify-center z-10 mb-6 shadow-sm hover:border-secondary-300 transition-colors">
                                <Smartphone className="w-10 h-10 text-secondary-500" />
                            </div>
                            <h3 className="text-xl font-bold mb-3 text-slate-900">1. İşletmenizi Kaydedin</h3>
                            <p className="text-slate-600 text-sm leading-relaxed px-4">Temel bilgilerinizi girerek saniyeler içinde işletme profilinizi oluşturun.</p>
                        </div>

                        {/* Step 2 */}
                        <div className="relative flex flex-col items-center text-center">
                            <div className="w-24 h-24 rounded-2xl bg-white border-2 border-slate-100 flex items-center justify-center z-10 mb-6 shadow-sm hover:border-secondary-300 transition-colors">
                                <Store className="w-10 h-10 text-secondary-500" />
                            </div>
                            <h3 className="text-xl font-bold mb-3 text-slate-900">2. Vitrininizi Hazırlayın</h3>
                            <p className="text-slate-600 text-sm leading-relaxed px-4">Hizmetlerinizi, fiyatlarınızı ve personellerinizi ekleyerek salonunuzu dijitale taşıyın.</p>
                        </div>

                        {/* Step 3 */}
                        <div className="relative flex flex-col items-center text-center">
                            <div className="w-24 h-24 rounded-2xl bg-white border-2 border-slate-100 flex items-center justify-center z-10 mb-6 shadow-sm hover:border-secondary-300 transition-colors">
                                <TrendingUp className="w-10 h-10 text-secondary-500" />
                            </div>
                            <h3 className="text-xl font-bold mb-3 text-slate-900">3. Büyümeye Başlayın</h3>
                            <p className="text-slate-600 text-sm leading-relaxed px-4">Yeni müşterilerle tanışın, online randevular alın ve gelirinizi artırın.</p>
                        </div>
                    </div>
                </div>
            </section>

            {/* CTA SECTION - COLORFUL ACCENT */}
            <section className="py-24 bg-slate-50 relative overflow-hidden border-t border-slate-100">
                <div className="absolute inset-0 bg-secondary-900 opacity-[0.03] pattern-grid-lg" />
                <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
                    <div className="bg-white rounded-[2rem] p-10 sm:p-16 text-center shadow-xl border border-secondary-100/50 relative overflow-hidden">
                        <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-secondary-400 to-secondary-600" />
                        
                        <h2 className="text-3xl sm:text-4xl font-extrabold mb-6 text-slate-900">İşletmenizi Büyütmeye Hazır Mısınız?</h2>
                        <p className="text-slate-600 text-lg mb-10 max-w-2xl mx-auto">
                            Bugün SALONBİR'e katılın, karmaşık telefon trafiğini bırakıp işinizi büyütmeye odaklanın. Kayıt işlemi tamamen ücretsizdir.
                        </p>
                        <Link to="/apply-salon">
                            <button className="px-10 py-5 bg-secondary-600 text-white hover:bg-secondary-700 rounded-xl font-bold text-lg transition-transform hover:scale-105 shadow-xl shadow-secondary-600/20 flex items-center gap-2 mx-auto">
                                Ücretsiz Profil Oluştur
                                <ChevronRight className="w-6 h-6" />
                            </button>
                        </Link>
                    </div>
                </div>
            </section>
        </div>
    );
};
