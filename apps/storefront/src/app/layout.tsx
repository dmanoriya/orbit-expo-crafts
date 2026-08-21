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
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              window.addEventListener('error', function(e) {
                if (e && e.message && (e.message.indexOf('ChunkLoadError') !== -1 || e.message.indexOf('Loading chunk') !== -1)) {
                  if (!window.sessionStorage.getItem('chunk_reload_retry')) {
                    window.sessionStorage.setItem('chunk_reload_retry', 'true');
                    window.location.reload();
                  }
                }
              });
            `,
          }}
        />
      </head>
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
