import './globals.css';
import { ThemeProvider } from '@/components/providers/theme-provider';
import { Analytics } from '@vercel/analytics/react';

export const metadata = {
  title: 'Alamo',
  description:
    'Alamo is the operating system for the American Housing Corporation.'
};

export default function RootLayout({
  children
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="">
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          {children}
        </ThemeProvider>
      </body>
      <Analytics />
    </html>
  );
}
