'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import {
  ProductPageConfig,
  DEFAULT_PRODUCT_PAGE_CONFIG,
  getCanvasBorderCss,
  getCanvasShadowCss,
  getCanvasPaddingCss,
  getThumbSizePx,
} from '../lib/productPageDesign';

export type { ProductPageConfig };
export { DEFAULT_PRODUCT_PAGE_CONFIG };

interface ProductPageContextType {
  pageConfig: ProductPageConfig;
  updatePageConfig: (cfg: Partial<ProductPageConfig>) => void;
  isLoading: boolean;
}

const ProductPageContext = createContext<ProductPageContextType>({
  pageConfig: DEFAULT_PRODUCT_PAGE_CONFIG,
  updatePageConfig: () => {},
  isLoading: false,
});

/**
 * Apply live PDP styling directly to :root via CSS custom properties
 */
export function applyPageStylesToDocument(cfg: ProductPageConfig) {
  if (typeof document === 'undefined') return;
  const root = document.documentElement;

  // Featured Image Canvas
  root.style.setProperty('--pdp-canvas-border', getCanvasBorderCss(cfg.canvas_border));
  root.style.setProperty('--pdp-canvas-shadow', getCanvasShadowCss(cfg.canvas_shadow));
  root.style.setProperty('--pdp-canvas-radius', `${cfg.canvas_radius || '8'}px`);
  root.style.setProperty('--pdp-canvas-bg', cfg.canvas_bg || '#FFFFFF');
  root.style.setProperty('--pdp-canvas-padding', getCanvasPaddingCss(cfg.canvas_padding));

  // Thumbnails
  let thumbBorder = 'none';
  if (cfg.thumb_border === 'subtle') {
    thumbBorder = '1px solid var(--line, #E2DDD5)';
  } else if (cfg.thumb_border === 'accent') {
    thumbBorder = 'none'; // active state receives accent in CSS
  }
  root.style.setProperty('--pdp-thumb-border', thumbBorder);

  let thumbShadow = 'none';
  if (cfg.thumb_shadow === 'subtle') {
    thumbShadow = '0 2px 8px rgba(0, 0, 0, 0.08)';
  }
  root.style.setProperty('--pdp-thumb-shadow', thumbShadow);
  root.style.setProperty('--pdp-thumb-radius', `${cfg.thumb_radius || '6'}px`);
  root.style.setProperty('--pdp-thumb-size', `${getThumbSizePx(cfg.thumb_size)}px`);
  root.style.setProperty('--pdp-thumb-opacity', cfg.thumb_opacity || '0.65');
}

export const ProductPageProvider: React.FC<{
  children: React.ReactNode;
  initialConfig?: Partial<ProductPageConfig>;
}> = ({ children, initialConfig }) => {
  const [pageConfig, setPageConfig] = useState<ProductPageConfig>(() => ({
    ...DEFAULT_PRODUCT_PAGE_CONFIG,
    ...(initialConfig || {}),
  }));
  const [isLoading, setIsLoading] = useState<boolean>(!initialConfig);

  useEffect(() => {
    const active = {
      ...DEFAULT_PRODUCT_PAGE_CONFIG,
      ...(initialConfig || {}),
    };
    applyPageStylesToDocument(active);

    async function loadPageConfig() {
      try {
        const res = await fetch('/api/wp/config', { cache: 'no-store' });
        if (!res.ok) return;

        const json = await res.json();
        const serverConfig = json?.data?.productPage;
        if (serverConfig && typeof serverConfig === 'object') {
          const merged: ProductPageConfig = {
            ...DEFAULT_PRODUCT_PAGE_CONFIG,
            ...serverConfig,
          };
          setPageConfig(merged);
          applyPageStylesToDocument(merged);
        }
      } catch (err) {
        console.warn('[ProductPageContext] Failed to load product page config:', err);
      } finally {
        setIsLoading(false);
      }
    }

    loadPageConfig();

    // Re-sync seamlessly when tab regains focus after editing in WP admin
    const onFocus = () => {
      loadPageConfig();
    };
    window.addEventListener('focus', onFocus);
    return () => {
      window.removeEventListener('focus', onFocus);
    };
  }, [initialConfig]);

  const updatePageConfig = (cfg: Partial<ProductPageConfig>) => {
    setPageConfig((prev) => {
      const updated = { ...prev, ...cfg };
      applyPageStylesToDocument(updated);
      return updated;
    });
  };

  return (
    <ProductPageContext.Provider value={{ pageConfig, updatePageConfig, isLoading }}>
      {children}
    </ProductPageContext.Provider>
  );
};

export const useProductPageConfig = () => useContext(ProductPageContext);
