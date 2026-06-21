import React from 'react';
import { Navbar } from '../components/Navbar';
import { Footer } from '../components/Footer';
import { MobileBottomNav } from '../components/MobileBottomNav';
import { Outlet } from 'react-router-dom';

export const MainLayout: React.FC = () => {
    return (
        <div className="min-h-screen bg-gray-50 font-sans">
            <Navbar />
            <main className="flex-grow flex flex-col pb-14 sm:pb-0">
                <Outlet />
            </main>
            <Footer />
            <MobileBottomNav />
        </div>
    );
};
