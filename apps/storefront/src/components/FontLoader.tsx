'use client';

import React, { useEffect } from 'react';

interface FontConfig {
  fontHeading: string;
  fontBody: string;
  fontMenu: string;
  fontButton: string;
  fontMono: string;
}

export const FontLoader: React.FC = () => {
  useEffect(() => {
    async function loadFonts() {
      try {
        const res = await fetch('/api/wp/config').catch(() => null);
        if (!res || !res.ok) return;

        const json = await res.json().catch(() => null);
        if (!json || !json.success || !json.data?.fonts) return;

        const fonts: FontConfig = json.data.fonts;

        // Unique font family names to load
        const fontSet = new Set<string>();
        if (fonts.fontHeading) fontSet.add(fonts.fontHeading);
        if (fonts.fontBody) fontSet.add(fonts.fontBody);
        if (fonts.fontMenu) fontSet.add(fonts.fontMenu);
        if (fonts.fontButton) fontSet.add(fonts.fontButton);
        if (fonts.fontMono) fontSet.add(fonts.fontMono);

        // Build Google Fonts URL with weights 400, 600, 700
        const familyQueries: string[] = [];
        fontSet.forEach((font) => {
          const encoded = font.replace(/ /g, '+');
          familyQueries.push(`family=${encoded}:wght@400;500;600;700;800`);
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
        if (fonts.fontHeading) root.style.setProperty('--font-display', `'${fonts.fontHeading}', Georgia, serif`);
        if (fonts.fontBody) root.style.setProperty('--font-ui', `'${fonts.fontBody}', system-ui, sans-serif`);
        if (fonts.fontMenu) root.style.setProperty('--font-menu', `'${fonts.fontMenu}', system-ui, sans-serif`);
        if (fonts.fontButton) root.style.setProperty('--font-button', `'${fonts.fontButton}', system-ui, sans-serif`);
        if (fonts.fontMono) root.style.setProperty('--font-mono', `'${fonts.fontMono}', monospace`);
      } catch (err) {
        console.log('Dynamic Font Loader bypass:', err);
      }
    }

    loadFonts();
  }, []);

  return null;
};
