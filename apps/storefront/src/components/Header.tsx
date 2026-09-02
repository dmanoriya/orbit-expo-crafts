'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEnquiry } from '../context/EnquiryContext';
import { SearchModal } from './SearchModal';

interface MenuItem {
  id: number;
  title: string;
  url: string;
  children?: MenuItem[];
}

const DEFAULT_MENU_ITEMS: MenuItem[] = [
  { id: 1, title: 'Home', url: '/' },
  {
    id: 2,
    title: 'Collections',
    url: '/collections',
    children: [
      { id: 21, title: 'Furniture', url: '/collections/furniture' },
      { id: 22, title: 'Home Decor', url: '/collections/home-decor' },
      { id: 23, title: 'Wall Decor & Mirrors', url: '/collections/wall-decor-and-mirrors' },
      { id: 24, title: 'Lighting', url: '/collections/lighting' },
      { id: 25, title: 'Rugs & Floor Coverings', url: '/collections/rugs-and-floor-coverings' },
      { id: 26, title: 'Storage & Organization', url: '/collections/storage-and-organization' },
      { id: 27, title: 'Kitchen & Tabletop', url: '/collections/kitchen-and-tabletop' },
      { id: 28, title: 'Outdoor & Garden', url: '/collections/outdoor-and-garden' },
    ],
  },
  { id: 3, title: 'Turnkey Projects', url: '/turnkey' },
  { id: 4, title: 'Craft & Materials', url: '/craft' },
  { id: 5, title: 'Journals', url: '/journals' },
];

import { decodeHtmlEntities, fetchWpStorefrontData } from '../lib/wpCommerce';

function normalizeMenuItems(items: MenuItem[]): MenuItem[] {
  return items
    .filter((item) => item.title !== 'About' && item.url !== '/about')
    .map((item) => {
      let cleanUrl = item.url || '/';
      cleanUrl = cleanUrl.replace(/^https?:\/\/[^\/]+/, '');
      cleanUrl = cleanUrl.replace(/\/catalogue/g, '/collections');

      if (cleanUrl.includes('/collections?cat=')) {
        const catSlug = cleanUrl.split('/collections?cat=')[1]?.split('&')[0];
        if (catSlug) {
          cleanUrl = `/collections/${catSlug}`;
        }
      }

      if (cleanUrl.includes('/product-category/')) {
        const parts = cleanUrl.split('/product-category/')[1]?.split('/').filter(Boolean);
        const catSlug = parts?.[0];
        if (catSlug) {
          cleanUrl = `/collections/${catSlug}`;
        }
      }

      let displayTitle = decodeHtmlEntities(item.title || '');
      if (displayTitle === 'Catalogue' || displayTitle === 'Catalog') {
        displayTitle = 'Collections';
      }

      return {
        ...item,
        title: displayTitle,
        url: cleanUrl,
        children: item.children ? normalizeMenuItems(item.children) : [],
      };
    });
}

export const Header: React.FC = () => {
  const pathname = usePathname();
  const { enquiry, openDrawer } = useEnquiry();
  const [menuItems, setMenuItems] = useState<MenuItem[]>(DEFAULT_MENU_ITEMS);
  const [activeDropdown, setActiveDropdown] = useState<number | null>(null);
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
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

  useEffect(() => {
    async function fetchWpData() {
      try {
        const [resMenu, sfData] = await Promise.all([
          fetch('/api/wp/menu').catch(() => null),
          fetchWpStorefrontData().catch(() => null),
        ]);

        let items = DEFAULT_MENU_ITEMS;
        if (resMenu && resMenu.ok) {
          const json = await resMenu.json().catch(() => null);
          if (json && json.success && Array.isArray(json.data?.items) && json.data.items.length > 0) {
            items = normalizeMenuItems(json.data.items);
          }
        }

        // Dynamically inject Master Taxonomy Departments into Collections dropdown
        if (sfData && sfData.categories && sfData.categories.length > 0) {
          const topDepts = sfData.categoryTree && sfData.categoryTree.length > 0
            ? sfData.categoryTree
            : sfData.categories.filter((c) => !c.parent || c.parent === 0);

          if (topDepts.length > 0) {
            const collectionsIndex = items.findIndex((i) => i.title === 'Collections' || i.title === 'Catalogue');
            if (collectionsIndex !== -1) {
              const updatedItems = [...items];
              updatedItems[collectionsIndex] = {
                ...updatedItems[collectionsIndex],
                title: 'Collections',
                url: '/collections',
                children: topDepts.map((d, index) => ({
                  id: d.wpId || index + 100,
                  title: d.name,
                  url: `/collections/${d.slug || d.id}`,
                  children: d.children ? d.children.map((sub, sIndex) => ({
                    id: sub.wpId || sIndex + 1000,
                    title: sub.name,
                    url: `/collections/${d.slug || d.id}/${sub.slug || sub.id}`,
                  })) : [],
                })),
              };
              items = updatedItems;
            }
          }
        }

        // Ensure Journals link is always present in top navigation
        if (!items.some((i) => i.title === 'Journals' || i.url === '/journals')) {
          items.push({ id: 50, title: 'Journals', url: '/journals' });
        }

        setMenuItems(items);
      } catch (err) {
        console.log('Using default header navigation menu structure:', err);
      }
    }
    fetchWpData();
  }, []);

  return (
    <>
      <header className={`site ${isScrolled ? 'scrolled' : ''}`}>
        {/* TOPBAR */}
        <div className="topbar">
          <div className="wrap">
            <span>Udaipur & Jodhpur Works, Rajasthan &nbsp;·&nbsp; Exporting to 24 countries</span>
            <span>Direct factory &nbsp;·&nbsp; Quote-first</span>
          </div>
        </div>

        {/* MAIN NAV HEADER */}
        <div className="wrap nav">
          {/* LOGO IN LIGHT CONTAINER BOX MATCHING REFERENCE IMAGE */}
          <Link className="logo" href="/">
            <div className="logo-box">
              <img
                src="/logo.webp"
                alt="ORBIT Expo Crafts"
                style={{ height: '40px', width: 'auto', objectFit: 'contain' }}
              />
            </div>
          </Link>

          {/* DYNAMIC SHORT MENU - DESKTOP */}
          <nav className="main-menu-nav">
            {menuItems.map((item) => {
              const hasChildren = item.children && item.children.length > 0;
              const isCurrent = pathname === item.url;
              const isHovered = activeDropdown === item.id;

              return (
                <div
                  key={item.id}
                  className={`menu-item-wrapper ${hasChildren ? 'has-dropdown' : ''}`}
                  onMouseEnter={() => hasChildren && setActiveDropdown(item.id)}
                  onMouseLeave={() => setActiveDropdown(null)}
                >
                  <Link
                    className={`link ${isCurrent ? 'on' : ''}`}
                    href={item.url}
                    onClick={() => setActiveDropdown(null)}
                  >
                    {item.title}
                    {hasChildren && (
                      <svg className="caret" width="10" height="6" viewBox="0 0 10 6" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" style={{ marginLeft: 5 }}>
                        <path d="M1 1l4 4 4-4" />
                      </svg>
                    )}
                  </Link>

                  {/* SIMPLE DROPDOWN SUBMENU */}
                  {hasChildren && (
                    <div className={`std-dropdown ${isHovered ? 'open' : ''}`}>
                      {item.children?.map((child) => (
                        <Link
                          key={child.id}
                          href={child.url}
                          className="dropdown-item"
                          onClick={() => setActiveDropdown(null)}
                        >
                          {child.title}
                        </Link>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </nav>

          {/* ACTIONS */}
          <div className="header-actions">
            {/* SEARCH TRIGGER BUTTON */}
            <button
              className="icon-btn search-trigger-btn"
              onClick={() => setIsSearchOpen(true)}
              title="Search products (Cmd + K)"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <path d="M11 19a8 8 0 100-16 8 8 0 000 16zM21 21l-4.5-4.5" />
              </svg>
            </button>

            {/* CART ENQUIRY BUTTON */}
            <button className="icon-btn" onClick={openDrawer} title="Enquiry List">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <path d="M3 4h2l2.6 11.4A2 2 0 009.5 17h8a2 2 0 002-1.6L21 8H6M10 21a1 1 0 100-2 1 1 0 000 2M18 21a1 1 0 100-2 1 1 0 000 2" />
              </svg>
              <span className="badge" id="cartCount">{enquiry.length}</span>
            </button>

            <Link href="/contact" className="btn-quote-header desk-only">
              Request a Quote
            </Link>

            <button
              className="icon-btn mob-only"
              onClick={() => setIsMobileOpen(!isMobileOpen)}
              title="Toggle Menu"
            >
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                {isMobileOpen ? (
                  <path d="M18 6L6 18M6 6l12 12" />
                ) : (
                  <path d="M4 6h16M4 12h16M4 18h16" />
                )}
              </svg>
            </button>
          </div>
        </div>

        {/* MOBILE NAV OVERLAY */}
        {isMobileOpen && (
          <div className="mobile-nav-panel">
            {menuItems.map((item) => (
              <div key={item.id} className="mob-item">
                <Link
                  href={item.url}
                  className="mob-link"
                  onClick={() => setIsMobileOpen(false)}
                >
                  {item.title}
                </Link>
                {item.children && (
                  <div className="mob-sub">
                    {item.children.map((child) => (
                      <Link
                        key={child.id}
                        href={child.url}
                        className="mob-sub-link"
                        onClick={() => setIsMobileOpen(false)}
                      >
                        {child.title}
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            ))}
            <button
              className="btn btn-soft btn-lg"
              style={{ width: '100%', justifyContent: 'center', marginTop: 12 }}
              onClick={() => {
                setIsMobileOpen(false);
                setIsSearchOpen(true);
              }}
            >
              🔍 Search Products
            </button>
            <Link
              href="/contact"
              className="btn btn-primary btn-lg"
              style={{ width: '100%', justifyContent: 'center', marginTop: 12 }}
              onClick={() => setIsMobileOpen(false)}
            >
              Request a Quote
            </Link>
          </div>
        )}
      </header>

      {/* SEARCH MODAL POPUP */}
      <SearchModal isOpen={isSearchOpen} onClose={() => setIsSearchOpen(false)} />
    </>
  );
};
