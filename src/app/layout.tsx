import 'src/styles/global.css';
import { ThemeProvider } from 'src/components/providers/theme-provider';
import { Analytics } from '@vercel/analytics/react';
import toast, { Toaster } from 'react-hot-toast';

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
          defaultTheme="light"
          enableSystem
          disableTransitionOnChange
        >
          {children}
          <Toaster />
        </ThemeProvider>
      </body>
      <Analytics />
    </html>
  );
}
