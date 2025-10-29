
"use client";

import Link from 'next/link';
import { Home, User, Tag, Store, History } from 'lucide-react';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';

const navItems = [
  { href: '/', label: 'Home', icon: Home },
  { href: '/specials', label: 'Specials', icon: Tag },
  { href: '/stores', label: 'Stores', icon: Store },
  { href: '/favorites', label: 'Saved', icon: History },
  { href: '/profile', label: 'Profile', icon: User },
];

export default function BottomNav() {
  const pathname = usePathname();

  return (
    <div className="md:hidden fixed bottom-0 left-0 right-0 bg-background border-t border-border z-50">
      <nav className="flex justify-around items-center h-16">
        {navItems.map((item) => {
            const isActive = item.href === '/' ? pathname === '/' : pathname.startsWith(item.href);
            return (
              <Link
                key={item.label}
                href={item.href}
                className={cn(
                  'flex flex-1 flex-col items-center justify-center gap-1 text-muted-foreground h-full transition-colors',
                  isActive ? 'text-primary' : 'hover:text-primary'
                )}
              >
                <item.icon className="h-6 w-6" />
                <span className="text-xs font-medium">{item.label}</span>
              </Link>
            )
        })}
      </nav>
    </div>
  );
}
