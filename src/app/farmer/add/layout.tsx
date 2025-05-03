
'use client';

import type { ReactNode } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { FARMER_ADD_TABS, type FarmerAddTabId } from '@/lib/constants';
import { Store, Newspaper, Clapperboard, RadioTower } from 'lucide-react';

interface FarmerAddLayoutProps {
  children: ReactNode;
}

export default function FarmerAddLayout({ children }: FarmerAddLayoutProps) {
  const pathname = usePathname();

  // Determine the active tab based on the current path segment
  const activeTab = pathname.split('/').pop() as FarmerAddTabId || 'product';


  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-primary">Add New Content</h1>
      <Tabs value={activeTab} className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          {FARMER_ADD_TABS.map((tab) => (
            <TabsTrigger key={tab.id} value={tab.id} asChild>
              <Link href={tab.path} className="flex items-center gap-2">
                {tab.id === 'product' && <Store className="h-4 w-4" />}
                {tab.id === 'post' && <Newspaper className="h-4 w-4" />}
                {tab.id === 'story' && <Clapperboard className="h-4 w-4" />}
                {tab.id === 'livestream' && <RadioTower className="h-4 w-4" />}
                {tab.label}
              </Link>
            </TabsTrigger>
          ))}
        </TabsList>
        {/* Content for each tab will be rendered via nested routes */}
        <div className="mt-6">
          {children}
        </div>
      </Tabs>
    </div>
  );
}
