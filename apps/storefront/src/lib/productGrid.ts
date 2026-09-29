export interface ProductGridConfig {
  aspect_ratio: string;        // '4:3', '1:1', '4:5', '16:9', '3:2'
  image_fit: 'cover' | 'contain' | string;
  thumb_bg: string;            // '#FFFFFF', '#F8F7F5', etc.
  thumb_padding: string;       // '0', '6', '10', '16', '24'
  thumb_radius: string;        // '0', '4', '8', '12', '16'
  card_border: 'subtle' | 'none' | 'medium' | string;
  card_shadow: 'subtle' | 'none' | 'elevated' | 'hover_float' | string;
  hover_zoom: string;          // '1.04', '1.08', '1.0'
  hover_gradient: 'yes' | 'no' | string;

  cols_desktop: string;        // '2', '3', '4'
  cols_mobile: string;         // '1', '2'
  gap_desktop: 'compact' | 'standard' | 'spacious' | string;
  gap_mobile: 'compact' | 'standard' | 'spacious' | string;

  show_badge: 'yes' | 'no' | string;
  show_favorite: 'yes' | 'no' | string;
  show_category: 'yes' | 'no' | string;
  show_made_to_order: 'yes' | 'no' | string;
  show_moq_lead: 'yes' | 'no' | string;
  show_price_note: 'yes' | 'no' | string;
  price_note_text: string;

  show_actions: 'yes' | 'no' | string;
  actions_mode: 'hover_overlay' | 'always_visible' | 'none' | string;
  show_details_btn: 'yes' | 'no' | string;
  show_enquiry_btn: 'yes' | 'no' | string;
  details_btn_text: string;
  enquiry_btn_text: string;
}

export const DEFAULT_PRODUCT_GRID_CONFIG: ProductGridConfig = {
  aspect_ratio: '4:3',
  image_fit: 'cover',
  thumb_bg: '#FFFFFF',
  thumb_padding: '0',
  thumb_radius: '8',
  card_border: 'subtle',
  card_shadow: 'subtle',
  hover_zoom: '1.04',
  hover_gradient: 'yes',

  cols_desktop: '3',
  cols_mobile: '1',
  gap_desktop: 'standard',
  gap_mobile: 'standard',

  show_badge: 'yes',
  show_favorite: 'yes',
  show_category: 'yes',
  show_made_to_order: 'yes',
  show_moq_lead: 'yes',
  show_price_note: 'yes',
  price_note_text: 'Price on request',

  show_actions: 'yes',
  actions_mode: 'hover_overlay',
  show_details_btn: 'yes',
  show_enquiry_btn: 'yes',
  details_btn_text: 'Details',
  enquiry_btn_text: '+ Enquiry',
};

export function formatAspectRatio(ratio: string): string {
  switch (ratio) {
    case '1:1':
      return '1 / 1';
    case '4:5':
      return '4 / 5';
    case '16:9':
      return '16 / 9';
    case '3:2':
      return '3 / 2';
    case '4:3':
    default:
      return '4 / 3';
  }
}

export function generateGridCssVariablesString(cfg: ProductGridConfig): string {
  let borderVal = '1px solid var(--line, #ECE7DE)';
  if (cfg.card_border === 'none') {
    borderVal = 'none';
  } else if (cfg.card_border === 'medium') {
    borderVal = '1px solid #D5CEC2';
  }

  let shadowVal = '0 2px 10px rgba(0, 0, 0, 0.03)';
  if (cfg.card_shadow === 'none') {
    shadowVal = 'none';
  } else if (cfg.card_shadow === 'elevated') {
    shadowVal = '0 4px 16px rgba(0, 0, 0, 0.06)';
  } else if (cfg.card_shadow === 'hover_float') {
    shadowVal = '0 2px 8px rgba(0, 0, 0, 0.02)';
  }

  const zoomFactor = parseFloat(cfg.hover_zoom) || 1.04;
  const colsDesk = parseInt(cfg.cols_desktop, 10) || 3;
  const colsMob = parseInt(cfg.cols_mobile, 10) || 1;

  let gapDesk = '40px 28px';
  if (cfg.gap_desktop === 'compact') {
    gapDesk = '28px 20px';
  } else if (cfg.gap_desktop === 'spacious') {
    gapDesk = '48px 36px';
  }

  let gapMob = '24px 16px';
  if (cfg.gap_mobile === 'compact') {
    gapMob = '16px 12px';
  } else if (cfg.gap_mobile === 'spacious') {
    gapMob = '36px 0px';
  }

  const hasActions = cfg.show_actions === 'yes' && cfg.actions_mode !== 'none';

  return `
    :root {
      --card-aspect-ratio: ${formatAspectRatio(cfg.aspect_ratio)};
      --card-object-fit: ${cfg.image_fit === 'contain' ? 'contain' : 'cover'};
      --card-thumb-bg: ${cfg.thumb_bg || '#FFFFFF'};
      --card-thumb-padding: ${cfg.thumb_padding || '0'}px;
      --card-radius: ${cfg.thumb_radius || '8'}px;
      --card-border: ${borderVal};
      --card-shadow: ${shadowVal};
      --card-hover-zoom: ${zoomFactor <= 1 ? 'scale(1) translateZ(0)' : `scale(${zoomFactor}) translateZ(0)`};
      --card-hover-gradient-opacity: ${cfg.hover_gradient === 'yes' ? '1' : '0'};
      --grid-cols-desktop: repeat(${colsDesk}, 1fr);
      --grid-cols-mobile: ${colsMob === 2 ? 'repeat(2, 1fr)' : '1fr'};
      --grid-gap-desktop: ${gapDesk};
      --grid-gap-mobile: ${gapMob};
      --card-badge-display: ${cfg.show_badge === 'yes' ? 'inline-block' : 'none'};
      --card-fav-display: ${cfg.show_favorite === 'yes' ? 'flex' : 'none'};
      --card-category-display: ${cfg.show_category === 'yes' ? 'inline-block' : 'none'};
      --card-mto-display: ${cfg.show_made_to_order === 'yes' ? 'inline-flex' : 'none'};
      --card-moq-lead-display: ${cfg.show_moq_lead === 'yes' ? 'flex' : 'none'};
      --card-price-display: ${cfg.show_price_note === 'yes' ? 'inline-block' : 'none'};
      --card-acts-display: ${(hasActions && cfg.actions_mode === 'hover_overlay') ? 'flex' : 'none'};
      --card-acts-inline-display: ${(hasActions && cfg.actions_mode === 'always_visible') ? 'flex' : 'none'};
      --card-details-btn-display: ${cfg.show_details_btn === 'yes' ? 'inline-flex' : 'none'};
      --card-enquiry-btn-display: ${cfg.show_enquiry_btn === 'yes' ? 'inline-flex' : 'none'};
    }
  `;
}
