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
    title: 'Catalogue',
    url: '/catalogue',
    children: [
      { id: 21, title: 'Seating & Chairs', url: '/catalogue/seating' },
      { id: 22, title: 'Tables & Dining', url: '/catalogue/tables' },
      { id: 23, title: 'Sofas & Lounges', url: '/catalogue/sofas' },
      { id: 24, title: 'Beds & Nightstands', url: '/catalogue/beds' },
      { id: 25, title: 'Credenzas & Storage', url: '/catalogue/storage' },
      { id: 26, title: 'Outdoor & Patio', url: '/catalogue/outdoor' },
      { id: 27, title: 'Lighting', url: '/catalogue/lighting' },
      { id: 28, title: 'Decor & Objects', url: '/catalogue/decor' },
    ],
  },
  { id: 3, title: 'Turnkey Projects', url: '/turnkey' },
  { id: 4, title: 'Craft & Materials', url: '/craft' },
  { id: 5, title: 'About', url: '/about' },
];

import { decodeHtmlEntities } from '../lib/wpCommerce';

function normalizeMenuItems(items: MenuItem[]): MenuItem[] {
  return items.map((item) => {
    let cleanUrl = item.url || '/';
    // Strip backend domain if present
    cleanUrl = cleanUrl.replace(/^https?:\/\/[^\/]+/, '');

    // Convert legacy query params /catalogue?cat=seating -> SEO URL /catalogue/seating
    if (cleanUrl.includes('/catalogue?cat=')) {
      const catSlug = cleanUrl.split('/catalogue?cat=')[1]?.split('&')[0];
      if (catSlug) {
        cleanUrl = `/catalogue/${catSlug}`;
      }
    }

    // Convert WooCommerce category taxonomy links /product-category/seating/ -> SEO URL /catalogue/seating
    if (cleanUrl.includes('/product-category/')) {
      const parts = cleanUrl.split('/product-category/')[1]?.split('/').filter(Boolean);
      const catSlug = parts?.[0];
      if (catSlug) {
        cleanUrl = `/catalogue/${catSlug}`;
      }
    }

    return {
      ...item,
      title: decodeHtmlEntities(item.title || ''),
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
    async function fetchWpMenu() {
      try {
        const res = await fetch('/api/wp/menu').catch(() => null);
        if (res && res.ok) {
          const json = await res.json().catch(() => null);
          if (json && json.success && Array.isArray(json.data?.items) && json.data.items.length > 0) {
            setMenuItems(normalizeMenuItems(json.data.items));
          }
        }
      } catch (err) {
        console.log('Using default header navigation menu structure:', err);
      }
    }
    fetchWpMenu();
  }, []);

  return (
    <>
      <header className={`site ${isScrolled ? 'scrolled' : ''}`}>
        {/* TOPBAR */}
        <div className="topbar">
          <div className="wrap">
            <span>Udaipur & Jodhpur Works, Rajasthan &nbsp;·&nbsp; Exporting to 24 countries</span>
            <span>Trade & bulk enquiries: <b>+91 98290 00000</b> &nbsp;·&nbsp; Direct Factory — <b>quote-first</b></span>
          </div>
        </div>

        {/* MAIN NAV HEADER */}
        <div className="wrap nav">
          {/* LOGO IMAGE ONLY */}
          <Link className="logo" href="/" style={{ padding: '4px 0' }}>
            <img
              src="/logo.webp"
              alt="ORBIT Expo Crafts"
              style={{ height: '48px', width: 'auto', objectFit: 'contain' }}
            />
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
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            {/* SEARCH TRIGGER BUTTON */}
            <button
              className="icon-btn search-trigger-btn"
              onClick={() => setIsSearchOpen(true)}
              title="Search products (Cmd + K)"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <path d="M11 19a8 8 0 100-16 8 8 0 000 16zM21 21l-4.5-4.5" />
              </svg>
            </button>

            {/* CART ENQUIRY BUTTON */}
            <button className="icon-btn" onClick={openDrawer} title="Enquiry List">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <path d="M3 4h2l2.6 11.4A2 2 0 009.5 17h8a2 2 0 002-1.6L21 8H6M10 21a1 1 0 100-2 1 1 0 000 2M18 21a1 1 0 100-2 1 1 0 000 2" />
              </svg>
              <span className="badge" id="cartCount">{enquiry.length}</span>
            </button>

            <Link href="/contact" className="btn btn-primary btn-sm desk-only">
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
