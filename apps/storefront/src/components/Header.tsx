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

export const Header: React.FC = () => {
  const pathname = usePathname();
  const { enquiry, openDrawer } = useEnquiry();
  const { user, isAuthenticated } = useAuth();
  const { favorites } = useFavorites();
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [openMobSec, setOpenMobSec] = useState<string | null>(null);

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
    setIsMobileOpen(false);
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
        setIsMobileOpen(false);
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
                  ? '/collections?badge=new'
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
                                          {isScrollable && (
                                            <span className="dropdown-l2-count" title={`${l3Items.length} items (scroll for more)`}>
                                              {l3Items.length}
                                            </span>
                                          )}
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
      {isMobileOpen && (
        <div>
          <div
            className={`mobile-menu-scrim ${isMobileOpen ? 'open' : ''}`}
            onClick={() => setIsMobileOpen(false)}
            aria-hidden={!isMobileOpen}
          />

          <aside
            className={`mobile-nav-drawer ${isMobileOpen ? 'open' : ''}`}
            aria-label="Mobile Navigation Menu"
            aria-hidden={!isMobileOpen}
          >
            {/* DRAWER TOP HEADER */}
            <div className="mobile-drawer-header">
              <Link href="/" onClick={() => setIsMobileOpen(false)} aria-label="Orbit Expo Crafts Home" className="mobile-drawer-logo">
                <img src="/logo.webp" alt="Orbit Expo Crafts" style={{ height: 46, width: 'auto', objectFit: 'contain' }} />
              </Link>
              <button
                type="button"
                className="mobile-drawer-close-btn"
                onClick={() => setIsMobileOpen(false)}
                aria-label="Close Menu"
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M18 6L6 18M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* DRAWER SCROLLABLE CONTENT */}
            <div className="mobile-drawer-content">
              {/* SEARCH TRIGGER */}
              <div
                className="mobile-search-trigger"
                onClick={() => { setIsMobileOpen(false); setIsSearchOpen(true); }}
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
                <Link href="/best-sellers" onClick={() => setIsMobileOpen(false)} className="mobile-quick-link">
                  Best sellers
                </Link>
                <Link href="/discuss-projects" onClick={() => setIsMobileOpen(false)} className="mobile-quick-link">
                  Discuss Projects
                </Link>
                <Link href="/interior-designers" onClick={() => setIsMobileOpen(false)} className="mobile-quick-link">
                  Interior Designers
                </Link>
                <Link href="/journals" onClick={() => setIsMobileOpen(false)} className="mobile-quick-link">
                  Journals
                </Link>
              </div>

              {/* SECTION DIVIDER */}
              <div className="mobile-menu-divider-label">
                EXPLORE COLLECTIONS
              </div>

              {/* ACCORDION CATEGORY NAVIGATION */}
              <nav className="mobile-accordion-list" aria-label="Mobile Categories">
                {NAV_CATEGORIES.map((cat) => {
                  const subData = cat.deptKey ? (megaTaxonomyData as Record<string, any>)[cat.deptKey] : null;
                  const isOpen = openMobSec === cat.name;
                  const href = cat.slug === 'new-arrivals'
                    ? '/collections?badge=new'
                    : cat.isTurnkey
                    ? '/turnkey'
                    : isKnownDepartment(cat.slug)
                    ? `/${cat.slug}`
                    : `/collections/${cat.slug}`;

                  return (
                    <div key={cat.slug} className={`mobile-acc-item ${isOpen ? 'expanded' : ''}`}>
                      <div className="mobile-acc-header-row">
                        <Link
                          href={href}
                          onClick={() => setIsMobileOpen(false)}
                          className="mobile-acc-title"
                        >
                          {cat.name}
                        </Link>
                        {cat.hasSubmenu && subData && (
                          <button
                            type="button"
                            className={`mobile-acc-toggle-btn ${isOpen ? 'active' : ''}`}
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              setOpenMobSec(isOpen ? null : cat.name);
                            }}
                            aria-expanded={isOpen}
                            aria-label={`Toggle ${cat.name} submenu`}
                          >
                            <svg
                              width="16"
                              height="16"
                              viewBox="0 0 24 24"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="2.2"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              style={{
                                transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)',
                                transition: 'transform 0.22s cubic-bezier(0.16, 1, 0.3, 1)',
                              }}
                            >
                              <path d="M6 9l6 6 6-6" />
                            </svg>
                          </button>
                        )}
                      </div>

                      {/* ACCORDION SUBMENU PANEL */}
                      {isOpen && subData && (
                        <div className="mobile-acc-submenu">
                          {Object.keys(subData).map((l1Name) => {
                            const l1Slug = slugifyCategory(l1Name);
                            const l2Map = subData[l1Name] || {};
                            const l2Names = Object.keys(l2Map);

                            return (
                              <div key={l1Name} className="mobile-sub-l1-group">
                                <Link
                                  href={`/${cat.slug}/${l1Slug}`}
                                  onClick={() => setIsMobileOpen(false)}
                                  className="mobile-sub-l1-title"
                                >
                                  {l1Name}
                                </Link>

                                {l2Names.length > 0 && (
                                  <div className="mobile-sub-l2-list">
                                    {l2Names.map((l2Name) => {
                                      const l2Slug = slugifyCategory(l2Name);
                                      const l3Items = l2Map[l2Name] || [];

                                      return (
                                        <div key={l2Name} className="mobile-sub-l2-block">
                                          <Link
                                            href={`/${cat.slug}/${l1Slug}/${l2Slug}`}
                                            onClick={() => setIsMobileOpen(false)}
                                            className="mobile-sub-l2-title"
                                          >
                                            {l2Name}
                                          </Link>
                                          {l3Items.length > 0 && (
                                            <div className="mobile-sub-l3-list">
                                              {l3Items.map((l3Name: string) => {
                                                const l3Slug = slugifyCategory(l3Name);
                                                return (
                                                  <Link
                                                    key={l3Name}
                                                    href={`/${cat.slug}/${l1Slug}/${l2Slug}/${l3Slug}`}
                                                    onClick={() => setIsMobileOpen(false)}
                                                    className="mobile-sub-l3-link"
                                                  >
                                                    {l3Name}
                                                  </Link>
                                                );
                                              })}
                                            </div>
                                          )}
                                        </div>
                                      );
                                    })}
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  );
                })}
              </nav>

              {/* CRAFT & MATERIAL & TURNKEY DIRECT LINKS */}
              <div className="mobile-extra-links">
                <Link href="/craft" onClick={() => setIsMobileOpen(false)} className="mobile-extra-link">
                  <span>Craft & Materials</span>
                  <span className="arrow">→</span>
                </Link>
                <Link href="/catalogue" onClick={() => setIsMobileOpen(false)} className="mobile-extra-link">
                  <span>Full Trade Catalogue</span>
                  <span className="arrow">→</span>
                </Link>
                <Link href="/contact" onClick={() => setIsMobileOpen(false)} className="mobile-extra-link">
                  <span>Contact & Factory Visit</span>
                  <span className="arrow">→</span>
                </Link>
              </div>
            </div>

            {/* DRAWER FOOTER / ACCOUNT & ACTIONS */}
            <div className="mobile-drawer-footer">
              <Link
                href="/account"
                onClick={() => setIsMobileOpen(false)}
                className="mobile-footer-action"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" />
                  <circle cx="12" cy="7" r="4" />
                </svg>
                <span>{isAuthenticated ? (user?.firstName ? `Hi, ${user.firstName}` : 'My Account') : 'Sign In / Register'}</span>
              </Link>

              <Link
                href="/favorites"
                onClick={() => setIsMobileOpen(false)}
                className="mobile-footer-action"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill={favorites.length > 0 ? '#B85735' : 'none'} stroke={favorites.length > 0 ? '#B85735' : 'currentColor'} strokeWidth="1.8">
                  <path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z" />
                </svg>
                <span>Favourites ({favorites.length})</span>
              </Link>

              <button
                type="button"
                onClick={() => { setIsMobileOpen(false); openDrawer(); }}
                className="mobile-footer-action"
                style={{ background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left' }}
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                  <path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z" />
                  <line x1="3" y1="6" x2="21" y2="6" />
                  <path d="M16 10a4 4 0 01-8 0" />
                </svg>
                <span>Cart ({enquiry.length})</span>
              </button>
            </div>
          </aside>
        </div>
      )}

      {/* SEARCH MODAL */}
      <SearchModal isOpen={isSearchOpen} onClose={() => setIsSearchOpen(false)} />
    </>
  );
};
