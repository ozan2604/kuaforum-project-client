import React from 'react';
import { Navbar } from '../components/Navbar';
import { Footer } from '../components/Footer';
import { MobileBottomNav } from '../components/MobileBottomNav';
import { Chatbot } from '../components/Chatbot';
import { Outlet, useLocation } from 'react-router-dom';

export const MainLayout: React.FC = () => {
    const { pathname } = useLocation();
    const hideFooter = pathname === '/kolaj';

    return (
        <div className="min-h-[100dvh] flex flex-col bg-gray-50 font-sans">
            <Navbar />
            <main className="flex-grow flex flex-col pb-14 sm:pb-0">
                <Outlet />
            </main>
            {!hideFooter && <Footer />}
            <MobileBottomNav />
            <Chatbot />
        </div>
    );
};
