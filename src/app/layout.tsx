import type { Metadata, Viewport } from 'next';
import { Inter } from 'next/font/google';
import { ToastProvider } from '@/components/ui/Toast';
import { DemoSwitcher } from '@/features/demo/DemoSwitcher';
import './globals.css';

const inter = Inter({ subsets: ['latin'], variable: '--font-inter', display: 'swap' });

export const metadata: Metadata = {
  title: { default: 'My orders · Haatbox', template: '%s · Haatbox' },
  description:
    'Order tracking that makes delivery status clear at a glance — including delays, missing parcels and orders not yet scanned.',
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#f6f7f9' },
    { media: '(prefers-color-scheme: dark)', color: '#0b0d12' },
  ],
};

export default function RootLayout({ children }: LayoutProps<'/'>) {
  return (
    <html lang="en" className={inter.variable}>
      <body>
        <ToastProvider>
          <div className="mx-auto min-h-dvh w-full max-w-[430px] bg-bg px-4 pb-28 shadow-[0_0_0_1px_var(--border)]">
            {children}
          </div>
          <DemoSwitcher />
        </ToastProvider>
      </body>
    </html>
  );
}
