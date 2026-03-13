import { NextIntlClientProvider } from 'next-intl';
import { getMessages } from 'next-intl/server';
import { Inter, Heebo, JetBrains_Mono } from 'next/font/google';
import { Toaster } from 'react-hot-toast';
import { Navbar } from '@/components/layout/Navbar';
import '../globals.css';

const inter = Inter({
  variable: '--font-inter',
  subsets: ['latin'],
  display: 'swap',
});

const heebo = Heebo({
  variable: '--font-heebo',
  subsets: ['latin', 'hebrew'],
  display: 'swap',
});

const jetbrainsMono = JetBrains_Mono({
  variable: '--font-mono',
  subsets: ['latin'],
  display: 'swap',
});

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const messages = await getMessages();
  const isRTL = locale === 'he';

  return (
    <html lang={locale} dir={isRTL ? 'rtl' : 'ltr'}>
      <body
        className={`${inter.variable} ${heebo.variable} ${jetbrainsMono.variable} ${isRTL ? 'font-hebrew' : 'font-sans'} antialiased`}
      >
        <NextIntlClientProvider messages={messages}>
          <Navbar />
          <main className="min-h-[calc(100vh-3.5rem)]">{children}</main>
          <Toaster
            position="bottom-right"
            toastOptions={{
              duration: 3000,
              style: {
                borderRadius: 'var(--radius)',
              },
            }}
          />
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
