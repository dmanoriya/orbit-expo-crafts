'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { SEGMENTS, MATERIALS, MOCK_PRODUCTS, ProductItem, getProductSlug } from '../data/catalogData';
import { useEnquiry } from '../context/EnquiryContext';
import { useFavorites } from '../context/FavoritesContext';
import {
  fetchWpStorefrontData,
  fetchWpHomepageData,
  WpCategoryItem,
  HomepageData,
  DEFAULT_HOMEPAGE_DATA,
} from '../lib/wpCommerce';
import { isKnownDepartment } from '../lib/categoryTaxonomy';

interface HomeClientViewProps {
  initialProducts: ProductItem[];
  initialCategories: WpCategoryItem[];
  initialMaterials?: string[];
  initialHpData: HomepageData;
  isWpConnected: boolean;
}

export default function HomeClientView({
  initialProducts,
  initialCategories,
  initialMaterials,
  initialHpData,
  isWpConnected: initialWpConnected,
}: HomeClientViewProps) {
  const { addEnquiry } = useEnquiry();
  const { isFavorite, toggleFavorite } = useFavorites();
  const [products, setProducts] = useState<ProductItem[]>(initialProducts || MOCK_PRODUCTS);
  const [categories, setCategories] = useState<WpCategoryItem[]>(initialCategories || []);
  const [materialsList, setMaterialsList] = useState<string[]>(
    initialMaterials && initialMaterials.length > 0 ? initialMaterials : MATERIALS
  );
  const [hpData, setHpData] = useState<HomepageData>(initialHpData || DEFAULT_HOMEPAGE_DATA);
  const [isWpConnected, setIsWpConnected] = useState(initialWpConnected);

  // Client-side re-sync on client mount for soft navigations
  useEffect(() => {
    async function refreshData() {
      const [sfData, homepageConfig] = await Promise.all([
        fetchWpStorefrontData(),
        fetchWpHomepageData(),
      ]);
      setProducts(sfData.products);
      setCategories(sfData.categories);
      if (sfData.materials && sfData.materials.length > 0) {
        setMaterialsList(sfData.materials);
      }
      setIsWpConnected(sfData.isWpConnected);
      setHpData(homepageConfig);
    }
    refreshData();
  }, []);

  const EXCLUDED_HOMEPAGE_MATERIALS = React.useMemo(
    () => new Set(['bone inlay', 'genuine leather', 'rope weave', 'tile inlay', 'vegan leather']),
    []
  );

  // Complete list of materials and heritage crafts
  const allMaterials = React.useMemo(() => {
    const set = new Set<string>();
    materialsList.forEach((m) => { if (m) set.add(m); });
    MATERIALS.forEach((m) => { if (m) set.add(m); });
    products.forEach((p) => {
      if (p.material) set.add(p.material);
      if ((p as any).material2) set.add((p as any).material2);
      if (Array.isArray((p as any).attributes?.pa_material)) {
        (p as any).attributes.pa_material.forEach((m: string) => { if (m) set.add(m); });
      }
      if (Array.isArray((p as any).attributes?.material)) {
        (p as any).attributes.material.forEach((m: string) => { if (m) set.add(m); });
      }
    });
    return Array.from(set)
      .filter((m) => Boolean(m) && !EXCLUDED_HOMEPAGE_MATERIALS.has(m.toLowerCase().trim()))
      .sort((a, b) => a.localeCompare(b));
  }, [materialsList, products, EXCLUDED_HOMEPAGE_MATERIALS]);

  const featured = products.slice(0, 6);

  const newArrivals = React.useMemo(() => {
    const marked = products.filter((p) => p.badge === 'New' || (p as any).is_new);
    if (marked.length > 0) return marked.slice(0, 4);
    return products.slice(0, 4);
  }, [products]);

  // Helper to split bullet points string into array
  const parsePoints = (str: string) =>
    str
      ? str
          .split('\n')
          .map((p) => p.trim())
          .filter(Boolean)
      : [];

  const track1Points = parsePoints(hpData.track1_points);
  const track2Points = parsePoints(hpData.track2_points);

  // Fallback 8 categories matching 4 cols x 2 rows
  const fallbackCategories = [
    { id: 'furniture', slug: 'furniture', name: 'Furniture', image: '/categories/every-room/furniture.webp' },
    { id: 'home-decor', slug: 'home-decor', name: 'Home Décor', image: '/categories/every-room/home-decor.webp' },
    { id: 'wall-decor-and-mirrors', slug: 'wall-decor-and-mirrors', name: 'Wall Décor & Mirrors', image: '/categories/every-room/wall-decor-mirrors.webp' },
    { id: 'lighting', slug: 'lighting', name: 'Lighting', image: '/categories/every-room/lighting.webp' },
    { id: 'storage-and-organization', slug: 'storage-and-organization', name: 'Storage & Organization', image: '/categories/every-room/storage-organization.webp' },
    { id: 'kitchen-and-tabletop', slug: 'kitchen-and-tabletop', name: 'Kitchen & Tabletop', image: '/categories/every-room/kitchen-tabletop.webp' },
    { id: 'outdoor-and-garden', slug: 'outdoor-and-garden', name: 'Outdoor & Garden', image: '/categories/every-room/outdoor-garden.webp' },
    { id: 'kids-and-baby-home', slug: 'kids-and-baby-home', name: 'Kids & Baby Home', image: '/categories/every-room/kids-baby-home.webp' },
  ];

  const FALLBACK_DEPT_IMAGES: Record<string, string> = {
    'furniture': '/categories/every-room/furniture.webp',
    'home-decor': '/categories/every-room/home-decor.webp',
    'wall-decor-and-mirrors': '/categories/every-room/wall-decor-mirrors.webp',
    'lighting': '/categories/every-room/lighting.webp',
    'storage-and-organization': '/categories/every-room/storage-organization.webp',
    'kitchen-and-tabletop': '/categories/every-room/kitchen-tabletop.webp',
    'outdoor-and-garden': '/categories/every-room/outdoor-garden.webp',
    'kids-and-baby-home': '/categories/every-room/kids-baby-home.webp',
  };

  const DEPT_ORDER = [
    'furniture',
    'home-decor',
    'wall-decor-and-mirrors',
    'lighting',
    'storage-and-organization',
    'kitchen-and-tabletop',
    'outdoor-and-garden',
    'kids-and-baby-home',
  ];

  const DEPT_DISPLAY_NAMES: Record<string, string> = {
    'furniture': 'Furniture',
    'home-decor': 'Home Décor',
    'wall-decor-and-mirrors': 'Wall Décor & Mirrors',
    'lighting': 'Lighting',
    'storage-and-organization': 'Storage & Organization',
    'kitchen-and-tabletop': 'Kitchen & Tabletop',
    'outdoor-and-garden': 'Outdoor & Garden',
    'kids-and-baby-home': 'Kids & Baby Home',
  };

  const EXCLUDED_SECTION_SLUGS = new Set([
    'rugs-and-floor-coverings',
    'rugs-and-flooring',
    'rugs-flooring',
    'pet-home',
    'pet-living',
    'pets',
  ]);

  const displayCategories = React.useMemo(() => {
    if (categories && categories.length > 0) {
      const mainDepts = categories.filter(
        (c) =>
          (!c.parent || c.parent === 0 || c.level === 0) &&
          c.slug !== 'uncategorized' &&
          !EXCLUDED_SECTION_SLUGS.has(c.slug) &&
          !EXCLUDED_SECTION_SLUGS.has(String(c.id))
      );
      if (mainDepts.length > 0) {
        return [...mainDepts]
          .sort((a, b) => {
            const idxA = DEPT_ORDER.indexOf(a.slug);
            const idxB = DEPT_ORDER.indexOf(b.slug);
            if (idxA !== -1 && idxB !== -1) return idxA - idxB;
            if (idxA !== -1) return -1;
            if (idxB !== -1) return 1;
            return a.name.localeCompare(b.name);
          })
          .slice(0, 8);
      }
    }
    return fallbackCategories;
  }, [categories]);

  // Project domain spaces matching prototype (dynamically customizable from WordPress backend)
  const projectSpaces = [
    {
      id: 'hotel-guestrooms',
      name: hpData.seg1_name || 'Hotel Guestrooms',
      image: hpData.seg1_image || '/project-categories/hotel-guestrooms.webp',
      url: hpData.seg1_url || '/collections?seg=Hotel%20Guestrooms',
    },
    {
      id: 'hotel-lobby',
      name: hpData.seg2_name || 'Hotel Lobby',
      image: hpData.seg2_image || '/project-categories/hotel-lobby.webp',
      url: hpData.seg2_url || '/collections?seg=Hotel%20Lobby',
    },
    {
      id: 'restaurant',
      name: hpData.seg3_name || 'Restaurant',
      image: hpData.seg3_image || '/project-categories/restaurant.webp',
      url: hpData.seg3_url || '/collections?seg=Restaurant',
    },
    {
      id: 'cafe-bistro',
      name: hpData.seg4_name || 'Café & Bistro',
      image: hpData.seg4_image || '/project-categories/cafe-bistro.webp',
      url: hpData.seg4_url || '/collections?seg=Caf%C3%A9%20%26%20Bistro',
    },
  ];


  // Hero Image Slider slides
  const heroSlides = [
    { id: 1, image: '/categories/decor.jpg', alt: 'Bone Inlay Console & Rajasthan Crafts' },
    { id: 2, image: '/categories/sofas.jpg', alt: 'Luxury Hotel Suite & Contract Seating' },
    { id: 3, image: '/categories/tables.jpg', alt: 'Solid Wood Dining & Fine Joinery' },
    { id: 4, image: '/categories/beds.jpg', alt: 'Turnkey Bedroom Suite Packages' },
  ];

  const [currentSlide, setCurrentSlide] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % heroSlides.length);
    }, 4000);
    return () => clearInterval(timer);
  }, [heroSlides.length]);

  const heroBgImage =
    hpData.hero_bg_image &&
    !hpData.hero_bg_image.includes('category-outdoor.jpg') &&
    !hpData.hero_bg_image.includes('category-sofas.jpg') &&
    !hpData.hero_bg_image.includes('hero_section_bg.webp')
      ? hpData.hero_bg_image
      : '/hero_bg.webp';

  const catTitle =
    !hpData.cat_title || hpData.cat_title === 'Ten categories. Every piece a room needs.'
      ? 'Categories. Every piece a home needs'
      : hpData.cat_title;

  const catDesc =
    !hpData.cat_desc ||
    hpData.cat_desc ===
      'From solid wood seating to complex bone inlay casegoods — every piece is built to order in our Udaipur and Jodhpur manufacturing facilities.'
      ? 'From solid wood seating to custom storage furniture, every piece is made to order in our manufacturing facilities.'
      : hpData.cat_desc;

  return (
    <div>
      {/* 1. NEW PRIORITY GALLERY HERO SECTION (THE LIVING GALLERY) */}
      <section 
        className="hero-gallery-banner" 
        style={{ 
          backgroundImage: `url(${heroBgImage})`,
          backgroundColor: hpData.hero_bg_color || '#F5F2EC'
        }}
      >
        <div className="hero-gallery-overlay" />
        <div className="wrap hero-gallery-container">
          {/* Mobile-dedicated hero media to showcase full photography without heavy text wash */}
          <div className="hero-gallery-mobile-media">
            <img
              src={heroBgImage}
              alt={hpData.hero_title || 'The Living Gallery'}
              className="hero-gallery-mobile-img"
            />
          </div>

          <div className="hero-gallery-content">
            <span className="hero-gallery-eyebrow">
              {hpData.hero_eyebrow || 'THE LIVING GALLERY'}
            </span>

            <h1 className="hero-gallery-title">
              {hpData.hero_title || 'Objects with a life beyond trends.'}
            </h1>

            <p className="hero-gallery-lede">
              {hpData.hero_lede || 'Handcrafted furniture and décor, shaped by enduring materials and thoughtful detail.'}
            </p>

            <div className="hero-gallery-actions">
              <Link 
                href={hpData.hero_cta1_url || '/collections'} 
                className="hero-gallery-btn-primary"
              >
                <span>{hpData.hero_cta1_text || 'EXPLORE THE COLLECTION'}</span>
                <svg width="18" height="12" viewBox="0 0 18 12" fill="none" xmlns="http://www.w3.org/2000/svg" className="hero-btn-arrow" aria-hidden="true">
                  <path d="M12 1L17 6M17 6L12 11M17 6H1" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </Link>

              <Link 
                href={hpData.hero_cta2_url || '/about'} 
                className="hero-gallery-link-secondary"
              >
                {hpData.hero_cta2_text || 'DISCOVER OUR CRAFT'}
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ESTABLISHMENT DETAILS & STATS STRIP */}
      <section className="establishment-stats-strip">
        <div className="wrap">
          <div className="establishment-stats-grid">
            <div className="stat-col">
              <strong className="stat-number">{hpData.stat1_number || '3,20,000'}</strong>
              <span className="stat-label">{hpData.stat1_label || 'SQ. FT. WORKS'}</span>
            </div>
            <div className="stat-col">
              <strong className="stat-number">{hpData.stat2_number || '1,400+'}</strong>
              <span className="stat-label">{hpData.stat2_label || 'CRAFTSMEN & STAFF'}</span>
            </div>
            <div className="stat-col">
              <strong className="stat-number">{hpData.stat3_number || '24'}</strong>
              <span className="stat-label">{hpData.stat3_label || 'EXPORT MARKETS'}</span>
            </div>
            <div className="stat-col">
              <strong className="stat-number">{hpData.stat4_number || '98%'}</strong>
              <span className="stat-label">{hpData.stat4_label || 'ON-TIME DELIVERY'}</span>
            </div>
          </div>
        </div>
      </section>

      {/* 1.75 WORK WITH US (CHOOSE HOW YOU'D LIKE TO WORK WITH US) */}
      <section className="work-with-us-section">
        <div className="wrap">
          <div className="work-section-header">
            <h2 className="work-section-title">{hpData.work_title || "Choose How You'd Like to Work With Us"}</h2>
          </div>

          <div className="work-cards-grid">
            {/* CARD 1: SHOP FURNITURE */}
            <article className="work-card">
              <Link href={hpData.work_card1_url && hpData.work_card1_url !== '/collections' ? hpData.work_card1_url : '/furniture'} className="work-card-image-wrap">
                <img
                  src={hpData.work_card1_image || '/Explore_collection.webp'}
                  alt={hpData.work_card1_title || 'Shop Furniture'}
                  loading="lazy"
                />
              </Link>
              <div className="work-card-body">
                <span className="work-card-eyebrow">{hpData.work_card1_eyebrow || 'SHOP FURNITURE'}</span>
                <h3 className="work-card-title">
                  <Link href={hpData.work_card1_url && hpData.work_card1_url !== '/collections' ? hpData.work_card1_url : '/furniture'}>
                    {hpData.work_card1_title || 'Individual Pieces, Made to Belong'}
                  </Link>
                </h3>
                <p className="work-card-desc">
                  {hpData.work_card1_desc || 'Discover considered furniture and objects for one room, one corner, or the whole home.'}
                </p>
                <Link href={hpData.work_card1_url && hpData.work_card1_url !== '/collections' ? hpData.work_card1_url : '/furniture'} className="work-card-cta">
                  <span className="work-card-cta-text">{hpData.work_card1_cta || 'EXPLORE THE COLLECTION'}</span>
                  <span className="work-card-arrow" aria-hidden="true">→</span>
                </Link>
              </div>
            </article>

            {/* CARD 2: COMPLETE PROJECTS */}
            <article className="work-card">
              <Link href={hpData.work_card2_url || '/discuss-projects'} className="work-card-image-wrap">
                <img
                  src={hpData.work_card2_image || '/Project.webp'}
                  alt={hpData.work_card2_title || 'Complete Projects'}
                  loading="lazy"
                />
              </Link>
              <div className="work-card-body">
                <span className="work-card-eyebrow">{hpData.work_card2_eyebrow || 'COMPLETE PROJECTS'}</span>
                <h3 className="work-card-title">
                  <Link href={hpData.work_card2_url || '/discuss-projects'}>
                    {hpData.work_card2_title || 'Spaces, Crafted from Brief to Installation'}
                  </Link>
                </h3>
                <p className="work-card-desc">
                  {hpData.work_card2_desc || 'Partner with our project team for custom furniture, material development, production and complete execution.'}
                </p>
                <Link href={hpData.work_card2_url || '/discuss-projects'} className="work-card-cta">
                  <span className="work-card-cta-text">{hpData.work_card2_cta || 'VISIT THE TRADE DESK'}</span>
                  <span className="work-card-arrow" aria-hidden="true">→</span>
                </Link>
              </div>
            </article>
          </div>
        </div>
      </section>

      {/* 2. PROJECT DOMAINS (SHOP THE WAY A PROJECT ACTUALLY GETS SPECIFIED) */}
      <section className="project-domains-section">
        <div className="wrap">
          <div className="project-domains-head">
            <div className="project-domains-left">
              {hpData.seg_eyebrow && (
                <span className="project-domains-eyebrow">{hpData.seg_eyebrow}</span>
              )}
              <h2 className="project-domains-title">
                {hpData.seg_title || 'Shop the way a project actually gets specified.'}
              </h2>
            </div>
            <div className="project-domains-right">
              <p className="project-domains-desc">
                {hpData.seg_desc || 'Furniture engineered for commercial spaces with heavy contract use standards.'}
              </p>
            </div>
          </div>

          <div className="project-domains-grid">
            {projectSpaces.map((ps) => (
              <Link href={ps.url} key={ps.id} className="project-domain-card">
                <div className="project-domain-art">
                  <img src={ps.image} alt={ps.name} loading="lazy" />
                </div>
                <div className="project-domain-info">
                  <h3 className="project-domain-name">{ps.name}</h3>
                  <span className="project-domain-link">
                    Explore project <span className="arrow-icon">→</span>
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* 3. PRODUCT CATEGORIES GRID */}
      <section className="blk">
        <div className="wrap">
          <div className="sec-head">
            <div>
              <span className="mono">{hpData.cat_eyebrow}</span>
              <h2 className="disp">{catTitle}</h2>
            </div>
            <p>{catDesc}</p>
          </div>

          <div className="cat-grid">
            {displayCategories.map((c) => {
              const catSlug = c.slug || c.id;
              const catImg =
                c.image && c.image.trim() !== ''
                  ? c.image
                  : FALLBACK_DEPT_IMAGES[catSlug] || `/categories/every-room/${catSlug}.webp` || '/categories/every-room/furniture.webp';
              const cardHref = isKnownDepartment(catSlug) ? `/${catSlug}` : `/collections/${catSlug}`;
              const displayName = DEPT_DISPLAY_NAMES[catSlug] || c.name;

              return (
                <Link href={cardHref} key={c.id || catSlug} className="cat-card">
                  <div className="cat-card-art">
                    <img src={catImg} alt={displayName} loading="lazy" />
                  </div>
                  <div className="info">
                    <h3>{displayName}</h3>
                    <span className="link-arrow">
                      Explore collection <span className="arrow-icon">→</span>
                    </span>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      </section>

      {/* 3.5. HERITAGE CRAFTS & MATERIALS VOCABULARIES (DIRECTLY ABOVE "A FEW WE ARE PROUD OF") */}
      <section className="blk materials-showcase-sec" style={{ background: 'var(--surface-2)', padding: '56px 0' }}>
        <div className="wrap">
          <div className="sec-head" style={{ marginBottom: 28 }}>
            <div>
              <span className="mono" style={{ color: 'var(--brand)', letterSpacing: '0.08em' }}>
                {hpData.mat_eyebrow || 'HERITAGE CRAFTS & MATERIALS'}
              </span>
              <h2 className="disp" style={{ marginTop: 6 }}>
                {hpData.mat_title && hpData.mat_title !== 'Twenty-one material vocabularies under one roof.'
                  ? hpData.mat_title
                  : 'Vocabularies under one roof.'}
              </h2>
            </div>
            <p style={{ maxWidth: 540 }}>
              {hpData.mat_desc && !hpData.mat_desc.includes('bone inlay')
                ? hpData.mat_desc
                : 'Combining traditional woodworking, and metalwork with modern hardware.'}
            </p>
          </div>

          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
            {allMaterials.map((m) => (
              <Link
                key={m}
                href={`/collections?mat=${encodeURIComponent(m)}`}
                className="chip material-pill"
                style={{
                  background: '#FFFFFF',
                  border: '1px solid var(--line)',
                  padding: '10px 18px',
                  borderRadius: 'var(--r-pill)',
                  fontSize: 14,
                  fontWeight: 500,
                  color: 'var(--ink)',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 8,
                  transition: 'all 0.2s ease',
                  boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
                }}
              >
                <span>{m}</span>
                <span style={{ fontSize: 12, opacity: 0.5, color: 'var(--brand)' }}>↗</span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* 4. FEATURED PRODUCTS CAROUSEL / GRID */}
      <section className="blk">
        <div className="wrap">
          <div className="sec-head">
            <div>
              <h2 className="disp">{hpData.feat_title}</h2>
            </div>
            <p>{hpData.feat_desc}</p>
          </div>

          <div className="prod-grid">
            {featured.map((p) => (
              <article key={p.id} className="card">
                <div className="thumb" style={{ position: 'relative' }}>
                  {p.badge && p.badge.toLowerCase() !== 'none' && (
                    <span className={`tag ${p.badge === 'New' ? 'new' : ''}`}>{p.badge}</span>
                  )}
                  <button
                    type="button"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      toggleFavorite({
                        id: p.id,
                        name: p.name,
                        catName: p.catName,
                        image: p.image || `/categories/${p.cat || 'seating'}.jpg`,
                        moq: p.moq,
                        material: p.material,
                        finish: (p as any).color || (p as any).finish,
                        slug: getProductSlug(p),
                      });
                    }}
                    title={isFavorite(p.id) ? 'Remove from Favourites' : 'Save to Favourites'}
                    aria-label={isFavorite(p.id) ? 'Remove from Favourites' : 'Save to Favourites'}
                    style={{
                      position: 'absolute',
                      top: 8,
                      right: 8,
                      width: 32,
                      height: 32,
                      borderRadius: '50%',
                      background: isFavorite(p.id) ? '#FFFFFF' : 'rgba(255, 255, 255, 0.9)',
                      border: '1px solid rgba(0, 0, 0, 0.08)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      cursor: 'pointer',
                      zIndex: 3,
                      boxShadow: '0 2px 6px rgba(0,0,0,0.12)',
                      transition: 'all 0.2s ease',
                    }}
                  >
                    <svg
                      width="16"
                      height="16"
                      viewBox="0 0 24 24"
                      fill={isFavorite(p.id) ? '#B85735' : 'none'}
                      stroke={isFavorite(p.id) ? '#B85735' : '#111111'}
                      strokeWidth="1.8"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
                    </svg>
                  </button>
                  <Link href={`/product/${getProductSlug(p)}`}>
                    <img
                      src={p.image || `/categories/${p.cat || 'seating'}.jpg`}
                      alt={p.name}
                      loading="lazy"
                      onError={(e) => {
                        e.currentTarget.onerror = null;
                        e.currentTarget.src = p.cat ? `/categories/${p.cat}.jpg` : '/fallback-product.svg';
                      }}
                    />
                  </Link>
                  <div className="acts">
                    <Link href={`/product/${getProductSlug(p)}`} className="btn btn-soft btn-sm">
                      Details
                    </Link>
                    <button
                      className="btn btn-primary btn-sm"
                      onClick={() =>
                        addEnquiry({
                          id: p.id,
                          name: p.name,
                          catName: p.catName,
                          q: p.moq,
                          image: p.image || '/fallback-product.svg',
                          moq: p.moq,
                          unitPrice: p.price || 0,
                          currency: p.currency || 'INR',
                          currencySymbol: p.currencySymbol || '₹',
                          material: p.material,
                          finish: p.color,
                          slug: p.slug,
                        })
                      }
                    >
                      + Enquiry
                    </button>
                  </div>
                </div>
                <div className="body">
                  <span className="meta">{p.catName || p.type || 'FURNITURE'}</span>
                  <span className="made-to-order-tag">Made-To-Order</span>
                  <Link href={`/product/${getProductSlug(p)}`}>
                    <h4>{p.name}</h4>
                  </Link>
                  <span className="price-note">Price on request</span>
                </div>
              </article>
            ))}
          </div>

          <div style={{ textAlign: 'center', marginTop: 40 }}>
            <Link href={hpData.feat_cta_url || '/collections'} className="btn btn-primary btn-lg">
              {(hpData.feat_cta_text || 'Explore Collection').replace(/[\s→\->]+$/g, '').trim()} →
            </Link>
          </div>
        </div>
      </section>

      {/* 5. 5-STEP CONTRACT WORKFLOW */}
      <section className="blk tight factory-process-sec" style={{ background: 'var(--surface-2)' }}>
        <div className="wrap">
          <div className="sec-head">
            <div>
              <span className="mono">{hpData.step_eyebrow || 'FACTORY PROCESS'}</span>
              <h2 className="disp">{hpData.step_title || 'Five steps from your drawing to your floor.'}</h2>
            </div>
          </div>

          <div className="rail">
            <div className="step step-card">
              <span className="k num">01</span>
              <h4 className="step-title">{hpData.step1_title || 'Enquiry'}</h4>
              <p>{hpData.step1_desc || 'Send drawings, BOQ, or shortlist catalog items for quotation.'}</p>
            </div>

            <div className="step step-card">
              <span className="k num">02</span>
              <h4 className="step-title">{hpData.step2_title || 'Specs'}</h4>
              <p>{hpData.step2_desc || 'CAD shop drawings, timber samples, and fabric approvals.'}</p>
            </div>

            <div className="step step-card">
              <span className="k num">03</span>
              <h4 className="step-title">{hpData.step3_title || 'Prototype'}</h4>
              <p>{hpData.step3_desc || 'First-piece inspection before bulk production begins.'}</p>
            </div>

            <div className="step step-card">
              <span className="k num">04</span>
              <h4 className="step-title">{hpData.step4_title || 'Manufacture'}</h4>
              <p>{hpData.step4_desc || 'Solid wood joinery, finishing, upholstery, and QC.'}</p>
            </div>

            <div className="step step-card">
              <span className="k num">05</span>
              <h4 className="step-title">{hpData.step5_title || 'Delivery'}</h4>
              <p>{hpData.step5_desc || 'Export-grade packaging, shipping, and site installation.'}</p>
            </div>
          </div>
        </div>
      </section>

      {/* 5. 5-STEP CONTRACT WORKFLOW ends */}

      {/* 5.5. NEW ARRIVALS */}
      <section className="blk new-arrivals-section">
        <div className="wrap">
          <div className="sec-head">
            <div>
              <span className="mono">{hpData.new_arrivals_eyebrow || 'NEW ARRIVALS'}</span>
              <h2 className="disp">{hpData.new_arrivals_title || 'Fresh from the Rajasthan Workshops'}</h2>
            </div>
            <div className="new-arrivals-head-meta">
              <p>
                {hpData.new_arrivals_desc ||
                  'Recently finished bespoke archetypes, contemporary additions, and seasonal design debuts ready for contract specification.'}
              </p>
              <Link href={hpData.new_arrivals_url || '/collections/new-arrivals'} className="link-arrow new-arrivals-link">
                {(hpData.new_arrivals_cta || 'Explore all new arrivals').replace(/[\s→\->]+$/g, '').trim()}{' '}
                <span className="arrow-icon">→</span>
              </Link>
            </div>
          </div>

          <div className="new-arrivals-grid">
            {newArrivals.map((p) => (
              <article key={`new-${p.id}`} className="card new-arrival-card">
                <div className="thumb" style={{ position: 'relative' }}>
                  <span className="tag new">{p.badge || 'New'}</span>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      toggleFavorite({
                        id: p.id,
                        name: p.name,
                        catName: p.catName,
                        image: p.image || `/categories/${p.cat || 'seating'}.jpg`,
                        moq: p.moq,
                        material: p.material,
                        finish: (p as any).color || (p as any).finish,
                        slug: getProductSlug(p),
                      });
                    }}
                    title={isFavorite(p.id) ? 'Remove from Favourites' : 'Save to Favourites'}
                    aria-label={isFavorite(p.id) ? 'Remove from Favourites' : 'Save to Favourites'}
                    style={{
                      position: 'absolute',
                      top: 8,
                      right: 8,
                      width: 32,
                      height: 32,
                      borderRadius: '50%',
                      background: isFavorite(p.id) ? '#FFFFFF' : 'rgba(255, 255, 255, 0.9)',
                      border: '1px solid rgba(0, 0, 0, 0.08)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      cursor: 'pointer',
                      zIndex: 3,
                      boxShadow: '0 2px 6px rgba(0,0,0,0.12)',
                      transition: 'all 0.2s ease',
                    }}
                  >
                    <svg
                      width="16"
                      height="16"
                      viewBox="0 0 24 24"
                      fill={isFavorite(p.id) ? '#B85735' : 'none'}
                      stroke={isFavorite(p.id) ? '#B85735' : '#111111'}
                      strokeWidth="1.8"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
                    </svg>
                  </button>
                  <Link href={`/product/${getProductSlug(p)}`}>
                    <img
                      src={p.image || `/categories/${p.cat || 'seating'}.jpg`}
                      alt={p.name}
                      loading="lazy"
                      onError={(e) => {
                        e.currentTarget.onerror = null;
                        e.currentTarget.src = p.cat ? `/categories/${p.cat}.jpg` : '/fallback-product.svg';
                      }}
                    />
                  </Link>
                  <div className="acts">
                    <Link href={`/product/${getProductSlug(p)}`} className="btn btn-soft btn-sm">
                      Details
                    </Link>
                    <button
                      className="btn btn-primary btn-sm"
                      onClick={() =>
                        addEnquiry({
                          id: p.id,
                          name: p.name,
                          catName: p.catName,
                          q: p.moq,
                          image: p.image || '/fallback-product.svg',
                          moq: p.moq,
                          unitPrice: p.price || 0,
                          currency: p.currency || 'INR',
                          currencySymbol: p.currencySymbol || '₹',
                          material: p.material,
                          finish: p.color,
                          slug: p.slug,
                        })
                      }
                    >
                      + Enquiry
                    </button>
                  </div>
                </div>
                <div className="body">
                  <span className="meta">{p.catName || p.type || 'FURNITURE'}</span>
                  <span className="made-to-order-tag">Made-To-Order</span>
                  <Link href={`/product/${getProductSlug(p)}`}>
                    <h4>{p.name}</h4>
                  </Link>
                  <span className="price-note">{p.priceNote || 'Price on request'}</span>
                </div>
              </article>
            ))}
          </div>

          <div style={{ textAlign: 'center', marginTop: 40 }}>
            <Link href={hpData.new_arrivals_url || '/collections/new-arrivals'} className="btn btn-primary btn-lg">
              {(hpData.new_arrivals_cta || 'Explore all new arrivals').replace(/[\s→\->]+$/g, '').trim()} →
            </Link>
          </div>
        </div>
      </section>

      {/* 7. BOTTOM CTA BANNER - TELL US WHAT YOU'RE BUILDING */}
      <section className="blk tight boq-banner-section">
        <div className="wrap">
          <div className="boq-band">
            <div className="boq-art">
              <img src="/boq-banner.webp" alt="Orbit Expo Crafts Architectural Project" loading="eager" />
            </div>
            <div className="boq-content">
              <div className="boq-text">
                <h2>{hpData.band_title || "Tell us what you're building."}</h2>
                <p>
                  {hpData.band_desc ||
                    'Send your BOQ or architectural drawings. Our project desk replies with formal pricing, lead time, and freight within 24 working hours.'}
                </p>
              </div>
              <div className="boq-actions">
                <Link href={hpData.band_cta1_url || '/contact'} className="boq-btn">
                  {(hpData.band_cta1_text || 'Start an enquiry').replace(/[\s→\->]+$/g, '').trim()}{' '}
                  <span className="arrow-icon">→</span>
                </Link>
                <Link
                  href={(hpData.band_cta2_url || '/collections').replace('/catalogue', '/collections')}
                  className="boq-btn"
                >
                  {(hpData.band_cta2_text || 'Explore 2026 collections').replace(/catalogue/gi, 'collections')}
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
