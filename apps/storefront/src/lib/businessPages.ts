export interface FormFieldConfig {
  id: string;
  name: string;
  label: string;
  type: 'text' | 'email' | 'tel' | 'select' | 'checkbox_group' | 'textarea' | 'file' | 'url' | 'number';
  placeholder?: string;
  width: 'half' | 'full';
  required: boolean;
  options?: string; // newline or comma-delimited options for select/checkbox_group
  help_text?: string;
}

export interface BusinessPageVisual {
  image_url: string;
  tag: string;
  headline: string;
}

export interface BusinessPageForm {
  eyebrow: string;
  title: string;
  notice: string;
  review_note: string;
  submit_button_text: string;
  success_title: string;
  success_message: string;
  fields: FormFieldConfig[];
}

export interface BusinessPageSEO {
  title: string;
  description: string;
  focus_keyword?: string;
  og_image?: string;
  canonical_url?: string;
  robots?: string;
}

export interface BusinessPageConfig {
  slug: string;
  tab_number: string;
  tab_label: string;
  page_eyebrow: string;
  page_title: string;
  page_subtitle: string;
  enquiry_number: string;
  visual: BusinessPageVisual;
  form: BusinessPageForm;
  seo: BusinessPageSEO;
}

export interface BusinessPageTab {
  slug: string;
  number: string;
  label: string;
  href: string;
}

export const BUSINESS_TABS: BusinessPageTab[] = [
  { slug: 'suppliers-vendors', number: '01', label: 'Suppliers & Vendors', href: '/suppliers-vendors' },
  { slug: 'interior-designers', number: '02', label: 'Architects & Interior Designers', href: '/interior-designers' },
  { slug: 'influencers-marketing', number: '03', label: 'Influencers & Marketing', href: '/influencers-marketing' },
  { slug: 'furniture-decor-designers', number: '04', label: 'Furniture & Décor Designers', href: '/furniture-decor-designers' },
];

export const DEFAULT_BUSINESS_PAGES: Record<string, BusinessPageConfig> = {
  'suppliers-vendors': {
    slug: 'suppliers-vendors',
    tab_number: '01',
    tab_label: 'Suppliers & Vendors',
    page_eyebrow: 'BUSINESS',
    page_title: 'Become part of our maker network.',
    page_subtitle: 'Share your materials, manufacturing capabilities or specialist services with our sourcing team.',
    enquiry_number: '01',
    visual: {
      image_url: '/business/left-visual-chair.jpg',
      tag: 'MADE IN JODHPUR · MADE FOR THE WORLD',
      headline: 'Responsible sourcing. Considered craft. Partnerships built for the long term.',
    },
    form: {
      eyebrow: 'SUPPLIER & VENDOR ENQUIRY',
      title: 'Introduce your capabilities.',
      notice: 'Fields marked * are required.',
      review_note: 'We usually review business enquiries within 2–3 working days.',
      submit_button_text: 'Submit enquiry →',
      success_title: 'Enquiry Received',
      success_message: 'Thank you for introducing your capabilities. Our procurement & materials team will review your profile and reach out within 2–3 working days.',
      fields: [
        {
          id: 'sv_1',
          name: 'company_name',
          label: 'Business / workshop name',
          type: 'text',
          placeholder: 'Company or workshop name',
          width: 'half',
          required: true,
        },
        {
          id: 'sv_2',
          name: 'contact_person',
          label: 'Contact person',
          type: 'text',
          placeholder: 'Full name',
          width: 'half',
          required: true,
        },
        {
          id: 'sv_3',
          name: 'email',
          label: 'Work email',
          type: 'email',
          placeholder: 'name@company.com',
          width: 'half',
          required: true,
        },
        {
          id: 'sv_4',
          name: 'phone',
          label: 'Phone / WhatsApp',
          type: 'tel',
          placeholder: '+91',
          width: 'half',
          required: true,
        },
        {
          id: 'sv_5',
          name: 'city_country',
          label: 'City & country',
          type: 'text',
          placeholder: 'Where are you based?',
          width: 'half',
          required: true,
        },
        {
          id: 'sv_6',
          name: 'business_type',
          label: 'Business type',
          type: 'select',
          placeholder: 'Select an option',
          width: 'half',
          required: true,
          options: "Raw Material Producer / Timber Mill\nArchitectural Metal & Hardware Specialist\nStone & Marble Quarry / Processor\nContract Upholstery & Leather Tanner\nCane & Hand-weaving Workshop\nPaints, Stains & Industrial Coatings Supplier\nPackaging & Export Wood Crating Vendor\nLogistics & Freight Forwarding Company\nOther Specialist Maker / Fabricator",
        },
        {
          id: 'sv_7',
          name: 'supply_categories',
          label: 'What can you supply?',
          type: 'checkbox_group',
          placeholder: '',
          width: 'full',
          required: true,
          options: "Solid wood\nMetal\nStone / marble\nUpholstery\nDécor\nHardware\nPackaging",
        },
        {
          id: 'sv_8',
          name: 'production_capacity',
          label: 'Production capacity',
          type: 'text',
          placeholder: 'Monthly capacity or MOQ',
          width: 'half',
          required: false,
        },
        {
          id: 'sv_9',
          name: 'certifications',
          label: 'Certifications',
          type: 'text',
          placeholder: 'FSC, Vriksh, ISO or others',
          width: 'half',
          required: false,
        },
        {
          id: 'sv_10',
          name: 'website_catalog',
          label: 'Website / catalogue link',
          type: 'url',
          placeholder: 'https://',
          width: 'full',
          required: false,
        },
        {
          id: 'sv_11',
          name: 'attach_catalog',
          label: 'Attach catalogue or company profile',
          type: 'file',
          placeholder: '',
          width: 'full',
          required: false,
          help_text: 'PDF, JPG or PNG · up to 10 MB',
        },
        {
          id: 'sv_12',
          name: 'distinctive_notes',
          label: 'Tell us what makes your offering distinctive',
          type: 'textarea',
          placeholder: 'Materials, finishes, lead times and collaboration proposal',
          width: 'full',
          required: true,
        },
        {
          id: 'sv_13',
          name: 'consent',
          label: 'Consent',
          type: 'checkbox_group',
          placeholder: '',
          width: 'full',
          required: true,
          options: 'I agree that Orbit Expo Crafts may contact me regarding this enquiry.',
        },
      ],
    },
    seo: {
      title: 'Suppliers & Vendors Partnership | Orbit Expo Crafts',
      description: 'Partner with Orbit Expo Crafts as a verified supplier of solid wood, architectural metal, stone, upholstery, and export packaging materials.',
      focus_keyword: 'furniture suppliers, timber vendors, woodcraft manufacturing materials, orbit expo crafts suppliers',
      og_image: '/business/suppliers-vendors.jpeg',
      canonical_url: '/suppliers-vendors',
      robots: 'index, follow',
    },
  },

  'interior-designers': {
    slug: 'interior-designers',
    tab_number: '02',
    tab_label: 'Architects & Interior Designers',
    page_eyebrow: 'BUSINESS',
    page_title: 'Bring your project vision into form.',
    page_subtitle: 'Collaborate on custom furniture, coordinated room packages and made-to-specification manufacturing.',
    enquiry_number: '02',
    visual: {
      image_url: '/business/left-visual-chair.jpg',
      tag: 'MADE IN JODHPUR · MADE FOR THE WORLD',
      headline: 'From drawings to finished pieces, we help translate spatial concepts into enduring furniture.',
    },
    form: {
      eyebrow: 'ARCHITECT & INTERIOR DESIGNER ENQUIRY',
      title: 'Tell us about your project.',
      notice: 'Fields marked * are required.',
      review_note: 'We usually review business enquiries within 2–3 working days.',
      submit_button_text: 'Submit enquiry →',
      success_title: 'Enquiry Received',
      success_message: 'Thank you for your project enquiry. Our design trade desk will review your specifications and reach out within 2–3 working days.',
      fields: [
        {
          id: 'id_1',
          name: 'studio_name',
          label: 'Studio / firm name',
          type: 'text',
          placeholder: 'Practice name',
          width: 'half',
          required: true,
        },
        {
          id: 'id_2',
          name: 'contact_person',
          label: 'Contact person',
          type: 'text',
          placeholder: 'Full name',
          width: 'half',
          required: true,
        },
        {
          id: 'id_3',
          name: 'email',
          label: 'Work email',
          type: 'email',
          placeholder: 'name@studio.com',
          width: 'half',
          required: true,
        },
        {
          id: 'id_4',
          name: 'phone',
          label: 'Phone / WhatsApp',
          type: 'tel',
          placeholder: '+91',
          width: 'half',
          required: true,
        },
        {
          id: 'id_5',
          name: 'project_type',
          label: 'Project type',
          type: 'select',
          placeholder: 'Select an option',
          width: 'half',
          required: true,
          options: "Luxury Residential\nBoutique Hotel & Resort\nRestaurant / Bar / Café\nCommercial / Corporate Office\nRetail Concept Store\nPrivate Villa Estate",
        },
        {
          id: 'id_6',
          name: 'project_location',
          label: 'Project location',
          type: 'text',
          placeholder: 'City & country',
          width: 'half',
          required: true,
        },
        {
          id: 'id_7',
          name: 'required_support',
          label: 'Required support',
          type: 'checkbox_group',
          placeholder: '',
          width: 'full',
          required: true,
          options: "Loose furniture\nCustom furniture\nComplete room packages\nPrototyping\nDécor & accessories\nMaterial consultation",
        },
        {
          id: 'id_8',
          name: 'estimated_budget',
          label: 'Estimated furniture budget',
          type: 'select',
          placeholder: 'Select an option',
          width: 'half',
          required: false,
          options: "Under ₹10,00,000 / $12,000\n₹10,00,000 – ₹25,00,000 / $12,000–$30,000\n₹25,00,000 – ₹50,00,000 / $30,000–$60,000\n₹50,00,000+ / $60,000+",
        },
        {
          id: 'id_9',
          name: 'target_installation_date',
          label: 'Target installation date',
          type: 'text',
          placeholder: 'Month / year',
          width: 'half',
          required: false,
        },
        {
          id: 'id_10',
          name: 'studio_link',
          label: 'Studio or project link',
          type: 'url',
          placeholder: 'https://',
          width: 'full',
          required: false,
        },
        {
          id: 'id_11',
          name: 'drawings_attachment',
          label: 'Attach drawings or moodboard',
          type: 'file',
          placeholder: '',
          width: 'full',
          required: false,
          help_text: 'PDF, DWG preview, JPG or PNG - up to 10 MB',
        },
        {
          id: 'id_12',
          name: 'project_brief',
          label: 'Project brief',
          type: 'textarea',
          placeholder: 'Scope, quantities, materials, finishes and key expectations',
          width: 'full',
          required: true,
        },
        {
          id: 'id_13',
          name: 'consent',
          label: 'Consent',
          type: 'checkbox_group',
          placeholder: '',
          width: 'full',
          required: true,
          options: 'I agree that Orbit Expo Crafts may contact me regarding this enquiry.',
        },
      ],
    },
    seo: {
      title: 'Architects & Interior Designers Trade Program | Orbit Expo Crafts',
      description: 'Bespoke contract furniture manufacturing for architects, interior designers, and hospitality specifiers worldwide.',
      focus_keyword: 'interior design trade program, bespoke contract furniture, architectural furniture manufacturing',
      og_image: '/business/architects-interior-designers.jpeg',
      canonical_url: '/interior-designers',
      robots: 'index, follow',
    },
  },

  'influencers-marketing': {
    slug: 'influencers-marketing',
    tab_number: '03',
    tab_label: 'Influencers & Marketing',
    page_eyebrow: 'BUSINESS',
    page_title: 'Bring your project vision into form.',
    page_subtitle: 'Collaborate on custom furniture, coordinated room packages and made-to-specification manufacturing.',
    enquiry_number: '03',
    visual: {
      image_url: '/Explore_collection.webp',
      tag: 'MADE IN JODHPUR · MADE FOR THE WORLD',
      headline: 'Celebrating craft, artisanal heritage, and contemporary living with creative storytellers.',
    },
    form: {
      eyebrow: 'INFLUENCER & MARKETING ENQUIRY',
      title: 'Let’s create inspiring stories together.',
      notice: 'Fields marked * are required.',
      review_note: 'We usually review business enquiries within 2–3 working days.',
      submit_button_text: 'Submit enquiry →',
      success_title: 'Enquiry Received',
      success_message: 'Thank you for your collaboration pitch! Our brand marketing team will review your channels and get back to you shortly.',
      fields: [
        {
          id: 'inf_1',
          name: 'creator_name',
          label: 'Creator / Agency name',
          type: 'text',
          placeholder: 'Full name or brand name',
          width: 'half',
          required: true,
        },
        {
          id: 'inf_2',
          name: 'contact_person',
          label: 'Contact person',
          type: 'text',
          placeholder: 'Contact name / Representative',
          width: 'half',
          required: true,
        },
        {
          id: 'inf_3',
          name: 'email',
          label: 'Work email',
          type: 'email',
          placeholder: 'collab@yourbrand.com',
          width: 'half',
          required: true,
        },
        {
          id: 'inf_4',
          name: 'phone',
          label: 'Phone / WhatsApp',
          type: 'tel',
          placeholder: '+91',
          width: 'half',
          required: true,
        },
        {
          id: 'inf_5',
          name: 'primary_platform',
          label: 'Primary Platform',
          type: 'select',
          placeholder: 'Select an option',
          width: 'half',
          required: true,
          options: "Instagram\nYouTube\nPinterest\nArchitectural / Design Editorial Blog\nTikTok\nPodcast / Media Publication",
        },
        {
          id: 'inf_6',
          name: 'social_handle',
          label: 'Social handle or channel URL',
          type: 'text',
          placeholder: '@yourhandle or https://instagram.com/...',
          width: 'half',
          required: true,
        },
        {
          id: 'inf_7',
          name: 'collaboration_format',
          label: 'Collaboration format interested in',
          type: 'checkbox_group',
          placeholder: '',
          width: 'full',
          required: true,
          options: "Home Styling & Product Placement\nFactory Craftsmanship & Heritage Tour Video\nDesign Editorial & Long-form Story\nAffiliate & Brand Ambassador Partnership\nCo-created Capsule Furniture Collection",
        },
        {
          id: 'inf_8',
          name: 'media_kit',
          label: 'Attach media kit or portfolio',
          type: 'file',
          placeholder: '',
          width: 'full',
          required: false,
          help_text: 'PDF or image up to 10 MB',
        },
        {
          id: 'inf_9',
          name: 'proposal_pitch',
          label: 'Collaboration vision & audience summary',
          type: 'textarea',
          placeholder: 'Tell us about your audience demographics, past brand partnerships, and your creative vision...',
          width: 'full',
          required: true,
        },
        {
          id: 'inf_10',
          name: 'consent',
          label: 'Consent',
          type: 'checkbox_group',
          placeholder: '',
          width: 'full',
          required: true,
          options: 'I agree that Orbit Expo Crafts may contact me regarding this enquiry.',
        },
      ],
    },
    seo: {
      title: 'Influencers & Brand Marketing Collaborations | Orbit Expo Crafts',
      description: 'Collaborate with Orbit Expo Crafts on design-led content, editorial styling, and artisanal craft storytelling.',
      focus_keyword: 'furniture influencer collaboration, interior design brand partnership, craft marketing',
      og_image: '/business/influencers-marketing.jpeg',
      canonical_url: '/influencers-marketing',
      robots: 'index, follow',
    },
  },

  'furniture-decor-designers': {
    slug: 'furniture-decor-designers',
    tab_number: '04',
    tab_label: 'Furniture & Décor Designers',
    page_eyebrow: 'BUSINESS',
    page_title: 'Bring your project vision into form.',
    page_subtitle: 'Collaborate on custom furniture, coordinated room packages and made-to-specification manufacturing.',
    enquiry_number: '04',
    visual: {
      image_url: '/Project.webp',
      tag: 'MADE IN JODHPUR · MADE FOR THE WORLD',
      headline: 'Your sketches, rendered in solid hardwoods, architectural brass, and handcrafted textures.',
    },
    form: {
      eyebrow: 'FURNITURE & DÉCOR DESIGNER ENQUIRY',
      title: 'Bring your furniture product line to life.',
      notice: 'Fields marked * are required.',
      review_note: 'We usually review business enquiries within 2–3 working days.',
      submit_button_text: 'Submit enquiry →',
      success_title: 'Enquiry Received',
      success_message: 'Thank you for sharing your design brief. Our engineering and master carpentry team will review your designs and get in touch within 2–3 working days.',
      fields: [
        {
          id: 'fd_1',
          name: 'designer_studio',
          label: 'Designer / Studio name',
          type: 'text',
          placeholder: 'Studio or individual designer name',
          width: 'half',
          required: true,
        },
        {
          id: 'fd_2',
          name: 'contact_person',
          label: 'Contact person',
          type: 'text',
          placeholder: 'Full name',
          width: 'half',
          required: true,
        },
        {
          id: 'fd_3',
          name: 'email',
          label: 'Work email',
          type: 'email',
          placeholder: 'designer@studio.com',
          width: 'half',
          required: true,
        },
        {
          id: 'fd_4',
          name: 'phone',
          label: 'Phone / WhatsApp',
          type: 'tel',
          placeholder: '+91',
          width: 'half',
          required: true,
        },
        {
          id: 'fd_5',
          name: 'collection_category',
          label: 'Category of design',
          type: 'select',
          placeholder: 'Select an option',
          width: 'half',
          required: true,
          options: "Seating (Chairs, Benches, Lounge)\nTables & Desks\nStorage, Credenzas & Cabinets\nBeds & Bedroom Furniture\nLighting & Architectural Objects\nHome Décor & Accents\nFull Collection Across Categories",
        },
        {
          id: 'fd_6',
          name: 'manufacturing_intent',
          label: 'Manufacturing intent',
          type: 'select',
          placeholder: 'Select an option',
          width: 'half',
          required: true,
          options: "Prototyping & Sample Sign-off\nLimited Edition Production Runs\nWhite-label / Private Label Brand Line\nContract Hospitality Project Batch\nRoyalty Licensing Collaboration",
        },
        {
          id: 'fd_7',
          name: 'preferred_materials',
          label: 'Preferred primary materials',
          type: 'checkbox_group',
          placeholder: '',
          width: 'full',
          required: true,
          options: "Solid Teak & Sheesham\nEuropean White Oak & Walnut\nArchitectural Cast Brass & Iron\nNatural Marble & Indian Sandstone\nWoven Cane & Cord\nFull-grain Leather & Upholstery",
        },
        {
          id: 'fd_8',
          name: 'portfolio_url',
          label: 'Portfolio / Website URL',
          type: 'url',
          placeholder: 'https://',
          width: 'full',
          required: false,
        },
        {
          id: 'fd_9',
          name: 'cad_sketches_upload',
          label: 'Attach concept sketches or CAD drawings',
          type: 'file',
          placeholder: '',
          width: 'full',
          required: false,
          help_text: 'PDF, DWG preview, JPG, PNG or STEP/ZIP - up to 10 MB',
        },
        {
          id: 'fd_10',
          name: 'design_brief',
          label: 'Design concept & production requirements',
          type: 'textarea',
          placeholder: 'Describe your designs, expected batch quantities, target price point, and timeline...',
          width: 'full',
          required: true,
        },
        {
          id: 'fd_11',
          name: 'consent',
          label: 'Consent',
          type: 'checkbox_group',
          placeholder: '',
          width: 'full',
          required: true,
          options: 'I agree that Orbit Expo Crafts may contact me regarding this enquiry.',
        },
      ],
    },
    seo: {
      title: 'Furniture & Décor Designers Manufacturing Partner | Orbit Expo Crafts',
      description: 'Turn your furniture designs into market-ready handcrafted collections with Orbit Expo Crafts factory manufacturing.',
      focus_keyword: 'furniture designer manufacturing partner, white label furniture production, custom woodcraft manufacturing',
      og_image: '/business/furniture-decor-designers.jpeg',
      canonical_url: '/furniture-decor-designers',
      robots: 'index, follow',
    },
  },
};

function getWpOrigin(): string {
  let url = process.env.WORDPRESS_URL || process.env.NEXT_PUBLIC_WORDPRESS_URL;
  if (!url) {
    url = process.env.NODE_ENV === 'development' ? 'http://woo-catalog-nextjs.local' : 'https://admin.orbitexpocrafts.com';
  }
  return url.replace(/\/$/, '');
}

/**
 * Fetch business page data by slug with multi-tier failover and ISR caching
 */
export async function fetchBusinessPageConfig(slug: string): Promise<BusinessPageConfig> {
  const normalizedSlug = slug.replace(/^\//, '').replace(/\/$/, '');
  const fallback = DEFAULT_BUSINESS_PAGES[normalizedSlug] || DEFAULT_BUSINESS_PAGES['suppliers-vendors'];
  const wpBase = getWpOrigin();

  try {
    // Primary: index.php?rest_route query
    const res = await fetch(`${wpBase}/index.php?rest_route=/hcc/v1/business-pages/${normalizedSlug}`, {
      next: { revalidate: 60, tags: ['business-pages', `business-page-${normalizedSlug}`] },
      headers: { Accept: 'application/json' },
    }).catch(() => null);

    if (res && res.ok) {
      const json = await res.json().catch(() => null);
      if (json && json.success && json.data) {
        return mergeWithDefaults(json.data, fallback);
      }
    }

    // Secondary: /wp-json/ permalink
    const resWpJson = await fetch(`${wpBase}/wp-json/hcc/v1/business-pages/${normalizedSlug}`, {
      next: { revalidate: 60, tags: ['business-pages', `business-page-${normalizedSlug}`] },
      headers: { Accept: 'application/json' },
    }).catch(() => null);

    if (resWpJson && resWpJson.ok) {
      const json = await resWpJson.json().catch(() => null);
      if (json && json.success && json.data) {
        return mergeWithDefaults(json.data, fallback);
      }
    }
  } catch (err) {
    console.warn(`[fetchBusinessPageConfig] Failed fetching WordPress config for "${normalizedSlug}", using default fallback:`, err);
  }

  return fallback;
}

function mergeWithDefaults(remote: any, fallback: BusinessPageConfig): BusinessPageConfig {
  return {
    slug: remote.slug || fallback.slug,
    tab_number: remote.tab_number || fallback.tab_number,
    tab_label: remote.tab_label || fallback.tab_label,
    page_eyebrow: remote.page_eyebrow || fallback.page_eyebrow,
    page_title: remote.page_title || fallback.page_title,
    page_subtitle: remote.page_subtitle || fallback.page_subtitle,
    enquiry_number: remote.enquiry_number || fallback.enquiry_number,
    visual: {
      image_url: remote.visual?.image_url || fallback.visual.image_url,
      tag: remote.visual?.tag || fallback.visual.tag,
      headline: remote.visual?.headline || fallback.visual.headline,
    },
    form: {
      eyebrow: remote.form?.eyebrow || fallback.form.eyebrow,
      title: remote.form?.title || fallback.form.title,
      notice: remote.form?.notice || fallback.form.notice,
      review_note: remote.form?.review_note || fallback.form.review_note,
      submit_button_text: remote.form?.submit_button_text || fallback.form.submit_button_text,
      success_title: remote.form?.success_title || fallback.form.success_title,
      success_message: remote.form?.success_message || fallback.form.success_message,
      fields: Array.isArray(remote.form?.fields) && remote.form.fields.length > 0
        ? remote.form.fields
        : fallback.form.fields,
    },
    seo: {
      title: remote.seo?.title || fallback.seo.title,
      description: remote.seo?.description || fallback.seo.description,
      focus_keyword: remote.seo?.focus_keyword || fallback.seo.focus_keyword,
      og_image: remote.seo?.og_image || fallback.seo.og_image,
      canonical_url: remote.seo?.canonical_url || fallback.seo.canonical_url,
      robots: remote.seo?.robots || fallback.seo.robots,
    },
  };
}
