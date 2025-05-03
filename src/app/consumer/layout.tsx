
import type { Metadata } from 'next';
import { ConsumerLayout } from '@/components/layout/consumer-layout';

export const metadata: Metadata = {
  title: 'FarmConnect - Fresh Fruits & Vegetables',
  description: 'Discover and purchase fresh produce directly from local farms.',
};

export default function Layout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return <ConsumerLayout>{children}</ConsumerLayout>;
}
