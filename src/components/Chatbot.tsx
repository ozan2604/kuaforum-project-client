import React, { useState, useRef, useEffect } from 'react';
import { MessageCircleMore, X, Send, Calendar, Search, CreditCard, User, AlertCircle, Music, Store, Volume2, VolumeX, Clock, CheckCircle, Zap, Sparkles } from 'lucide-react';
import { useLocation } from 'react-router-dom';

// Removed AudioContext playSound to use DOM Audio elements for iOS compatibility

export const Chatbot: React.FC = () => {
    const [isOpen, setIsOpen] = useState(false);
    const [showFaqs, setShowFaqs] = useState(true);
    const [inputText, setInputText] = useState('');
    const [isRadioPlaying, setIsRadioPlaying] = useState(false);

    // Drag state
    const [position, setPosition] = useState({ x: 0, y: 0 });
    const [isDragging, setIsDragging] = useState(false);
    const dragRef = useRef({ startX: 0, startY: 0, initialX: 0, initialY: 0, hasMoved: false });

    const [messages, setMessages] = useState<{ sender: 'bot' | 'user', text: React.ReactNode }[]>([
        { sender: 'bot', text: 'Size en uygun seçeneği birlikte bulalım. Aşağıdaki konulardan birini seçebilir veya sorunuzu yazabilirsiniz.' }
    ]);
    const { pathname } = useLocation();

    const radioAudioRef = useRef<HTMLAudioElement | null>(null);
    const sendAudioRef = useRef<HTMLAudioElement | null>(null);
    const receiveAudioRef = useRef<HTMLAudioElement | null>(null);

    const playSound = (type: 'send' | 'receive') => {
        const audio = type === 'send' ? sendAudioRef.current : receiveAudioRef.current;
        if (audio) {
            audio.volume = 0.3;
            audio.currentTime = 0;
            const p = audio.play();
            if (p) p.catch(() => {});
        }
    };

    const messagesEndRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages, showFaqs]);

    useEffect(() => {
        const handleMove = (e: PointerEvent) => {
            if (!isDragging) return;
            const dx = e.clientX - dragRef.current.startX;
            const dy = e.clientY - dragRef.current.startY;
            if (Math.abs(dx) > 3 || Math.abs(dy) > 3) {
                dragRef.current.hasMoved = true;
            }
            setPosition({
                x: dragRef.current.initialX + dx,
                y: dragRef.current.initialY + dy
            });
        };

        const handleUp = () => {
            setIsDragging(false);
            setTimeout(() => {
                dragRef.current.hasMoved = false;
            }, 50);
        };

        if (isDragging) {
            window.addEventListener('pointermove', handleMove);
            window.addEventListener('pointerup', handleUp);
        }

        return () => {
            window.removeEventListener('pointermove', handleMove);
            window.removeEventListener('pointerup', handleUp);
        };
    }, [isDragging]);

    // Robust iOS Audio Unlock Hack for all sounds
    useEffect(() => {
        const unlockAudio = () => {
            const audios = [radioAudioRef.current, sendAudioRef.current, receiveAudioRef.current];
            let unlockedAny = false;
            
            audios.forEach(a => {
                if (a && a.paused) {
                    const originalVolume = a.volume;
                    a.volume = 0.01; // nearly mute
                    const playPromise = a.play();
                    if (playPromise !== undefined) {
                        playPromise.then(() => {
                            a.pause();
                            a.currentTime = 0;
                            a.volume = originalVolume;
                        }).catch(() => {});
                    }
                    unlockedAny = true;
                }
            });

            if (unlockedAny) {
                document.removeEventListener('touchstart', unlockAudio);
                document.removeEventListener('click', unlockAudio);
            }
        };

        document.addEventListener('touchstart', unlockAudio, { once: true });
        document.addEventListener('click', unlockAudio, { once: true });

        return () => {
            document.removeEventListener('touchstart', unlockAudio);
            document.removeEventListener('click', unlockAudio);
        };
    }, []);

    const handlePointerDown = (e: React.PointerEvent) => {
        dragRef.current = {
            startX: e.clientX,
            startY: e.clientY,
            initialX: position.x,
            initialY: position.y,
            hasMoved: false
        };
        setIsDragging(true);
        e.currentTarget.setPointerCapture(e.pointerId);
    };

    const handleToggleClick = (e: React.MouseEvent, action: 'radio' | 'chatbot') => {
        if (dragRef.current.hasMoved) {
            e.preventDefault();
            e.stopPropagation();
            return;
        }
        if (action === 'radio') {
            toggleRadio();
        } else {
            setIsOpen(true);
        }
    };

    // Hide on some pages if needed, but for now show everywhere except maybe admin/employee
    if (pathname.includes('/admin') || pathname.includes('/employee')) return null;

    const toggleRadio = (play?: boolean) => {
        if (!radioAudioRef.current) return;
        
        const nextState = play !== undefined ? play : !isRadioPlaying;
        
        if (nextState) {
            radioAudioRef.current.volume = 0.5;
            setIsRadioPlaying(true);
            const playPromise = radioAudioRef.current.play();
            if (playPromise !== undefined) {
                playPromise.catch(error => {
                    console.error("Audio playback failed:", error);
                    setIsRadioPlaying(false);
                });
            }
        } else {
            radioAudioRef.current.pause();
            setIsRadioPlaying(false);
        }
    };

    const faqOptions = [
        { icon: <Music className="w-4 h-4" />, text: isRadioPlaying ? "Radyoyu kapatır mısın?" : "Benim için radyoyu açar mısın?" },
        { icon: <Sparkles className="w-4 h-4" />, text: "salonbir nedir?" },
        { icon: <Calendar className="w-4 h-4" />, text: "Nasıl randevu alırım?" },
        { icon: <Store className="w-4 h-4" />, text: "Salonumu nasıl ekleyebilirim?" },
        { icon: <AlertCircle className="w-4 h-4" />, text: "Randevumu nasıl iptal ederim?" },
        { icon: <Calendar className="w-4 h-4" />, text: "Randevumu erteleyebilir miyim?" },
        { icon: <Search className="w-4 h-4" />, text: "Nasıl işletme bulurum?" },
        { icon: <CreditCard className="w-4 h-4" />, text: "Ödeme nasıl yapılıyor?" },
        { icon: <User className="w-4 h-4" />, text: "Hesabımı nasıl yönetirim?" },
    ];

    const handleOptionClick = (text: string) => {
        setMessages(prev => [...prev, { sender: 'user', text }]);
        setShowFaqs(false);

        if (text === "Benim için radyoyu açar mısın?") {
            toggleRadio(true);
        } else if (text === "Radyoyu kapatır mısın?") {
            toggleRadio(false);
        } else {
            playSound('send');
        }

        setTimeout(() => {
            if (text === "Benim için radyoyu açar mısın?") {
                setMessages(prev => [...prev, { sender: 'bot', text: 'Memnuniyetle! Siz kendinize en uygun salonu bulup randevunuzu planlarken, ben de arka planda sizi rahatlatacak dinlendirici bir müzik açıyorum. Keyifli aramalar! 🎶' }]);
            } else if (text === "Radyoyu kapatır mısın?") {
                setMessages(prev => [...prev, { sender: 'bot', text: 'Radyoyu kapattım. Başka bir isteğiniz olursa ben buradayım!' }]);
            } else if (text === "Salonbir nedir?") {
                setMessages(prev => [...prev, {
                    sender: 'bot',
                    text: (
                        <div className="flex flex-col gap-3">
                            <span className="font-semibold text-gray-800 border-b border-gray-100 pb-2">SalonBir, güzellik ve bakım dünyasını tek çatı altında toplayan yeni nesil platformdur. ✨</span>

                            <div className="flex flex-col gap-1.5">
                                <span className="text-[13px] font-bold text-blue-600">Müşteriler için:</span>
                                <span className="text-[13px] text-gray-600 leading-relaxed">Şehrinizdeki en iyi salonları keşfedebilir, gerçek yorumları okuyabilir ve 7/24 tamamen <strong>ücretsiz</strong> randevu oluşturabilirsiniz. Güzellik rutininiz artık cebinizde!</span>
                            </div>

                            <div className="flex flex-col gap-1.5">
                                <span className="text-[13px] font-bold text-purple-600">Salon Sahipleri için:</span>
                                <span className="text-[13px] text-gray-600 leading-relaxed">İşletmenizi dijital dünyaya taşıyarak yepyeni müşterilere ulaşırsınız. Randevularınızı, personellerinizi ve kazançlarınızı tek bir ekrandan profesyonelce yönetirsiniz.</span>
                            </div>

                            <span className="text-[13px] text-gray-500 italic mt-1 bg-gray-50 p-2 rounded-lg text-center">
                                Kısacası SalonBir; güzellik arayanlar ile güzellik yaratanları en güvenli ve hızlı şekilde buluşturan köprüdür.
                            </span>
                        </div>
                    )
                }]);
            } else if (text === "Nasıl randevu alırım?") {
                setMessages(prev => [...prev, {
                    sender: 'bot',
                    text: (
                        <div className="flex flex-col gap-3">
                            <span>Randevu almak SalonBir'de çok kolay ve <strong>tamamen ücretsizdir!</strong> Kendinize en uygun salonu bulduktan sonra işlemlerinizi hızlıca tamamlayabilirsiniz:</span>
                            <ul className="list-decimal list-inside text-[13.5px] text-gray-700 space-y-1 ml-1 bg-gray-50/50 p-2 rounded-lg border border-gray-100/50">
                                <li>Size en uygun salonu ve hizmeti seçin.</li>
                                <li>Tarih ve saat belirleyin.</li>
                                <li>Hatırlatma SMS'leri için numaranızı girin ve randevunuzu oluşturun</li>
                            </ul>

                            <div className="flex flex-wrap items-center gap-x-4 gap-y-2 mt-1 pt-3 border-t border-gray-100">
                                <div className="flex items-center gap-1.5">
                                    <Clock className="w-3.5 h-3.5 text-gray-500" />
                                    <span className="text-[11px] font-semibold text-gray-600">3 Adımda randevu al</span>
                                </div>
                                <div className="flex items-center gap-1.5">
                                    <CheckCircle className="w-3.5 h-3.5 text-gray-500" />
                                    <span className="text-[11px] font-semibold text-gray-600">Ücretsiz</span>
                                </div>
                                <div className="flex items-center gap-1.5">
                                    <Zap className="w-3.5 h-3.5 text-gray-500" />
                                    <span className="text-[11px] font-semibold text-gray-600">Anında onay</span>
                                </div>
                            </div>
                        </div>
                    )
                }]);
            } else if (text === "Randevumu nasıl iptal ederim?") {
                setMessages(prev => [...prev, {
                    sender: 'bot',
                    text: (
                        <div className="flex flex-col gap-2">
                            <span>Randevunuzu iptal etmek çok kolaydır. Bunun için şu adımları izleyebilirsiniz:</span>
                            <div className="bg-gray-50 p-2.5 rounded-lg border border-gray-100 text-[13px] text-gray-700 mt-1">
                                Profilinizdeki <strong>"Randevularım"</strong> sekmesine gidin. İptal etmek istediğiniz randevuyu bulun. Eğer salon sahibinin belirlediği iptal süresini aşmadıysanız, <strong>"İptal Et"</strong> butonuna basarak tek tıkla randevunuzu iptal edebilirsiniz.
                            </div>
                            <span className="text-[12px] text-gray-500 italic mt-1">Not: İptal süresi dolmuş randevular için doğrudan salonla iletişime geçmeniz gerekebilir.</span>
                        </div>
                    )
                }]);
            } else if (text === "Salonumu nasıl ekleyebilirim?") {
                setMessages(prev => [...prev, {
                    sender: 'bot',
                    text: (
                        <div className="flex flex-col gap-2.5">
                            <span>Harika bir karar! Salonunuzu platformumuza eklemek oldukça basit. İlgili bilgileri girerek hızlıca salon başvurusunda bulunabilirsiniz. Başvurunuz ekibimiz tarafından incelendikten sonra kısa sürede onaylanır.</span>
                            <span>Ayrıca aklınıza takılan herhangi bir şey olursa <strong>"Bize Ulaşın"</strong> sekmesinden doğrudan bizimle iletişime geçebilirsiniz.</span>
                            <a href="https://www.salonbir.com/salon-basvurusu" target="_blank" rel="noopener noreferrer" className="inline-block mt-1 text-center bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-xl font-medium transition-colors shadow-sm">
                                Salon Başvurusu Yap
                            </a>
                        </div>
                    )
                }]);
            } else {
                setMessages(prev => [...prev, { sender: 'bot', text: 'Bu konuda henüz eğitim aşamasındayım. Çok yakında size detaylı yardımcı olabileceğim!' }]);
            }
            playSound('receive');
        }, 1000);
    };

    const handleActionClick = (action: 'faq' | 'contact') => {
        if (action === 'faq') {
            setShowFaqs(true);
        } else {
            setMessages(prev => [
                ...prev,
                { sender: 'user', text: 'Bize Ulaşın' }
            ]);
            playSound('send');
            setTimeout(() => {
                setMessages(prev => [
                    ...prev,
                    { sender: 'bot', text: 'İletişim Bilgilerimiz:\n\nE-posta: salonbir26@gmail.com\nTelefon: 0531 778 85 04' }
                ]);
                playSound('receive');
            }, 500);
            setShowFaqs(false);
        }
    };

    const handleSendText = (e?: React.FormEvent) => {
        if (e) e.preventDefault();
        const text = inputText.trim();
        if (!text) return;

        setMessages(prev => [...prev, { sender: 'user', text }]);
        playSound('send');
        setInputText('');
        setShowFaqs(false);

        setTimeout(() => {
            setMessages(prev => [...prev, { sender: 'bot', text: 'Bu konuda henüz eğitim aşamasındayım. Çok yakında size detaylı yardımcı olabileceğim!' }]);
            playSound('receive');
        }, 1000);
    };

    return (
        <div className="fixed bottom-20 sm:bottom-8 right-4 sm:right-8 z-[100] flex flex-col items-end">
            <audio
                ref={radioAudioRef}
                loop
                preload="auto"
                playsInline
                src="https://cdn.pixabay.com/download/audio/2022/05/27/audio_1808fbf07a.mp3?filename=lofi-study-112191.mp3"
            />
            <audio ref={sendAudioRef} preload="auto" playsInline src="https://cdn.freesound.org/previews/263/263133_2064400-lq.mp3" />
            <audio ref={receiveAudioRef} preload="auto" playsInline src="https://cdn.freesound.org/previews/512/512135_6142149-lq.mp3" />

            {/* Chatbot Window */}
            {isOpen && (
                <div className="bg-gray-50 mb-4 w-[calc(100vw-2rem)] sm:w-[380px] max-w-full h-[550px] max-h-[70vh] rounded-2xl shadow-[0_10px_40px_rgba(0,0,0,0.15)] border border-gray-200 flex flex-col overflow-hidden animate-in slide-in-from-bottom-4 fade-in duration-200 origin-bottom-right">

                    {/* Header */}
                    <div className="bg-white px-5 py-4 flex items-center justify-between border-b border-gray-100 shrink-0">
                        <div className="flex items-center gap-3">
                            <div className="relative">
                                <div
                                    className="w-10 h-10 rounded-full bg-white border border-gray-200 overflow-hidden"
                                    style={{
                                        backgroundImage: "url('/logo.png')",
                                        backgroundPosition: "45% 50%",
                                        backgroundSize: "400%",
                                        backgroundRepeat: "no-repeat"
                                    }}
                                >
                                </div>
                                <div className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 bg-green-500 rounded-full border-2 border-white"></div>
                            </div>
                            <div>
                                <h3 className="font-bold text-gray-900 leading-tight">Akıllı Asistan</h3>
                                <p className="text-xs text-gray-500 font-medium">Size en uygun seçeneği birlikte bulalım.</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-1">
                            <button
                                onClick={() => toggleRadio()}
                                className="p-2 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-full transition-colors"
                                title={isRadioPlaying ? "Müziği Kapat" : "Müziği Aç"}
                            >
                                {isRadioPlaying ? <Volume2 className="w-4 h-4 text-green-600" /> : <VolumeX className="w-4 h-4 text-gray-400" />}
                            </button>
                            <button
                                onClick={() => setIsOpen(false)}
                                className="p-2 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-full transition-colors"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                    </div>

                    {/* Chat Area */}
                    <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-4">
                        <div className="flex justify-center mb-2">
                            <span className="text-[11px] text-gray-400 font-semibold uppercase tracking-wider bg-gray-100 px-3 py-1 rounded-full">Bugün</span>
                        </div>

                        {messages.map((msg, idx) => (
                            <div key={idx} className="flex flex-col gap-2">
                                <div className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                                    <div className={`max-w-[85%] px-4 py-3 rounded-2xl text-[15px] leading-relaxed shadow-sm whitespace-pre-wrap
                                        ${msg.sender === 'user'
                                            ? 'bg-blue-600 text-white rounded-br-sm'
                                            : 'bg-white text-gray-800 border border-gray-100 rounded-tl-sm'
                                        }`}
                                    >
                                        {msg.text}
                                    </div>
                                </div>
                                {msg.sender === 'bot' && (
                                    <div className="flex gap-2 justify-start ml-1 mt-0.5">
                                        <button
                                            onClick={() => handleActionClick('faq')}
                                            className="px-3 py-1.5 text-[13px] font-medium bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-colors border border-blue-100 shadow-sm"
                                        >
                                            Akıllı Sorular
                                        </button>
                                        <button
                                            onClick={() => handleActionClick('contact')}
                                            className="px-3 py-1.5 text-[13px] font-medium bg-gray-50 text-gray-700 rounded-lg hover:bg-gray-100 transition-colors border border-gray-200 shadow-sm"
                                        >
                                            Bize Ulaşın
                                        </button>
                                    </div>
                                )}
                            </div>
                        ))}
                        <div ref={messagesEndRef} />
                    </div>

                    {/* FAQ Options (only show if last message is from bot and showFaqs is true) */}
                    {showFaqs && messages[messages.length - 1].sender === 'bot' && (
                        <div className="p-3 pt-0 shrink-0 overflow-y-auto max-h-[40%] custom-scrollbar">
                            <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
                                {faqOptions.map((opt, idx) => (
                                    <button
                                        key={idx}
                                        onClick={() => handleOptionClick(opt.text)}
                                        className={`w-full flex items-center gap-3 px-4 py-3.5 text-left hover:bg-gray-50 transition-colors text-sm font-medium text-gray-700
                                            ${idx !== faqOptions.length - 1 ? 'border-b border-gray-100' : ''}
                                        `}
                                    >
                                        <div className="text-gray-400">{opt.icon}</div>
                                        {opt.text}
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Input Area */}
                    <div className="bg-white p-3 border-t border-gray-100 shrink-0">
                        <form onSubmit={handleSendText} className="relative flex items-center">
                            <input
                                type="text"
                                value={inputText}
                                onChange={e => setInputText(e.target.value)}
                                placeholder="Mesajınızı yazın..."
                                className="w-full bg-gray-100 border-none rounded-full py-3 pl-4 pr-12 text-sm text-gray-800 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all"
                            />
                            <button type="submit" disabled={!inputText.trim()} className="absolute right-1.5 p-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-full transition-colors shadow-sm">
                                <Send className="w-4 h-4 ml-0.5" />
                            </button>
                        </form>
                    </div>

                </div>
            )}

            {/* Toggle Button Group */}
            {!isOpen && (
                <div
                    className="flex mt-4 touch-none select-none cursor-grab active:cursor-grabbing z-50"
                    style={{ transform: `translate(${position.x}px, ${position.y}px)` }}
                    onPointerDown={handlePointerDown}
                >
                    <div
                        onClick={(e) => handleToggleClick(e, 'chatbot')}
                        className="relative w-12 h-12 bg-gray-900 hover:bg-black text-white rounded-full shadow-[0_8px_25px_rgba(0,0,0,0.3)] flex items-center justify-center transition-transform hover:scale-105 active:scale-95"
                    >
                        <MessageCircleMore className="w-[22px] h-[22px]" />

                        {/* Music badge attached to Chatbot */}
                        <div
                            onClick={(e) => {
                                e.stopPropagation();
                                handleToggleClick(e, 'radio');
                            }}
                            className="absolute -top-1.5 -right-1.5 w-[22px] h-[22px] bg-white text-gray-700 rounded-full shadow-[0_4px_12px_rgba(0,0,0,0.3)] flex items-center justify-center transition-transform hover:scale-110 active:scale-95 border border-gray-200 cursor-pointer z-10"
                            title={isRadioPlaying ? "Müziği Kapat" : "Müziği Aç"}
                        >
                            {isRadioPlaying ? <Volume2 className="w-3 h-3 text-green-600" /> : <VolumeX className="w-3 h-3 text-gray-400" />}
                        </div>
                    </div>
                </div>
            )}

        </div>
    );
};
