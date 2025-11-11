import Providers from './providers/AbstractWalletProvider';
import { SidebarProvider } from '@/context/SidebarContext';
import { ThemeProvider } from '@/context/ThemeContext';
import { Outfit } from 'next/font/google';
import './globals.css';
import 'swiper/swiper-bundle.css';
import 'simplebar-react/dist/simplebar.min.css';
import '@fortawesome/fontawesome-free/css/all.min.css';
import ToasterClient from '@/components/common/ToasterClient';
import { TxToastHost } from '@/components/ui/toast/TxToast';

const outfit = Outfit({ subsets: ['latin'] });

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={`${outfit.className} dark:bg-gray-900`}>
        <Providers>
          <ThemeProvider>
            <SidebarProvider>
              <ToasterClient />
              {children}
              <TxToastHost />
            </SidebarProvider>
          </ThemeProvider>
        </Providers>
      </body>
    </html>
  );
}
