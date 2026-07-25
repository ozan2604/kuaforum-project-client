import React, { useState } from 'react';
import { MessageCircleMore, X, Send, Calendar, Search, CreditCard, User, AlertCircle, Music } from 'lucide-react';
import { useLocation } from 'react-router-dom';

const playSound = (type: 'send' | 'receive') => {
    try {
        const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
        if (!AudioContext) return;
        const ctx = new AudioContext();
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(ctx.destination);
        if (type === 'send') {
            osc.type = 'sine';
            osc.frequency.setValueAtTime(300, ctx.currentTime);
            osc.frequency.exponentialRampToValueAtTime(100, ctx.currentTime + 0.1);
            gain.gain.setValueAtTime(0.1, ctx.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.1);
            osc.start(ctx.currentTime);
            osc.stop(ctx.currentTime + 0.1);
        } else {
            osc.type = 'sine';
            osc.frequency.setValueAtTime(400, ctx.currentTime);
            osc.frequency.exponentialRampToValueAtTime(600, ctx.currentTime + 0.15);
            gain.gain.setValueAtTime(0.1, ctx.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.15);
            osc.start(ctx.currentTime);
            osc.stop(ctx.currentTime + 0.15);
        }
    } catch (e) {
        console.error("Audio playback failed", e);
    }
};

    const [isOpen, setIsOpen] = useState(false);
    const [showFaqs, setShowFaqs] = useState(true);
    const [inputText, setInputText] = useState('');
    const [isRadioPlaying, setIsRadioPlaying] = useState(false);
    const [messages, setMessages] = useState<{ sender: 'bot' | 'user', text: string }[]>([
        { sender: 'bot', text: 'Size en uygun seçeneği birlikte bulalım. Aşağıdaki konulardan birini seçebilir veya sorunuzu yazabilirsiniz.' }
    ]);
    const { pathname } = useLocation();

    // Hide on some pages if needed, but for now show everywhere except maybe admin/employee
    if (pathname.includes('/admin') || pathname.includes('/employee')) return null;

    const faqOptions = [
        { icon: <Music className="w-4 h-4" />, text: "Benim için radyoyu açar mısın?" },
        { icon: <Calendar className="w-4 h-4" />, text: "Nasıl randevu alırım?" },
        { icon: <AlertCircle className="w-4 h-4" />, text: "Randevumu nasıl iptal ederim?" },
        { icon: <Calendar className="w-4 h-4" />, text: "Randevumu erteleyebilir miyim?" },
        { icon: <Search className="w-4 h-4" />, text: "Nasıl işletme bulurum?" },
        { icon: <CreditCard className="w-4 h-4" />, text: "Ödeme nasıl yapılıyor?" },
        { icon: <User className="w-4 h-4" />, text: "Hesabımı nasıl yönetirim?" },
    ];

    const handleOptionClick = (text: string) => {
        setMessages(prev => [...prev, { sender: 'user', text }]);
        playSound('send');
        setShowFaqs(false);
        
        setTimeout(() => {
            if (text === "Benim için radyoyu açar mısın?") {
                setIsRadioPlaying(true);
                setMessages(prev => [...prev, { sender: 'bot', text: 'Memnuniyetle! Siz kendinize en uygun salonu bulup randevunuzu planlarken, ben de arka planda sizi rahatlatacak dinlendirici bir müzik açıyorum. Keyifli aramalar! 🎶' }]);
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
            {isRadioPlaying && (
                <audio autoPlay loop src="https://cdn.pixabay.com/download/audio/2022/05/27/audio_1808fbf07a.mp3?filename=lofi-study-112191.mp3" />
            )}
            
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
                        <button 
                            onClick={() => setIsOpen(false)}
                            className="p-2 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-full transition-colors"
                        >
                            <X className="w-5 h-5" />
                        </button>
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

            {/* Toggle Button */}
            {!isOpen && (
                <button 
                    onClick={() => setIsOpen(true)}
                    className="w-14 h-14 bg-gray-900 hover:bg-black text-white rounded-full shadow-[0_10px_30px_rgba(0,0,0,0.2)] flex items-center justify-center transition-transform hover:scale-110 active:scale-95 mt-4"
                >
                    <MessageCircleMore className="w-7 h-7" />
                </button>
            )}
            
        </div>
    );
};
