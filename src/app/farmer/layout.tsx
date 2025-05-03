
import type { Metadata } from 'next';
import { FarmerLayout } from '@/components/layout/farmer-layout';

export const metadata: Metadata = {
  title: 'FarmConnect - Farmer Dashboard',
  description: 'Manage your farm products, posts, and events.',
};

export default function Layout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return <FarmerLayout>{children}</FarmerLayout>;
}
