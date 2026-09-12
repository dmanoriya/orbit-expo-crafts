'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';

interface FooterData {
  footer_tagline?: string;
  footer_address?: string;
  footer_phone?: string;
  footer_email?: string;
  social_instagram?: string;
  social_linkedin?: string;
  social_pinterest?: string;
  social_facebook?: string;
  social_whatsapp?: string;
}

let cachedFooterData: any = null;

const defaultFooterData: FooterData = {
  footer_tagline: 'Thoughtfully made furniture and décor for considered spaces.',
  footer_address: 'E-243, RIICO Industrial Area, Phase II, Udaipur, Rajasthan 313001, India',
  footer_phone: '+91 98290 00000',
  footer_email: 'trade@orbitexpocrafts.com',
  social_instagram: 'https://instagram.com/orbitexpocrafts',
  social_linkedin: 'https://linkedin.com/company/orbitexpocrafts',
  social_pinterest: 'https://pinterest.com/orbitexpocrafts',
  social_facebook: 'https://facebook.com/orbitexpocrafts',
  social_whatsapp: 'https://wa.me/919829000000',
};

export const Footer: React.FC = () => {
  const [data, setData] = useState<FooterData>(cachedFooterData || defaultFooterData);

  useEffect(() => {
    if (cachedFooterData) return;

    async function loadFooter() {
      try {
        const res = await fetch('/api/wp/config');
        if (res.ok) {
          const json = await res.json();
          if (json?.footer) {
            cachedFooterData = { ...defaultFooterData, ...json.footer };
            setData(cachedFooterData);
          }
        }
      } catch (e) {
        console.error(e);
      }
    }
    loadFooter();
  }, []);

  return (
    <footer className="site-luxury-footer">
      {/* Background illustration doodle along the bottom */}
      <div className="footer-doodle-bg" aria-hidden="true" />

      <div className="wrap footer-wrap">
        <div className="footer-layout-grid">
          {/* BRAND COLUMN WITH OUR OFFICIAL LOGO & TAGLINE */}
          <div className="footer-brand-pane">
            <Link href="/" className="footer-logo-link" aria-label="Orbit Expo Crafts Home">
              <img
                src="/logo.webp"
                alt="Orbit Expo Crafts"
                width={175}
                height={88}
                className="footer-brand-logo-img"
              />
            </Link>
            <span className="footer-gold-divider" aria-hidden="true" />
            <p className="footer-brand-tagline">
              {data.footer_tagline || 'Thoughtfully made furniture and décor for considered spaces.'}
            </p>
          </div>

          {/* VERTICAL DIVIDER LINE */}
          <div className="footer-vertical-rule" aria-hidden="true" />

          {/* NAVIGATION & CONNECT COLUMNS */}
          <div className="footer-nav-columns">
            {/* COLUMN 1: BUSINESS */}
            <div className="footer-col">
              <h4 className="footer-col-header">BUSINESS</h4>
              <span className="footer-header-underline" aria-hidden="true" />
              <ul className="footer-menu-list">
                <li><Link href="/contact?subject=Suppliers%20%26%20Vendors">Suppliers &amp; Vendors</Link></li>
                <li><Link href="/interior-designers">Architects &amp; Interior Designers</Link></li>
                <li><Link href="/contact?subject=Influencers%20%26%20Marketing">Influencers &amp; Marketing</Link></li>
                <li><Link href="/contact?subject=Furniture%20%26%20Decor%20Designers">Furniture &amp; Decor Designers</Link></li>
              </ul>
            </div>

            {/* COLUMN 2: TRADE */}
            <div className="footer-col">
              <h4 className="footer-col-header">TRADE</h4>
              <span className="footer-header-underline" aria-hidden="true" />
              <ul className="footer-menu-list">
                <li><Link href="/discuss-projects">Project &amp; Trade</Link></li>
                <li><Link href="/contact">Request a Quote</Link></li>
                <li><Link href="/craft">Material &amp; Crafts</Link></li>
                <li><Link href="/journal">Journal</Link></li>
              </ul>
            </div>

            {/* COLUMN 3: CUSTOMER CARE */}
            <div className="footer-col">
              <h4 className="footer-col-header">CUSTOMER CARE</h4>
              <span className="footer-header-underline" aria-hidden="true" />
              <ul className="footer-menu-list">
                <li><Link href="/shipping-policy">Shipping &amp; Delivery</Link></li>
                <li><Link href="/warranty-policy">Care Guide</Link></li>
                <li><Link href="/contact#faqs">FAQs</Link></li>
                <li><Link href="/contact">Contact Us</Link></li>
              </ul>
            </div>

            {/* COLUMN 4: CONNECT */}
            <div className="footer-col footer-connect-col">
              <h4 className="footer-col-header">CONNECT</h4>
              <span className="footer-header-underline" aria-hidden="true" />

              {/* SOCIAL MEDIA ICONS */}
              <div className="footer-social-icons">
                <a
                  href={data.social_instagram || 'https://instagram.com/orbitexpocrafts'}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="Instagram"
                  className="footer-social-icon"
                >
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
                    <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
                    <line x1="17.5" y1="6.5" x2="17.51" y2="6.5" />
                  </svg>
                </a>

                <a
                  href={data.social_pinterest || 'https://pinterest.com/orbitexpocrafts'}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="Pinterest"
                  className="footer-social-icon"
                >
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M12 2a10 10 0 0 0-3.16 19.49c.09-.78.18-1.98.04-2.84l.87-3.71s-.22-.44-.22-1.09c0-1.02.59-1.78 1.33-1.78.63 0 .93.47.93 1.03 0 .63-.4 1.58-.61 2.45-.17.73.37 1.33 1.1 1.33 1.31 0 2.32-1.38 2.32-3.38 0-1.77-1.27-3.01-3.09-3.01-2.1 0-3.34 1.58-3.34 3.2 0 .63.24 1.31.54 1.68.06.07.07.14.05.21l-.2.83c-.03.14-.11.17-.26.1-1-.46-1.63-1.92-1.63-3.09 0-2.52 1.83-4.84 5.28-4.84 2.77 0 4.93 1.98 4.93 4.62 0 2.76-1.74 4.98-4.16 4.98-.81 0-1.57-.42-1.83-.92l-.5 1.9c-.18.69-.67 1.55-1 2.08A10 10 0 1 0 12 2z" />
                  </svg>
                </a>

                <a
                  href={data.social_facebook || 'https://facebook.com/orbitexpocrafts'}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="Facebook"
                  className="footer-social-icon"
                >
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z" />
                  </svg>
                </a>

                <a
                  href="https://youtube.com/@orbitexpocrafts"
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="YouTube"
                  className="footer-social-icon"
                >
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M22.54 6.42a2.78 2.78 0 0 0-1.94-2C18.88 4 12 4 12 4s-6.88 0-8.6.46a2.78 2.78 0 0 0-1.94 2A29 29 0 0 0 1 11.75a29 29 0 0 0 .46 5.33A2.78 2.78 0 0 0 3.4 19c1.72.46 8.6.46 8.6.46s6.88 0 8.6-.46a2.78 2.78 0 0 0 1.94-2 29 29 0 0 0 .46-5.25 29 29 0 0 0-.46-5.33z" />
                    <polygon points="9.75 15.02 15.5 11.75 9.75 8.48 9.75 15.02" />
                  </svg>
                </a>
              </div>

              {/* WHATSAPP & PHONE */}
              <div className="footer-whatsapp-row">
                <a
                  href={data.social_whatsapp || 'https://wa.me/919829000000'}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="footer-whatsapp-link"
                >
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" className="footer-wa-icon">
                    <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" />
                  </svg>
                  <span className="footer-phone-text">{data.footer_phone || '+91 98290 00000'}</span>
                  <span className="footer-wa-divider">|</span>
                  <span className="footer-wa-chat">CHAT</span>
                </a>
              </div>

              {/* EMAIL */}
              <div className="footer-email-row">
                <a href={`mailto:${data.footer_email || 'trade@orbitexpocrafts.com'}`} className="footer-email-text">
                  {data.footer_email || 'trade@orbitexpocrafts.com'}
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* BOTTOM BAR WITH COPYRIGHT & POLICIES */}
      <div className="footer-bottom-bar">
        <div className="wrap footer-bottom-inner">
          <span className="footer-copy-text">© {new Date().getFullYear()} Orbit Expo Crafts</span>
          <span className="footer-pipe-sep" aria-hidden="true">|</span>
          <Link href="/privacy-policy" className="footer-legal-link">Privacy Policy</Link>
          <span className="footer-pipe-sep" aria-hidden="true">|</span>
          <Link href="/terms-and-conditions" className="footer-legal-link">Terms & Conditions</Link>
        </div>
      </div>
    </footer>
  );
};
