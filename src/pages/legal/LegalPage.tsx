
import React from 'react';
import { Shield, ChevronLeft } from 'lucide-react';
import { Link } from 'react-router-dom';

interface LegalPageProps {
    title: string;
    content: string;
}

export const LegalPage: React.FC<LegalPageProps> = ({ title, content }) => {
    return (
        <div className="min-h-screen bg-gray-50 pt-10 pb-20 px-4 sm:px-6 lg:px-8">
            <div className="max-w-4xl mx-auto">
                <Link 
                    to="/" 
                    className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-primary-600 transition-colors mb-8 group"
                >
                    <ChevronLeft className="h-4 w-4 group-hover:-translate-x-1 transition-transform" />
                    Ana Sayfaya Dön
                </Link>

                <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
                    <div className="bg-primary-600 p-8 sm:p-12 text-white relative overflow-hidden">
                        {/* Decorative background */}
                        <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2 blur-3xl" />
                        <div className="absolute bottom-0 left-0 w-32 h-32 bg-black/10 rounded-full translate-y-1/2 -translate-x-1/2 blur-2xl" />

                        <div className="relative flex items-center gap-4">
                            <div className="bg-white/20 p-3 rounded-2xl backdrop-blur-md">
                                <Shield className="h-8 w-8 text-white" />
                            </div>
                            <h1 className="text-3xl sm:text-4xl font-black tracking-tight">{title}</h1>
                        </div>
                        <p className="mt-4 text-primary-100 max-w-xl">
                            Kuğulum olarak verilerinizin güvenliği ve şeffaflık ilkelerimiz gereği sizi bilgilendirmek isteriz.
                        </p>
                    </div>

                    <div className="p-8 sm:p-12 prose prose-gray max-w-none">
                        <div className="whitespace-pre-wrap text-gray-600 leading-relaxed space-y-6">
                            {content.split('\n\n').map((paragraph, index) => (
                                <p key={index}>{paragraph.trim()}</p>
                            ))}
                        </div>
                    </div>
                    
                    <div className="bg-gray-50 px-8 sm:px-12 py-6 border-t border-gray-100">
                        <p className="text-sm text-gray-400">
                            Son Güncelleme: 01 Mayıs 2026
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};
