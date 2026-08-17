import './globals.css';
import { EnquiryProvider } from '../context/EnquiryContext';
import { Header } from '../components/Header';
import { Footer } from '../components/Footer';
import { EnquiryDrawer } from '../components/EnquiryDrawer';
import { FontLoader } from '../components/FontLoader';

export const metadata = {
  title: 'ORBIT Expo Crafts — Turnkey Furniture Manufacturer',
  description: 'Turnkey furniture manufacturing for hospitality, commercial and residential projects in Rajasthan.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" data-theme="peacock">
      <body suppressHydrationWarning>
        <FontLoader />
        <EnquiryProvider>
          <Header />
          <main id="app">{children}</main>
          <Footer />
          <EnquiryDrawer />
        </EnquiryProvider>
      </body>
    </html>
  );
}
