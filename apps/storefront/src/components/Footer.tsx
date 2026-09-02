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

export const Footer: React.FC = () => {
  const [data, setData] = useState<FooterData>({
    footer_tagline: 'Bespoke contract & trade furniture handcrafted in Udaipur & Jodhpur for luxury resorts, boutique hotels and specifiers worldwide.',
    footer_address: 'E-243, RIICO Industrial Area, Phase II, Udaipur, Rajasthan 313001, India',
    footer_phone: '+91 98290 00000',
    footer_email: 'trade@orbitexpocrafts.com',
    social_instagram: 'https://instagram.com/orbitexpocrafts',
    social_linkedin: 'https://linkedin.com/company/orbitexpocrafts',
    social_pinterest: 'https://pinterest.com/orbitexpocrafts',
    social_facebook: 'https://facebook.com/orbitexpocrafts',
    social_whatsapp: 'https://wa.me/919829000000',
  });

  useEffect(() => {
    async function loadFooter() {
      try {
        const res = await fetch('/api/wp/config');
        if (res.ok) {
          const json = await res.json();
          if (json?.footer) {
            setData((prev) => ({ ...prev, ...json.footer }));
          }
        }
      } catch (e) {
        console.error(e);
      }
    }
    loadFooter();
  }, []);

  return (
    <footer className="site">
      <div className="wrap">
        <div className="fgrid">
          {/* COLUMN 1: BRAND LOGO, TAGLINE, ADDRESS & SOCIALS */}
          <div className="footer-col-main">
            <Link className="logo" href="/" style={{ marginBottom: 18, display: 'inline-flex', alignItems: 'center', gap: 12 }}>
              <img src="/logo.webp" alt="Orbit Expo Crafts Logo" style={{ height: 38, width: 'auto', objectFit: 'contain' }} />
              <span className="txt">
                <strong style={{ color: 'var(--deep-ink)', fontSize: 18, letterSpacing: '0.08em' }}>ORBIT</strong>
                <small style={{ color: 'color-mix(in srgb, var(--deep-ink) 65%, transparent)', fontSize: 10, letterSpacing: '0.14em', textTransform: 'uppercase' }}>Expo Crafts</small>
              </span>
            </Link>

            <p style={{ fontSize: '13.5px', color: 'color-mix(in srgb, var(--deep-ink) 72%, transparent)', lineHeight: 1.6, marginBottom: 20, maxWidth: '38ch' }}>
              {data.footer_tagline}
            </p>

            <div style={{ fontSize: '13px', color: 'color-mix(in srgb, var(--deep-ink) 80%, transparent)', lineHeight: 1.7, marginBottom: 20 }}>
              <p style={{ marginBottom: 6 }}>📍 {data.footer_address}</p>
              <p style={{ marginBottom: 6 }}>📞 <a href={`tel:${data.footer_phone}`} style={{ color: 'var(--brand)', fontWeight: 600 }}>{data.footer_phone}</a></p>
              <p>✉️ <a href={`mailto:${data.footer_email}`} style={{ color: 'var(--deep-ink)' }}>{data.footer_email}</a></p>
            </div>

            {/* SOCIAL MEDIA ICONS */}
            <div className="footer-socials" style={{ display: 'flex', gap: 10, marginTop: 16 }}>
              {data.social_instagram && (
                <a href={data.social_instagram} target="_blank" rel="noopener noreferrer" className="footer-social-btn" title="Instagram">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
                    <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
                    <line x1="17.5" y1="6.5" x2="17.51" y2="6.5" />
                  </svg>
                </a>
              )}

              {data.social_linkedin && (
                <a href={data.social_linkedin} target="_blank" rel="noopener noreferrer" className="footer-social-btn" title="LinkedIn">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z" />
                    <rect x="2" y="9" width="4" height="12" />
                    <circle cx="4" cy="4" r="2" />
                  </svg>
                </a>
              )}

              {data.social_pinterest && (
                <a href={data.social_pinterest} target="_blank" rel="noopener noreferrer" className="footer-social-btn" title="Pinterest">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M12 2a10 10 0 0 0-3.16 19.49c.09-.78.18-1.98.04-2.84l.87-3.71s-.22-.44-.22-1.09c0-1.02.59-1.78 1.33-1.78.63 0 .93.47.93 1.03 0 .63-.4 1.58-.61 2.45-.17.73.37 1.33 1.1 1.33 1.31 0 2.32-1.38 2.32-3.38 0-1.77-1.27-3.01-3.09-3.01-2.1 0-3.34 1.58-3.34 3.2 0 .63.24 1.31.54 1.68.06.07.07.14.05.21l-.2.83c-.03.14-.11.17-.26.1-1-.46-1.63-1.92-1.63-3.09 0-2.52 1.83-4.84 5.28-4.84 2.77 0 4.93 1.98 4.93 4.62 0 2.76-1.74 4.98-4.16 4.98-.81 0-1.57-.42-1.83-.92l-.5 1.9c-.18.69-.67 1.55-1 2.08A10 10 0 1 0 12 2z" />
                  </svg>
                </a>
              )}

              {data.social_facebook && (
                <a href={data.social_facebook} target="_blank" rel="noopener noreferrer" className="footer-social-btn" title="Facebook">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z" />
                  </svg>
                </a>
              )}

              {data.social_whatsapp && (
                <a href={data.social_whatsapp} target="_blank" rel="noopener noreferrer" className="footer-social-btn" title="WhatsApp Chat">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" />
                  </svg>
                </a>
              )}
            </div>
          </div>

          {/* COLUMN 2: PRODUCT CATEGORIES */}
          <div>
            <h6>Furniture Categories</h6>
            <ul>
              <li><Link href="/collections/furniture">Furniture Collections</Link></li>
              <li><Link href="/collections/home-decor">Home Decor</Link></li>
              <li><Link href="/collections/wall-decor-and-mirrors">Wall Decor & Mirrors</Link></li>
              <li><Link href="/collections/lighting">Lighting</Link></li>
              <li><Link href="/collections/rugs-and-floor-coverings">Rugs & Floor Coverings</Link></li>
              <li><Link href="/collections/storage-and-organization">Storage & Organization</Link></li>
              <li><Link href="/collections/kitchen-and-tabletop">Kitchen & Tabletop</Link></li>
              <li><Link href="/collections/outdoor-and-garden">Outdoor & Garden</Link></li>
            </ul>
          </div>

          {/* COLUMN 3: TRADE & SPECIFIERS */}
          <div>
            <h6>Trade & Specifiers</h6>
            <ul>
              <li><Link href="/collections">Hotel Furniture Spec</Link></li>
              <li><Link href="/collections">Villa & Resort Fit-out</Link></li>
              <li><Link href="/contact">Request Finish Swatches</Link></li>
              <li><Link href="/contact">Request CAD/3D Blocks</Link></li>
              <li><Link href="/catalogue">Hotel Furniture Spec</Link></li>
              <li><Link href="/catalogue">Villa & Resort Fit-out</Link></li>
              <li><Link href="/contact">Architect Trade Enquiry</Link></li>
            </ul>
          </div>

          {/* COLUMN 4: CRAFT & COMPANY */}
          <div>
            <h6>Craft & Company</h6>
            <ul>
              <li><Link href="/about">About Orbit Expo</Link></li>
              <li><Link href="/craft">Craft & Materials</Link></li>
              <li><Link href="/about">Factory & Kiln Drying</Link></li>
              <li><Link href="/about">Trade Credentials</Link></li>
              <li><Link href="/craft">FSC Wood Certification</Link></li>
              <li><Link href="/contact">Contact Factory Desk</Link></li>
            </ul>
          </div>

          {/* COLUMN 5: LEGAL & POLICIES */}
          <div>
            <h6>Legal & Policies</h6>
            <ul>
              <li><Link href="/privacy-policy">Privacy Policy</Link></li>
              <li><Link href="/terms-and-conditions">Terms & Conditions</Link></li>
              <li><Link href="/shipping-policy">Export & Freight Policy</Link></li>
              <li><Link href="/warranty-policy">Quality & Warranty Policy</Link></li>
              <li><Link href="/contact">Minimum Order Policy</Link></li>
            </ul>
          </div>
        </div>

        {/* BOTTOM BAR WITH COPYRIGHT & TRUST BADGES */}
        <div className="fbot" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 16, borderTop: '1px solid color-mix(in srgb, var(--deep-ink) 14%, transparent)', paddingTop: 24, marginTop: 40 }}>
          <span style={{ fontSize: 13, color: 'color-mix(in srgb, var(--deep-ink) 65%, transparent)' }}>
            © {new Date().getFullYear()} ORBIT Expo Crafts. All rights reserved. Handcrafted in Rajasthan, India.
          </span>

          <div style={{ display: 'flex', gap: 18, fontSize: 12, color: 'var(--brand)', fontWeight: 600 }}>
            <span>🌲 FSC® Certified Timber</span>
            <span>🌱 Low-VOC Stains</span>
            <span>🚢 ISPM-15 Fumigated Export</span>
          </div>

          <div className="fbot-links" style={{ display: 'flex', gap: 16, fontSize: 12 }}>
            <Link href="/privacy-policy" style={{ color: 'color-mix(in srgb, var(--deep-ink) 65%, transparent)' }}>Privacy</Link>
            <Link href="/terms-and-conditions" style={{ color: 'color-mix(in srgb, var(--deep-ink) 65%, transparent)' }}>Terms</Link>
            <Link href="/shipping-policy" style={{ color: 'color-mix(in srgb, var(--deep-ink) 65%, transparent)' }}>Export Shipping</Link>
            <Link href="/warranty-policy" style={{ color: 'color-mix(in srgb, var(--deep-ink) 65%, transparent)' }}>5-Yr Warranty</Link>
          </div>
        </div>
      </div>
    </footer>
  );
};
