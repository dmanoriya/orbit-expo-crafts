import type { Metadata, Viewport } from 'next';
import './globals.css';
import { AuthProvider } from '../context/AuthContext';
import { FavoritesProvider } from '../context/FavoritesContext';
import { EnquiryProvider } from '../context/EnquiryContext';
import { Header } from '../components/Header';
import { Footer } from '../components/Footer';
import { EnquiryDrawer } from '../components/EnquiryDrawer';
import { FontLoader } from '../components/FontLoader';
import { ProductGridProvider } from '../context/ProductGridContext';
import {
  DEFAULT_PRODUCT_GRID_CONFIG,
  generateGridCssVariablesString,
} from '../lib/productGrid';
import { getMegaMenuData } from '../lib/megaMenu';
import { fetchWpJsonWithFailover } from '../lib/wpCommerce';

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  themeColor: '#FAF8F5',
};

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || 'https://orbitexpocrafts.com'),
  title: 'ORBIT Expo Crafts — Turnkey Furniture Manufacturer',
  description: 'Turnkey furniture manufacturing for hospitality, commercial and residential projects in Rajasthan.',
  icons: {
    icon: [
      { url: '/favicon.ico', sizes: 'any' },
      { url: '/favicon.png', type: 'image/png' },
      { url: '/favicon-32x32.png', type: 'image/png', sizes: '32x32' },
      { url: '/favicon-16x16.png', type: 'image/png', sizes: '16x16' },
    ],
    apple: [
      { url: '/apple-touch-icon.png', sizes: '180x180', type: 'image/png' },
    ],
    shortcut: '/favicon.ico',
  },
  manifest: '/site.webmanifest',
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const [menuData, configRes] = await Promise.all([
    getMegaMenuData(),
    fetchWpJsonWithFailover<any>('/config', { tag: 'wp-config', revalidate: 30 }),
  ]);

  const initialGridConfig = configRes?.data?.productGrid || DEFAULT_PRODUCT_GRID_CONFIG;
  const gridCss = generateGridCssVariablesString(initialGridConfig);

  return (
    <html lang="en" data-theme="peacock">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=EB+Garamond:ital,wght@0,400;0,500;0,600;0,700;0,800;1,400;1,600;1,700&family=Inter:ital,wght@0,300;0,400;0,500;0,600;0,700;0,800;1,400&family=JetBrains+Mono:wght@400;600&display=swap"
          rel="stylesheet"
        />
        <style id="product-grid-vars" dangerouslySetInnerHTML={{ __html: gridCss }} />
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
        <AuthProvider>
          <EnquiryProvider>
            <FavoritesProvider>
              <ProductGridProvider initialConfig={initialGridConfig}>
                <Header menuData={menuData} />
                <main id="app">{children}</main>
                <Footer />
                <EnquiryDrawer />
              </ProductGridProvider>
            </FavoritesProvider>
          </EnquiryProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
