'use client';

import { usePathname } from 'next/navigation';
import BottomNav from '@/components/bottom-nav';

const noNavRoutes = ['/login', '/signup'];

export default function MainLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const showNav = !noNavRoutes.includes(pathname);

  return (
    <>
      {/* Safe area for iOS status bar - applies to all pages */}
      <div className="safe-area-top" />
      
      <div className={showNav ? "pb-16 md:pb-0 pt-safe-top" : "pt-safe-top"}>
        {children}
      </div>
      {showNav && <BottomNav />}
    </>
  );
}