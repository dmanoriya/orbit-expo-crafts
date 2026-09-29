'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import {
  ProductGridConfig,
  DEFAULT_PRODUCT_GRID_CONFIG,
  formatAspectRatio,
  generateGridCssVariablesString,
} from '../lib/productGrid';

export type { ProductGridConfig };
export { DEFAULT_PRODUCT_GRID_CONFIG, formatAspectRatio, generateGridCssVariablesString };

interface ProductGridContextType {
  gridConfig: ProductGridConfig;
  updateGridConfig: (cfg: Partial<ProductGridConfig>) => void;
  isLoading: boolean;
}

const ProductGridContext = createContext<ProductGridContextType>({
  gridConfig: DEFAULT_PRODUCT_GRID_CONFIG,
  updateGridConfig: () => {},
  isLoading: false,
});

/**
 * Apply live grid styling directly to :root via CSS custom properties
 */
export function applyGridStylesToDocument(cfg: ProductGridConfig) {
  if (typeof document === 'undefined') return;
  const root = document.documentElement;

  // Aspect Ratio & Sizing
  root.style.setProperty('--card-aspect-ratio', formatAspectRatio(cfg.aspect_ratio));
  root.style.setProperty('--card-object-fit', cfg.image_fit === 'contain' ? 'contain' : 'cover');
  root.style.setProperty('--card-thumb-bg', cfg.thumb_bg || '#FFFFFF');
  root.style.setProperty('--card-thumb-padding', `${cfg.thumb_padding || '0'}px`);
  root.style.setProperty('--card-radius', `${cfg.thumb_radius || '8'}px`);

  // Border & Shadow
  let borderVal = '1px solid var(--line, #ECE7DE)';
  if (cfg.card_border === 'none') {
    borderVal = 'none';
  } else if (cfg.card_border === 'medium') {
    borderVal = '1px solid #D5CEC2';
  }
  root.style.setProperty('--card-border', borderVal);

  let shadowVal = '0 2px 10px rgba(0, 0, 0, 0.03)';
  if (cfg.card_shadow === 'none') {
    shadowVal = 'none';
  } else if (cfg.card_shadow === 'elevated') {
    shadowVal = '0 4px 16px rgba(0, 0, 0, 0.06)';
  } else if (cfg.card_shadow === 'hover_float') {
    shadowVal = '0 2px 8px rgba(0, 0, 0, 0.02)';
  }
  root.style.setProperty('--card-shadow', shadowVal);

  // Hover Zoom & Gradient
  const zoomFactor = parseFloat(cfg.hover_zoom) || 1.04;
  root.style.setProperty('--card-hover-zoom', zoomFactor <= 1 ? 'scale(1) translateZ(0)' : `scale(${zoomFactor}) translateZ(0)`);
  root.style.setProperty('--card-hover-gradient-opacity', cfg.hover_gradient === 'yes' ? '1' : '0');

  // Columns Desktop & Mobile
  const colsDesk = parseInt(cfg.cols_desktop, 10) || 3;
  root.style.setProperty('--grid-cols-desktop', `repeat(${colsDesk}, 1fr)`);

  const colsMob = parseInt(cfg.cols_mobile, 10) || 1;
  root.style.setProperty('--grid-cols-mobile', colsMob === 2 ? 'repeat(2, 1fr)' : '1fr');

  // Desktop Gap
  let gapDesk = '40px 28px';
  if (cfg.gap_desktop === 'compact') {
    gapDesk = '28px 20px';
  } else if (cfg.gap_desktop === 'spacious') {
    gapDesk = '48px 36px';
  }
  root.style.setProperty('--grid-gap-desktop', gapDesk);

  // Mobile Gap
  let gapMob = '24px 16px';
  if (cfg.gap_mobile === 'compact') {
    gapMob = '16px 12px';
  } else if (cfg.gap_mobile === 'spacious') {
    gapMob = '36px 0px';
  }
  root.style.setProperty('--grid-gap-mobile', gapMob);

  // Element Visibility Toggles
  root.style.setProperty('--card-badge-display', cfg.show_badge === 'yes' ? 'inline-block' : 'none');
  root.style.setProperty('--card-fav-display', cfg.show_favorite === 'yes' ? 'flex' : 'none');
  root.style.setProperty('--card-category-display', cfg.show_category === 'yes' ? 'inline-block' : 'none');
  root.style.setProperty('--card-mto-display', cfg.show_made_to_order === 'yes' ? 'inline-flex' : 'none');
  root.style.setProperty('--card-moq-lead-display', cfg.show_moq_lead === 'yes' ? 'flex' : 'none');
  root.style.setProperty('--card-price-display', cfg.show_price_note === 'yes' ? 'inline-block' : 'none');

  // Action Buttons
  const hasActions = cfg.show_actions === 'yes' && cfg.actions_mode !== 'none';
  root.style.setProperty('--card-acts-display', (hasActions && cfg.actions_mode === 'hover_overlay') ? 'flex' : 'none');
  root.style.setProperty('--card-acts-inline-display', (hasActions && cfg.actions_mode === 'always_visible') ? 'flex' : 'none');
  root.style.setProperty('--card-details-btn-display', cfg.show_details_btn === 'yes' ? 'inline-flex' : 'none');
  root.style.setProperty('--card-enquiry-btn-display', cfg.show_enquiry_btn === 'yes' ? 'inline-flex' : 'none');
}

export const ProductGridProvider: React.FC<{
  children: React.ReactNode;
  initialConfig?: Partial<ProductGridConfig>;
}> = ({ children, initialConfig }) => {
  const [gridConfig, setGridConfig] = useState<ProductGridConfig>(() => ({
    ...DEFAULT_PRODUCT_GRID_CONFIG,
    ...(initialConfig || {}),
  }));
  const [isLoading, setIsLoading] = useState<boolean>(!initialConfig);

  useEffect(() => {
    // If initial config exists, ensure document properties are synced right away
    const active = {
      ...DEFAULT_PRODUCT_GRID_CONFIG,
      ...(initialConfig || {}),
    };
    applyGridStylesToDocument(active);

    async function loadGridConfig() {
      try {
        const res = await fetch('/api/wp/config', { cache: 'no-store' });
        if (!res.ok) return;

        const json = await res.json();
        const serverConfig = json?.data?.productGrid;
        if (serverConfig && typeof serverConfig === 'object') {
          const merged: ProductGridConfig = {
            ...DEFAULT_PRODUCT_GRID_CONFIG,
            ...serverConfig,
          };
          setGridConfig(merged);
          applyGridStylesToDocument(merged);
        }
      } catch (err) {
        console.warn('[ProductGridContext] Failed to load grid config:', err);
      } finally {
        setIsLoading(false);
      }
    }

    loadGridConfig();

    // Re-sync seamlessly when tab regains focus after editing in WP admin
    const onFocus = () => {
      loadGridConfig();
    };
    window.addEventListener('focus', onFocus);
    return () => {
      window.removeEventListener('focus', onFocus);
    };
  }, [initialConfig]);

  const updateGridConfig = (cfg: Partial<ProductGridConfig>) => {
    setGridConfig((prev) => {
      const updated = { ...prev, ...cfg };
      applyGridStylesToDocument(updated);
      return updated;
    });
  };

  return (
    <ProductGridContext.Provider value={{ gridConfig, updateGridConfig, isLoading }}>
      {children}
    </ProductGridContext.Provider>
  );
};

export const useProductGridConfig = () => useContext(ProductGridContext);

