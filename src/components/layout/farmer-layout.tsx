
'use client';

import type { ReactNode } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Home,
  Search,
  PlusSquare,
  CalendarDays,
  BarChart,
  User,
  Store,
  Newspaper,
  Clapperboard,
  RadioTower,
  Settings,
  Sparkles,
  LandPlot,
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
import { FARMER_ADD_TABS } from '@/lib/constants';
import { Button } from '@/components/ui/button';

interface FarmerLayoutProps {
  children: ReactNode;
}

export function FarmerLayout({ children }: FarmerLayoutProps) {
  const pathname = usePathname();

  const isActive = (path: string, exact = false) => {
    return exact ? pathname === path : pathname.startsWith(path);
  };

  return (
    <SidebarProvider>
      <Sidebar>
        <SidebarHeader className="p-4">
          <div className="flex items-center gap-2">
             <Store className="h-6 w-6 text-primary" />
             <h1 className="text-xl font-semibold text-primary">FarmConnect</h1>
          </div>
        </SidebarHeader>
        <SidebarContent className="p-2">
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton
                href="/farmer"
                asChild
                isActive={isActive('/farmer', true)}
                tooltip="Home"
              >
                <Link href="/farmer">
                  <Home />
                  <span>Home</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
            <SidebarMenuItem>
              <SidebarMenuButton
                href="/farmer/add/product"
                asChild
                isActive={isActive('/farmer/add')}
                tooltip="Add Content"
              >
                <Link href="/farmer/add/product">
                  <PlusSquare />
                  <span>Add</span>
                </Link>
              </SidebarMenuButton>
               {isActive('/farmer/add') && (
                 <SidebarMenuSub>
                   {FARMER_ADD_TABS.map((tab) => (
                      <SidebarMenuSubItem key={tab.id}>
                        <SidebarMenuSubButton
                          href={tab.path}
                          asChild
                          isActive={isActive(tab.path)}
                        >
                          <Link href={tab.path}>
                              {tab.id === 'product' && <Store />}
                              {tab.id === 'post' && <Newspaper />}
                              {tab.id === 'story' && <Clapperboard />}
                              {tab.id === 'livestream' && <RadioTower />}
                            <span>{tab.label}</span>
                          </Link>
                        </SidebarMenuSubButton>
                      </SidebarMenuSubItem>
                    ))}
                 </SidebarMenuSub>
               )}
            </SidebarMenuItem>
             <SidebarMenuItem>
              <SidebarMenuButton
                href="/farmer/organize"
                asChild
                isActive={isActive('/farmer/organize')}
                tooltip="Organize"
              >
                <Link href="/farmer/organize">
                  <CalendarDays />
                  <span>Organize</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
            <SidebarMenuItem>
              <SidebarMenuButton
                href="/farmer/demand"
                asChild
                isActive={isActive('/farmer/demand')}
                tooltip="Crop Demand"
              >
                <Link href="/farmer/demand">
                  <LandPlot />
                  <span>Crop Demand</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
             <SidebarMenuItem>
              <SidebarMenuButton
                href="/farmer/profile"
                asChild
                isActive={isActive('/farmer/profile')}
                tooltip="Profile"
              >
                <Link href="/farmer/profile">
                  <User />
                  <span>Profile</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
             <SidebarMenuItem>
              <SidebarMenuButton
                href="/farmer/analytics"
                asChild
                isActive={isActive('/farmer/analytics')}
                tooltip="Analytics"
              >
                <Link href="/farmer/analytics">
                  <BarChart />
                  <span>Analytics</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
             <SidebarMenuItem>
              <SidebarMenuButton
                href="/farmer/settings"
                asChild
                isActive={isActive('/farmer/settings')}
                tooltip="Settings"
              >
                <Link href="/farmer/settings">
                  <Settings />
                  <span>Settings</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarContent>
        <SidebarFooter className="p-4">
           {/* AI Assistant Placeholder */}
           <Button variant="ghost" className="w-full justify-start gap-2">
            <Sparkles className="text-accent" />
            AI Assistant
          </Button>
        </SidebarFooter>
      </Sidebar>
      <SidebarInset className="flex flex-col">
         <header className="sticky top-0 z-10 flex h-14 items-center justify-between border-b bg-background px-4 md:justify-end">
           <SidebarTrigger className="md:hidden" />
           {/* Add Header content like user avatar dropdown if needed */}
         </header>
         <main className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8">
           {children}
         </main>
      </SidebarInset>
    </SidebarProvider>
  );
}
