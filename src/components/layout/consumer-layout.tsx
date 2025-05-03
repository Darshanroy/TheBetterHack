
'use client';

import type { ReactNode } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Home,
  Search,
  CalendarHeart, // Replacing CalendarDays for potentially warmer feel
  ShoppingCart,
  User,
  Store, // Keeping Store for brand recognition
  Sparkles,
  Settings,
} from 'lucide-react';
import {
  SidebarProvider,
  Sidebar,
  SidebarHeader,
  SidebarTrigger,
  SidebarContent,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarFooter,
  SidebarInset,
} from '@/components/ui/sidebar';
import { Button } from '@/components/ui/button';
import { useIsMobile } from '@/hooks/use-mobile';

interface ConsumerLayoutProps {
  children: ReactNode;
}

const navItems = [
  { href: '/consumer', icon: Home, label: 'Home', tooltip: 'Home' },
  { href: '/consumer/explore', icon: Search, label: 'Explore', tooltip: 'Search & Explore' },
  { href: '/consumer/events', icon: CalendarHeart, label: 'Events', tooltip: 'Events & Requests' },
  { href: '/consumer/cart', icon: ShoppingCart, label: 'Cart', tooltip: 'Cart' },
  { href: '/consumer/profile', icon: User, label: 'Profile', tooltip: 'Profile' },
];

export function ConsumerLayout({ children }: ConsumerLayoutProps) {
  const pathname = usePathname();
  const isMobile = useIsMobile();

  const isActive = (path: string, exact = false) => {
    return exact ? pathname === path : pathname.startsWith(path);
  };

  if (isMobile === undefined) {
    // Avoid rendering mismatch during SSR hydration
    return null;
  }

  return (
    <SidebarProvider>
       {/* Desktop Sidebar */}
      <Sidebar collapsible="icon" variant="inset">
         <SidebarHeader className="p-4 hidden md:flex">
          <div className="flex items-center gap-2">
             <Store className="h-6 w-6 text-primary" />
             <h1 className="text-xl font-semibold text-primary group-data-[collapsible=icon]:hidden">FarmConnect</h1>
          </div>
        </SidebarHeader>
        <SidebarContent className="p-2">
          <SidebarMenu>
            {navItems.map((item) => (
              <SidebarMenuItem key={item.href}>
                <SidebarMenuButton
                  href={item.href}
                  asChild
                  isActive={isActive(item.href, item.href === '/consumer')}
                  tooltip={item.tooltip}
                >
                  <Link href={item.href}>
                    <item.icon />
                    <span className="group-data-[collapsible=icon]:hidden">{item.label}</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            ))}
             <SidebarMenuItem>
              <SidebarMenuButton
                href="/consumer/settings"
                asChild
                isActive={isActive('/consumer/settings')}
                tooltip="Settings"
              >
                <Link href="/consumer/settings">
                  <Settings />
                  <span className="group-data-[collapsible=icon]:hidden">Settings</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarContent>
        <SidebarFooter className="p-4 hidden md:flex">
           {/* AI Assistant Placeholder */}
           <Button variant="ghost" className="w-full justify-start gap-2 group-data-[collapsible=icon]:justify-center">
            <Sparkles className="text-accent" />
             <span className="group-data-[collapsible=icon]:hidden">AI Assistant</span>
          </Button>
        </SidebarFooter>
      </Sidebar>

      <SidebarInset className="flex flex-col">
         {/* Mobile Header */}
         <header className="sticky top-0 z-10 flex h-14 items-center justify-between border-b bg-background px-4 md:hidden">
            <div className="flex items-center gap-2">
             <Store className="h-6 w-6 text-primary" />
             <h1 className="text-lg font-semibold text-primary">FarmConnect</h1>
            </div>
           {/* Add Header content like maybe a settings icon or search icon for mobile? */}
            <Button variant="ghost" size="icon">
                <Sparkles className="text-accent" />
                <span className="sr-only">AI Assistant</span>
            </Button>
         </header>

         {/* Desktop Header (if different from mobile is needed) */}
         <header className="sticky top-0 z-10 hidden h-14 items-center justify-end border-b bg-background px-4 md:flex">
           {/* Placeholder for potential desktop header elements like user avatar */}
         </header>

         <main className="flex-1 overflow-y-auto p-4 pb-20 md:p-6 lg:p-8"> {/* Add padding-bottom for mobile nav */}
           {children}
         </main>

         {/* Mobile Bottom Navigation */}
         {isMobile && (
          <nav className="fixed bottom-0 left-0 right-0 z-10 border-t bg-background/95 backdrop-blur-sm md:hidden">
            <div className="flex h-16 items-center justify-around">
              {navItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex flex-col items-center gap-1 p-2 rounded-md ${
                    isActive(item.href, item.href === '/consumer')
                      ? 'text-primary'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  <item.icon className="h-5 w-5" />
                  <span className="text-xs">{item.label}</span>
                </Link>
              ))}
            </div>
          </nav>
         )}
      </SidebarInset>
    </SidebarProvider>
  );
}
