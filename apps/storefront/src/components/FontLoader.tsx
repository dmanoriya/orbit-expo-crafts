'use client';

import React, { useEffect } from 'react';

interface FontConfig {
  fontHeading: string;
  fontBody: string;
  fontMenu: string;
  fontButton: string;
  fontMono: string;
}

let loadedFontConfig = false;

export const FontLoader: React.FC = () => {
  useEffect(() => {
    if (loadedFontConfig) return;

    async function loadFonts() {
      try {
        const res = await fetch('/api/wp/config').catch(() => null);
        if (!res || !res.ok) return;
        loadedFontConfig = true;

        const json = await res.json().catch(() => null);
        if (!json || !json.success || !json.data?.fonts) return;

        const fonts: FontConfig = json.data.fonts;

        const rawHeading = fonts.fontHeading?.trim();
        const fontHeading = rawHeading && rawHeading !== 'Fraunces' && rawHeading !== 'Gilda Display' ? rawHeading : 'EB Garamond';

        const rawBody = fonts.fontBody?.trim();
        const fontBody = rawBody && rawBody !== 'Archivo' && rawBody !== 'Sarabun' && rawBody !== 'Plus Jakarta Sans' ? rawBody : 'Inter';

        const fontMenu = fonts.fontMenu && fonts.fontMenu !== 'Archivo' ? fonts.fontMenu : fontBody;
        const fontButton = fonts.fontButton && fonts.fontButton !== 'Archivo' ? fonts.fontButton : fontBody;
        const fontMono = fonts.fontMono || 'JetBrains Mono';

        // Unique font family names to load
        const fontSet = new Set<string>();
        fontSet.add(fontHeading);
        fontSet.add(fontBody);
        if (fontMenu) fontSet.add(fontMenu);
        if (fontButton) fontSet.add(fontButton);
        if (fontMono) fontSet.add(fontMono);

        // Build Google Fonts URL with appropriate weights
        const familyQueries: string[] = [];
        fontSet.forEach((font) => {
          const encoded = font.replace(/ /g, '+');
          if (font === 'EB Garamond') {
            familyQueries.push(`family=EB+Garamond:ital,wght@0,400;0,500;0,600;0,700;0,800;1,400;1,600;1,700`);
          } else {
            familyQueries.push(`family=${encoded}:ital,wght@0,300;0,400;0,500;0,600;0,700;0,800;1,400`);
          }
        });

        if (familyQueries.length > 0) {
          const fontUrl = `https://fonts.googleapis.com/css2?${familyQueries.join('&')}&display=swap`;
          
          let linkEl = document.getElementById('dynamic-google-fonts') as HTMLLinkElement | null;
          if (!linkEl) {
            linkEl = document.createElement('link');
            linkEl.id = 'dynamic-google-fonts';
            linkEl.rel = 'stylesheet';
            document.head.appendChild(linkEl);
          }
          linkEl.href = fontUrl;
        }

        // Apply CSS custom variables to :root
        const root = document.documentElement;
        root.style.setProperty('--font-display', `'${fontHeading}', Georgia, serif`);
        root.style.setProperty('--font-serif', `'${fontHeading}', Georgia, serif`);
        root.style.setProperty('--font-heading', `'${fontHeading}', Georgia, serif`);
        root.style.setProperty('--font-ui', `'${fontBody}', system-ui, -apple-system, sans-serif`);
        root.style.setProperty('--font-sans', `'${fontBody}', system-ui, -apple-system, sans-serif`);
        root.style.setProperty('--font-body', `'${fontBody}', system-ui, -apple-system, sans-serif`);
        if (fontMenu) root.style.setProperty('--font-menu', `'${fontMenu}', system-ui, sans-serif`);
        if (fontButton) root.style.setProperty('--font-button', `'${fontButton}', system-ui, sans-serif`);
        if (fontMono) root.style.setProperty('--font-mono', `'${fontMono}', monospace`);
      } catch (err) {
        console.log('Dynamic Font Loader bypass:', err);
      }
    }

    loadFonts();
  }, []);

  return null;
};
