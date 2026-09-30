export interface ProductPageConfig {
  // Featured Image Canvas
  canvas_border: 'none' | 'subtle' | 'solid';
  canvas_shadow: 'none' | 'subtle' | 'elevated';
  canvas_radius: string;
  canvas_bg: string;
  canvas_padding: 'flush' | 'compact' | 'standard' | 'spacious';
  default_fit_mode: 'contain' | 'cover';
  enable_hover_zoom: 'yes' | 'no';
  show_fit_toggle: 'yes' | 'no';
  show_expand_hint: 'yes' | 'no';
  show_counter_badge: 'yes' | 'no';

  // Thumbnails Strip
  thumb_border: 'none' | 'subtle' | 'accent';
  thumb_shadow: 'none' | 'subtle';
  thumb_radius: string;
  thumb_size: 'compact' | 'standard' | 'large';
  thumb_opacity: string;

  // Content & Action Toggles
  show_made_to_order: 'yes' | 'no';
  show_sku: 'yes' | 'no';
  show_category_meta: 'yes' | 'no';
  show_moq: 'yes' | 'no';
  show_lead_time: 'yes' | 'no';
  show_enquiry_btn: 'yes' | 'no';
  enquiry_btn_text: string;
  show_favorite_btn: 'yes' | 'no';
  show_specs_table: 'yes' | 'no';
  show_trust_badges: 'yes' | 'no';
  show_related_products: 'yes' | 'no';
  show_recently_viewed: 'yes' | 'no';
}

export const DEFAULT_PRODUCT_PAGE_CONFIG: ProductPageConfig = {
  canvas_border: 'none',
  canvas_shadow: 'none',
  canvas_radius: '8',
  canvas_bg: '#FFFFFF',
  canvas_padding: 'standard',
  default_fit_mode: 'contain',
  enable_hover_zoom: 'yes',
  show_fit_toggle: 'yes',
  show_expand_hint: 'yes',
  show_counter_badge: 'yes',
  thumb_border: 'none',
  thumb_shadow: 'none',
  thumb_radius: '6',
  thumb_size: 'standard',
  thumb_opacity: '0.65',
  show_made_to_order: 'yes',
  show_sku: 'yes',
  show_category_meta: 'yes',
  show_moq: 'yes',
  show_lead_time: 'yes',
  show_enquiry_btn: 'yes',
  enquiry_btn_text: '+ Add to Project Quote',
  show_favorite_btn: 'yes',
  show_specs_table: 'yes',
  show_trust_badges: 'yes',
  show_related_products: 'yes',
  show_recently_viewed: 'yes',
};

export function getCanvasBorderCss(border: ProductPageConfig['canvas_border']): string {
  switch (border) {
    case 'solid':
      return '1.5px solid #D5CEC2';
    case 'subtle':
      return '1px solid var(--line, #E2DDD5)';
    case 'none':
    default:
      return 'none';
  }
}

export function getCanvasShadowCss(shadow: ProductPageConfig['canvas_shadow']): string {
  switch (shadow) {
    case 'elevated':
      return '0 6px 24px rgba(0, 0, 0, 0.08)';
    case 'subtle':
      return '0 2px 14px rgba(0, 0, 0, 0.04)';
    case 'none':
    default:
      return 'none';
  }
}

export function getCanvasPaddingCss(padding: ProductPageConfig['canvas_padding']): string {
  switch (padding) {
    case 'flush':
      return '0';
    case 'compact':
      return 'clamp(10px, 1.8vw, 16px)';
    case 'spacious':
      return 'clamp(20px, 3.5vw, 36px)';
    case 'standard':
    default:
      return 'clamp(14px, 2.5vw, 28px)';
  }
}

export function getThumbSizePx(size: ProductPageConfig['thumb_size']): number {
  switch (size) {
    case 'compact':
      return 64;
    case 'large':
      return 88;
    case 'standard':
    default:
      return 76;
  }
}
