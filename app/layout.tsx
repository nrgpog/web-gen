import './globals.css';
import { Inter } from 'next/font/google';
import { Toaster } from 'react-hot-toast';
import { getServerSession } from 'next-auth';
import { authOptions } from './api/auth/options';
import { SessionProvider } from './components/SessionProvider';

const inter = Inter({ subsets: ['latin'] });

export const metadata = {
  title: 'Apollo Bot',
  description: 'Panel de control para el bot Apollo',
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getServerSession(authOptions);

  return (
    <html lang="es">
      <body className={inter.className}>
        <SessionProvider session={session}>
          {children}
          <Toaster />
        </SessionProvider>
      </body>
    </html>
  );
}
