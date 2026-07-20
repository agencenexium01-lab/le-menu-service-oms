import React from 'react';
import Navbar from '../components/shared/Navbar';
import Footer from '../components/shared/Footer';

interface RootLayoutProps {
  children: React.ReactNode;
}

export default function RootLayout({ children }: RootLayoutProps) {
  return (
    <div className="min-h-screen flex flex-col bg-brand-bg text-brand-dark" id="web-root-layout">
      {/* Dynamic Navbar */}
      <Navbar />
      
      {/* Core view area */}
      <main className="flex-grow">
        {children}
      </main>
      
      {/* Dynamic Footer */}
      <Footer />
    </div>
  );
}
