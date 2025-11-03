'use client';

import { usePathname } from 'next/navigation';
import BottomNav from '@/components/bottom-nav';

const noNavRoutes = ['/login', '/signup'];

export default function MainLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const showNav = !noNavRoutes.includes(pathname);

   return (
    <div className="min-h-screen flex flex-col">
      {/* Safe area spacer for iOS status bar */}
      <div className="safe-area-top bg-background w-full" />
      
      <div className={`flex-1 flex flex-col ${showNav ? "pb-16 md:pb-0" : ""}`}>
        {children}
      </div>
      
      {showNav && <BottomNav />}
    </div>
  );
}