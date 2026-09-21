'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEnquiry } from '../context/EnquiryContext';
import { useAuth } from '../context/AuthContext';
import { useFavorites } from '../context/FavoritesContext';
import { SearchModal } from './SearchModal';
import megaTaxonomyData from '../data/mega_menu_taxonomy.json';
import { slugifyCategory, isKnownDepartment } from '../lib/categoryTaxonomy';

interface NavCategory {
  name: string;
  slug: string;
  hasSubmenu: boolean;
  deptKey?: string;
  isTurnkey?: boolean;
}

const NAV_CATEGORIES: NavCategory[] = [
  { name: 'New Arrivals', slug: 'new-arrivals', hasSubmenu: false },
  { name: 'Furniture', slug: 'furniture', hasSubmenu: true, deptKey: 'Furniture' },
  { name: 'Home Decor', slug: 'home-decor', hasSubmenu: true, deptKey: 'Home Decor' },
  { name: 'Wall Decor & Mirrors', slug: 'wall-decor-and-mirrors', hasSubmenu: true, deptKey: 'Wall Decor & Mirrors' },
  { name: 'Lighting', slug: 'lighting', hasSubmenu: true, deptKey: 'Lighting' },
  { name: 'Rugs & Floor Coverings', slug: 'rugs-and-floor-coverings', hasSubmenu: true, deptKey: 'Rugs & Floor Coverings' },
  { name: 'Storage & Organization', slug: 'storage-and-organization', hasSubmenu: true, deptKey: 'Storage & Organization' },
  { name: 'Kitchen & Tabletop', slug: 'kitchen-and-tabletop', hasSubmenu: true, deptKey: 'Kitchen & Tabletop' },
  { name: 'Outdoor & Garden', slug: 'outdoor-and-garden', hasSubmenu: true, deptKey: 'Outdoor & Garden' },
  { name: 'Kids & Pet Home', slug: 'kids-and-pet-home', hasSubmenu: true },
];

interface DrillStep {
  level: 0 | 1 | 2 | 3;
  title: string;
  deptName?: string;
  deptSlug?: string;
  deptKey?: string;
  l1Name?: string;
  l1Slug?: string;
  l2Name?: string;
  l2Slug?: string;
}

const ROOT_STEP: DrillStep = { level: 0, title: 'Menu' };

interface MobileDept {
  name: string;
  slug: string;
  deptKey: string;
  count: number;
}

const MOBILE_DEPARTMENTS: MobileDept[] = [
  { name: 'Furniture', slug: 'furniture', deptKey: 'Furniture', count: Object.keys((megaTaxonomyData as Record<string, any>)['Furniture'] || {}).length },
  { name: 'Home Decor', slug: 'home-decor', deptKey: 'Home Decor', count: Object.keys((megaTaxonomyData as Record<string, any>)['Home Decor'] || {}).length },
  { name: 'Wall Decor & Mirrors', slug: 'wall-decor-and-mirrors', deptKey: 'Wall Decor & Mirrors', count: Object.keys((megaTaxonomyData as Record<string, any>)['Wall Decor & Mirrors'] || {}).length },
  { name: 'Lighting', slug: 'lighting', deptKey: 'Lighting', count: Object.keys((megaTaxonomyData as Record<string, any>)['Lighting'] || {}).length },
  { name: 'Rugs & Floor Coverings', slug: 'rugs-and-floor-coverings', deptKey: 'Rugs & Floor Coverings', count: Object.keys((megaTaxonomyData as Record<string, any>)['Rugs & Floor Coverings'] || {}).length },
  { name: 'Storage & Organization', slug: 'storage-and-organization', deptKey: 'Storage & Organization', count: Object.keys((megaTaxonomyData as Record<string, any>)['Storage & Organization'] || {}).length },
  { name: 'Kitchen & Tabletop', slug: 'kitchen-and-tabletop', deptKey: 'Kitchen & Tabletop', count: Object.keys((megaTaxonomyData as Record<string, any>)['Kitchen & Tabletop'] || {}).length },
  { name: 'Outdoor & Garden', slug: 'outdoor-and-garden', deptKey: 'Outdoor & Garden', count: Object.keys((megaTaxonomyData as Record<string, any>)['Outdoor & Garden'] || {}).length },
  { name: 'Kids & Baby Home', slug: 'kids-and-baby-home', deptKey: 'Kids & Baby Home', count: Object.keys((megaTaxonomyData as Record<string, any>)['Kids & Baby Home'] || {}).length },
  { name: 'Pet Home', slug: 'pet-home', deptKey: 'Pet Home', count: Object.keys((megaTaxonomyData as Record<string, any>)['Pet Home'] || {}).length },
];

export const Header: React.FC = () => {
  const pathname = usePathname();
  const { enquiry, openDrawer } = useEnquiry();
  const { user, isAuthenticated } = useAuth();
  const { favorites } = useFavorites();
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [drillStack, setDrillStack] = useState<DrillStep[]>([ROOT_STEP]);
  const currentStep = drillStack[drillStack.length - 1] || ROOT_STEP;

  const closeMobileDrawer = () => {
    setIsMobileOpen(false);
    setTimeout(() => {
      setDrillStack([ROOT_STEP]);
    }, 280);
  };

  const handleGoBack = () => {
    if (drillStack.length > 1) {
      setDrillStack((prev) => prev.slice(0, -1));
    }
  };

  const handleJumpToLevel = (stepIndex: number) => {
    if (stepIndex >= 0 && stepIndex < drillStack.length) {
      setDrillStack((prev) => prev.slice(0, stepIndex + 1));
    }
  };

  const handleOpenDept = (deptName: string, deptSlug: string, deptKey: string) => {
    setDrillStack((prev) => [
      ...prev,
      {
        level: 1,
        title: deptName,
        deptName,
        deptSlug,
        deptKey,
      },
    ]);
  };

  const handleOpenL1 = (l1Name: string, l1Slug: string) => {
    if (!currentStep.deptKey || !currentStep.deptSlug) return;
    setDrillStack((prev) => [
      ...prev,
      {
        level: 2,
        title: l1Name,
        deptName: currentStep.deptName,
        deptSlug: currentStep.deptSlug,
        deptKey: currentStep.deptKey,
        l1Name,
        l1Slug,
      },
    ]);
  };

  const handleOpenL2 = (l2Name: string, l2Slug: string) => {
    if (!currentStep.deptKey || !currentStep.deptSlug || !currentStep.l1Name || !currentStep.l1Slug) return;
    setDrillStack((prev) => [
      ...prev,
      {
        level: 3,
        title: l2Name,
        deptName: currentStep.deptName,
        deptSlug: currentStep.deptSlug,
        deptKey: currentStep.deptKey,
        l1Name: currentStep.l1Name,
        l1Slug: currentStep.l1Slug,
        l2Name,
        l2Slug,
      },
    ]);
  };

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 38);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Global Keyboard Shortcut (Cmd+K / Ctrl+K)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setIsSearchOpen((prev) => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Close mobile drawer on route change
  useEffect(() => {
    closeMobileDrawer();
  }, [pathname]);

  // Lock body scroll when mobile drawer is open
  useEffect(() => {
    if (isMobileOpen) {
      const originalOverflow = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = originalOverflow;
      };
    }
  }, [isMobileOpen]);

  // Close mobile drawer on Escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isMobileOpen) {
        closeMobileDrawer();
      }
    };
    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, [isMobileOpen]);

  const handleScrollActive = (e: React.UIEvent<HTMLUListElement>) => {
    const el = e.currentTarget;
    el.classList.add('is-scrolling');
    if ((el as any)._scrollTimer) {
      clearTimeout((el as any)._scrollTimer);
    }
    (el as any)._scrollTimer = setTimeout(() => {
      el.classList.remove('is-scrolling');
    }, 800);
  };

  return (
    <>
      {/* TIER 1: ANNOUNCEMENT BAR (NOT STICKY - SCROLLS AWAY WITH PAGE) */}
      <div className="site-announcement-bar">
        <div className="header-container announcement-inner">
          <div className="announcement-left">
            Exclusive Bespoke Design Solutions
          </div>
          <div className="announcement-right">
            <Link href="/contact" className="trade-desk-link">
              Trade Desk →
            </Link>
          </div>
        </div>
      </div>

      {/* STICKY HEADER (MAIN BRANDING + NAVIGATION TIER) */}
      <header className={`site site-header-wrapper ${isScrolled ? 'is-scrolled scrolled' : ''}`}>
        {/* TIER 2: MAIN BRANDING & ACTIONS HEADER (POTTERY BARN DESIGN) */}
        <div className="site-main-header">
          <div className="header-container main-header-inner">
            {/* LEFT: Minimalist Pottery Barn Underline Search */}
            <div className="header-left-col">
              <div
                className="pb-search-bar"
                onClick={() => setIsSearchOpen(true)}
                role="button"
                tabIndex={0}
                title="Search products (Cmd + K)"
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    setIsSearchOpen(true);
                  }
                }}
              >
                <span className="pb-search-placeholder">Search</span>
                <svg className="pb-search-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M11 19a8 8 0 100-16 8 8 0 000 16zM21 21l-4.5-4.5" />
                </svg>
              </div>
            </div>

            {/* CENTER: Brand Logo & 4 Sub-links Row */}
            <div className="header-center-col">
              <Link href="/" className="header-brand-link" aria-label="Orbit Expo Crafts Home">
                <img
                  src="/logo.webp"
                  alt="Orbit Expo Crafts"
                  className="header-logo-img"
                  width={142}
                  height={68}
                />
              </Link>

              <nav className="header-sublinks-row" aria-label="Secondary Navigation">
                <Link href="/best-sellers" className="header-sublink">
                  Best sellers
                </Link>
                <Link href="/discuss-projects" className="header-sublink">
                  Discuss Projects
                </Link>
                <Link href="/interior-designers" className="header-sublink">
                  Interior Designers
                </Link>
                <Link href="/journal" className="header-sublink">
                  Journal
                </Link>
              </nav>
            </div>

            {/* RIGHT: Stacked Actions (Sign In, Favourites, Cart) & Mobile Toggle */}
            <div className="header-right-col">
              {/* Sign In / Account Portal */}
              <Link
                href="/account"
                className="header-action-stacked"
                title={isAuthenticated ? `Logged in as ${user?.firstName || user?.username}` : "Sign In or Register"}
              >
                <span className="header-action-icon-wrap">
                  <svg width="21" height="21" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                    <circle cx="12" cy="7" r="4" />
                  </svg>
                  {isAuthenticated && (
                    <span style={{ position: 'absolute', bottom: -1, right: -2, width: 8, height: 8, background: '#2E7D32', borderRadius: '50%', border: '1.5px solid #FFF' }} />
                  )}
                </span>
                <span className="header-action-label">
                  {isAuthenticated ? (user?.firstName ? `Hi, ${user.firstName}` : 'Account') : 'Sign In'}
                </span>
              </Link>

              {/* Favourites / Wishlist */}
              <Link
                href="/account?tab=favorites"
                className="header-action-stacked"
                title="Saved Favourites & Specifications"
              >
                <span className="header-action-icon-wrap">
                  <svg
                    width="20"
                    height="20"
                    viewBox="0 0 24 24"
                    fill={favorites.length > 0 ? "#B85735" : "none"}
                    stroke={favorites.length > 0 ? "#B85735" : "currentColor"}
                    strokeWidth="1.8"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
                  </svg>
                  {favorites.length > 0 && (
                    <span className="action-badge" style={{ background: '#B85735' }}>
                      {favorites.length}
                    </span>
                  )}
                </span>
                <span className="header-action-label">Favourites</span>
              </Link>

              {/* Cart / Enquiry Bag */}
              <button
                type="button"
                className="header-action-stacked"
                onClick={openDrawer}
                title="Enquiry Bag & Specifications"
              >
                <span className="header-action-icon-wrap">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z" />
                    <line x1="3" y1="6" x2="21" y2="6" />
                    <path d="M16 10a4 4 0 0 1-8 0" />
                  </svg>
                  {enquiry.length > 0 && (
                    <span className="action-badge">{enquiry.length}</span>
                  )}
                </span>
                <span className="header-action-label">Cart</span>
              </button>

              {/* Mobile Burger Button */}
              <button
                type="button"
                className="mobile-burger-btn"
                onClick={() => setIsMobileOpen((prev) => !prev)}
                aria-label="Toggle Mobile Menu"
                aria-expanded={isMobileOpen}
              >
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  {isMobileOpen ? (
                    <path d="M18 6L6 18M6 6l12 12" />
                  ) : (
                    <path d="M4 6h16M4 12h16M4 18h16" />
                  )}
                </svg>
              </button>
            </div>
          </div>
        </div>

        {/* TIER 3: CATEGORY NAVIGATION BAR */}
        <nav className="site-nav-tier">
          <div className="header-container nav-tier-inner">
            <ul className="category-nav-list">
              {NAV_CATEGORIES.map((cat) => {
                const isHovered = activeCategory === cat.name;
                const isDept = isKnownDepartment(cat.slug);
                const href = cat.slug === 'new-arrivals'
                  ? '/collections/new-arrivals'
                  : cat.isTurnkey
                  ? '/turnkey'
                  : isDept
                  ? `/${cat.slug}`
                  : `/collections/${cat.slug}`;

                const subData = cat.deptKey
                  ? (megaTaxonomyData as Record<string, any>)[cat.deptKey]
                  : cat.slug === 'kids-and-pet-home'
                  ? {
                      ...(megaTaxonomyData as Record<string, any>)['Kids & Baby Home'],
                      ...(megaTaxonomyData as Record<string, any>)['Pet Home'],
                    }
                  : null;

                return (
                  <li
                    key={cat.slug}
                    className={`category-nav-item ${isHovered ? 'active' : ''}`}
                    onMouseEnter={() => cat.hasSubmenu && setActiveCategory(cat.name)}
                    onMouseLeave={() => setActiveCategory(null)}
                  >
                    <Link
                      href={href}
                      className="category-nav-link"
                      onClick={() => setActiveCategory(null)}
                    >
                      <span>{cat.name}</span>
                    </Link>

                    {/* DROPDOWN / MEGA MENU */}
                    {cat.hasSubmenu && subData && (
                      <div className={`category-dropdown-panel ${isHovered ? 'is-active' : ''}`}>
                        <div className="dropdown-cols-grid">
                          {Object.keys(subData).map((l1Name) => {
                            const l1Slug = slugifyCategory(l1Name);
                            const l2Map = subData[l1Name] || {};
                            const l2Names = Object.keys(l2Map);

                            return (
                              <div key={l1Name} className="dropdown-col">
                                <Link
                                  href={`/${cat.slug}/${l1Slug}`}
                                  className="dropdown-l1-title"
                                  onClick={() => setActiveCategory(null)}
                                  style={{ textDecoration: 'none', color: 'inherit', display: 'block' }}
                                >
                                  {l1Name}
                                </Link>
                                <div className="dropdown-l2-wrapper">
                                  {l2Names.map((l2Name) => {
                                    const l2Slug = slugifyCategory(l2Name);
                                    const l3Items = l2Map[l2Name] || [];
                                    const isScrollable = l3Items.length > 7;

                                    return (
                                      <div key={l2Name} className="dropdown-l2-block">
                                        <div className="dropdown-l2-header">
                                          <Link
                                            href={`/${cat.slug}/${l1Slug}/${l2Slug}`}
                                            className="dropdown-l2-subtitle"
                                            onClick={() => setActiveCategory(null)}
                                            style={{ textDecoration: 'none', color: 'inherit' }}
                                          >
                                            {l2Name}
                                          </Link>
                                        </div>
                                        <ul
                                          className={`dropdown-l3-list ${isScrollable ? 'is-scrollable' : ''}`}
                                          onScroll={isScrollable ? handleScrollActive : undefined}
                                        >
                                          {l3Items.map((l3Name: string) => {
                                            const l3Slug = slugifyCategory(l3Name);
                                            const leafHref = `/${cat.slug}/${l1Slug}/${l2Slug}/${l3Slug}`;

                                            return (
                                              <li key={l3Name}>
                                                <Link
                                                  href={leafHref}
                                                  className="dropdown-l3-link"
                                                  onClick={() => setActiveCategory(null)}
                                                >
                                                  {l3Name}
                                                </Link>
                                              </li>
                                            );
                                          })}
                                        </ul>
                                      </div>
                                    );
                                  })}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </li>
                );
              })}
            </ul>
          </div>
        </nav>
      </header>

      {/* MOBILE NAVIGATION DRAWER & BACKDROP */}
      <div
        className={`mobile-menu-scrim ${isMobileOpen ? 'open' : ''}`}
        onClick={closeMobileDrawer}
        aria-hidden={!isMobileOpen}
      />

      <aside
        className={`mobile-nav-drawer ${isMobileOpen ? 'open' : ''}`}
        aria-label="Mobile Navigation Menu"
        aria-hidden={!isMobileOpen}
      >
            {/* DRAWER TOP HEADER */}
            <div className={`mobile-drawer-header ${currentStep.level > 0 ? 'drill-header' : ''}`}>
              {currentStep.level === 0 ? (
                <Link href="/" onClick={closeMobileDrawer} aria-label="Orbit Expo Crafts Home" className="mobile-drawer-logo">
                  <img src="/logo.webp" alt="Orbit Expo Crafts" style={{ height: 46, width: 'auto', objectFit: 'contain' }} />
                </Link>
              ) : (
                <button
                  type="button"
                  className="mobile-drawer-back-btn"
                  onClick={handleGoBack}
                  aria-label="Go back to previous level"
                >
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M15 18l-6-6 6-6" />
                  </svg>
                  <span>Back</span>
                </button>
              )}

              {currentStep.level > 0 && (
                <div className="mobile-drawer-title-label" title={currentStep.title}>
                  {currentStep.title}
                </div>
              )}

              <button
                type="button"
                className="mobile-drawer-close-btn"
                onClick={closeMobileDrawer}
                aria-label="Close Menu"
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M18 6L6 18M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* BREADCRUMB TRAIL WHEN DRILLED DOWN */}
            {currentStep.level > 0 && (
              <div className="mobile-drill-breadcrumbs">
                {drillStack.map((step, idx) => {
                  const isLast = idx === drillStack.length - 1;
                  return (
                    <React.Fragment key={idx}>
                      {idx > 0 && <span className="crumb-sep">›</span>}
                      <button
                        type="button"
                        className={`crumb-btn ${isLast ? 'crumb-current' : ''}`}
                        onClick={() => handleJumpToLevel(idx)}
                        disabled={isLast}
                        title={step.title}
                      >
                        {step.level === 0 ? 'All' : step.title}
                      </button>
                    </React.Fragment>
                  );
                })}
              </div>
            )}

            {/* DRAWER SCROLLABLE CONTENT */}
            <div className="mobile-drawer-content">
              {/* STEP 0: ROOT VIEW */}
              {currentStep.level === 0 && (
                <div className="mobile-drill-view">
                  {/* SEARCH TRIGGER */}
                  <div
                    className="mobile-search-trigger"
                    onClick={() => { closeMobileDrawer(); setIsSearchOpen(true); }}
                    role="button"
                    tabIndex={0}
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M11 19a8 8 0 100-16 8 8 0 000 16zM21 21l-4.5-4.5" />
                    </svg>
                    <span>Search products, materials...</span>
                    <kbd>⌘K</kbd>
                  </div>

                  {/* QUICK LINKS 2x2 GRID */}
                  <div className="mobile-quick-links">
                    <Link href="/best-sellers" onClick={closeMobileDrawer} className="mobile-quick-link">
                      Best sellers
                    </Link>
                    <Link href="/discuss-projects" onClick={closeMobileDrawer} className="mobile-quick-link">
                      Discuss Projects
                    </Link>
                    <Link href="/interior-designers" onClick={closeMobileDrawer} className="mobile-quick-link">
                      Interior Designers
                    </Link>
                    <Link href="/journal" onClick={closeMobileDrawer} className="mobile-quick-link">
                      Journal
                    </Link>
                  </div>

                  {/* SECTION DIVIDER */}
                  <div className="mobile-menu-divider-label">
                    ALL DEPARTMENTS (10)
                  </div>

                  {/* NEW ARRIVALS DIRECT ROW */}
                  <Link
                    href="/collections/new-arrivals"
                    onClick={closeMobileDrawer}
                    className="mobile-drill-row mobile-drill-featured-row"
                  >
                    <span className="row-label-wrap">
                      <span className="row-sparkle">✨</span>
                      <span className="row-title">New Arrivals</span>
                    </span>
                    <span className="row-badge">Fresh Styles</span>
                    <svg className="row-chevron" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                      <path d="M9 18l6-6-6-6" />
                    </svg>
                  </Link>

                  {/* 10 DEPARTMENTS DRILL LIST */}
                  <div className="mobile-drill-list">
                    {MOBILE_DEPARTMENTS.map((dept) => (
                      <button
                        key={dept.slug}
                        type="button"
                        className="mobile-drill-row"
                        onClick={() => handleOpenDept(dept.name, dept.slug, dept.deptKey)}
                      >
                        <span className="row-title">{dept.name}</span>
                        <svg className="row-chevron" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                          <path d="M9 18l6-6-6-6" />
                        </svg>
                      </button>
                    ))}
                  </div>

                  {/* DIRECT EXTRA LINKS */}
                  <div className="mobile-extra-links">
                    <Link href="/craft" onClick={closeMobileDrawer} className="mobile-extra-link">
                      <span>Craft & Materials</span>
                      <span className="arrow">→</span>
                    </Link>
                    <Link href="/catalogue" onClick={closeMobileDrawer} className="mobile-extra-link">
                      <span>Full Trade Catalogue</span>
                      <span className="arrow">→</span>
                    </Link>
                    <Link href="/contact" onClick={closeMobileDrawer} className="mobile-extra-link">
                      <span>Contact & Factory Visit</span>
                      <span className="arrow">→</span>
                    </Link>
                  </div>
                </div>
              )}

              {/* STEP 1: DEPARTMENT LEVEL (e.g. Furniture) */}
              {currentStep.level === 1 && currentStep.deptKey && (
                <div className="mobile-drill-view">
                  {/* HERO CARD - VIEW ALL DEPARTMENT */}
                  <Link
                    href={`/${currentStep.deptSlug}`}
                    onClick={closeMobileDrawer}
                    className="mobile-drill-hero-card"
                  >
                    <div className="hero-card-texts">
                      <span className="hero-card-sub">Department Overview</span>
                      <strong className="hero-card-title">Explore All {currentStep.deptName}</strong>
                    </div>
                    <span className="hero-card-arrow">→</span>
                  </Link>

                  {/* SECTION LABEL */}
                  <div className="mobile-menu-divider-label">
                    CATEGORIES IN {currentStep.deptName?.toUpperCase()}
                  </div>

                  {/* LIST OF L1 ITEMS */}
                  <div className="mobile-drill-list">
                    {(() => {
                      const subData = (megaTaxonomyData as Record<string, any>)[currentStep.deptKey] || {};
                      const l1Keys = Object.keys(subData);

                      return l1Keys.map((l1Name) => {
                        const l1Slug = slugifyCategory(l1Name);
                        const l2Map = subData[l1Name] || {};
                        const l2Count = Object.keys(l2Map).length;

                        return (
                          <button
                            key={l1Name}
                            type="button"
                            className="mobile-drill-row"
                            onClick={() => handleOpenL1(l1Name, l1Slug)}
                          >
                            <span className="row-title">{l1Name}</span>
                            <svg className="row-chevron" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                              <path d="M9 18l6-6-6-6" />
                            </svg>
                          </button>
                        );
                      });
                    })()}
                  </div>
                </div>
              )}

              {/* STEP 2: SUBCATEGORY L1 (e.g. Living Room Furniture) */}
              {currentStep.level === 2 && currentStep.deptKey && currentStep.l1Name && (
                <div className="mobile-drill-view">
                  {/* HERO CARD - VIEW ALL L1 */}
                  <Link
                    href={`/${currentStep.deptSlug}/${currentStep.l1Slug}`}
                    onClick={closeMobileDrawer}
                    className="mobile-drill-hero-card"
                  >
                    <div className="hero-card-texts">
                      <span className="hero-card-sub">Category Overview</span>
                      <strong className="hero-card-title">Explore All {currentStep.l1Name}</strong>
                    </div>
                    <span className="hero-card-arrow">→</span>
                  </Link>

                  {/* SECTION LABEL */}
                  <div className="mobile-menu-divider-label">
                    SUB-CATEGORIES
                  </div>

                  {/* LIST OF L2 ITEMS */}
                  <div className="mobile-drill-list">
                    {(() => {
                      const subData = (megaTaxonomyData as Record<string, any>)[currentStep.deptKey] || {};
                      const l2Map = subData[currentStep.l1Name] || {};
                      const l2Keys = Object.keys(l2Map);

                      return l2Keys.map((l2Name) => {
                        const l2Slug = slugifyCategory(l2Name);
                        const l3List = l2Map[l2Name] || [];
                        const l3Count = l3List.length;

                        return (
                          <button
                            key={l2Name}
                            type="button"
                            className="mobile-drill-row"
                            onClick={() => handleOpenL2(l2Name, l2Slug)}
                          >
                            <span className="row-title">{l2Name}</span>
                            <svg className="row-chevron" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                              <path d="M9 18l6-6-6-6" />
                            </svg>
                          </button>
                        );
                      });
                    })()}
                  </div>
                </div>
              )}

              {/* STEP 3: LEAF GROUP L2 (e.g. Sofas & Seating) */}
              {currentStep.level === 3 && currentStep.deptKey && currentStep.l1Name && currentStep.l2Name && (
                <div className="mobile-drill-view">
                  {/* HERO CARD - VIEW ALL L2 */}
                  <Link
                    href={`/${currentStep.deptSlug}/${currentStep.l1Slug}/${currentStep.l2Slug}`}
                    onClick={closeMobileDrawer}
                    className="mobile-drill-hero-card"
                  >
                    <div className="hero-card-texts">
                      <span className="hero-card-sub">Sub-category Overview</span>
                      <strong className="hero-card-title">Explore All {currentStep.l2Name}</strong>
                    </div>
                    <span className="hero-card-arrow">→</span>
                  </Link>

                  {(() => {
                    const subData = (megaTaxonomyData as Record<string, any>)[currentStep.deptKey] || {};
                    const l2Map = subData[currentStep.l1Name] || {};
                    const l3List: string[] = l2Map[currentStep.l2Name] || [];

                    return (
                      <>
                        <div className="mobile-menu-divider-label">
                          ALL ITEMS ({l3List.length})
                        </div>

                        <div className="mobile-drill-leaves-list">
                          {l3List.map((l3Name) => {
                            const l3Slug = slugifyCategory(l3Name);
                            const leafHref = `/${currentStep.deptSlug}/${currentStep.l1Slug}/${currentStep.l2Slug}/${l3Slug}`;

                            return (
                              <Link
                                key={l3Name}
                                href={leafHref}
                                onClick={closeMobileDrawer}
                                className="mobile-drill-leaf-row"
                              >
                                <span className="leaf-name">{l3Name}</span>
                                <span className="leaf-arrow">→</span>
                              </Link>
                            );
                          })}
                        </div>
                      </>
                    );
                  })()}
                </div>
              )}
            </div>

            {/* DRAWER FOOTER / ACCOUNT & ACTIONS */}
            <div className="mobile-drawer-footer">
              <Link
                href="/account"
                onClick={closeMobileDrawer}
                className="mobile-footer-action"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                  <circle cx="12" cy="7" r="4" />
                </svg>
                <span>{isAuthenticated ? (user?.firstName ? `Hi, ${user.firstName}` : 'My Account') : 'Sign In / Register'}</span>
              </Link>

              <Link
                href="/account?tab=favorites"
                onClick={closeMobileDrawer}
                className="mobile-footer-action"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill={favorites.length > 0 ? '#B85735' : 'none'} stroke={favorites.length > 0 ? '#B85735' : 'currentColor'} strokeWidth="1.8">
                  <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
                </svg>
                <span>Favourites ({favorites.length})</span>
              </Link>

              <button
                type="button"
                onClick={() => { closeMobileDrawer(); openDrawer(); }}
                className="mobile-footer-action"
                style={{ background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left' }}
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                  <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z" />
                  <line x1="3" y1="6" x2="21" y2="6" />
                  <path d="M16 10a4 4 0 0 1-8 0" />
                </svg>
                <span>Cart ({enquiry.length})</span>
              </button>
            </div>
          </aside>

      {/* SEARCH MODAL */}
      <SearchModal isOpen={isSearchOpen} onClose={() => setIsSearchOpen(false)} />
    </>
  );
};
