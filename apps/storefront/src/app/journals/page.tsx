import React from 'react';
import Link from 'next/link';

export const metadata = {
  title: 'Journals & Articles — ORBIT Expo Crafts',
  description: 'Insights into contract furniture manufacturing, timber treatments, bone inlay techniques, and turnkey hospitality fit-outs in Rajasthan.',
};

const JOURNAL_ARTICLES = [
  {
    slug: 'seasoning-timber-rajasthan-climate',
    title: 'Precision Kiln-Drying: Why 8-10% Moisture Content Matters for International Export',
    category: 'Timber Engineering',
    date: 'August 18, 2026',
    author: 'Rajeev Sharma, Chief Technical Director',
    readTime: '6 min read',
    image: '/categories/tables.jpg',
    excerpt: 'Solid wood exported from Rajasthan to humid or coastal environments must undergo vacuum kiln-seasoning to prevent warping, checking, or joint distortion across seasonal temperature swings.',
  },
  {
    slug: 'bone-inlay-craft-technique',
    title: 'The Heritage Art of Camel Bone & Mother of Pearl Inlay in Modern Luxury Hospitality',
    category: 'Artisanal Craft',
    date: 'July 24, 2026',
    author: 'Sunil Jha, Master Artisan Lead',
    readTime: '8 min read',
    image: '/categories/decor.jpg',
    excerpt: 'Trace the 400-year history of Rajasthani inlay work from royal palaces to contemporary boutique hotel credenzas, mirrors, and accent tables.',
  },
  {
    slug: 'turnkey-hotel-fitout-checklist',
    title: '45-Day Turnkey Room Package Delivery: Engineering Shop Drawings to Site Installation',
    category: 'Turnkey Execution',
    date: 'June 12, 2026',
    author: 'Divya Mehta, Project Operations Lead',
    readTime: '5 min read',
    image: '/categories/beds.jpg',
    excerpt: 'A comprehensive guide for architects and procurement agencies on streamlining pre-engineered room fit-outs with CAD approvals and containerized logistics.',
  },
  {
    slug: 'heavy-contract-durability-standards',
    title: 'Commercial Seating Specification: Martindale Ratings, Anti-Borer Treatment & Joinery Standards',
    category: 'Quality Standards',
    date: 'May 29, 2026',
    author: 'Karan Singhal, Lead Designer',
    readTime: '7 min read',
    image: '/categories/seating.jpg',
    excerpt: 'How we engineer contract chairs and banquettes to withstand high-footfall hotel dining, restaurant, and lounge environments without compromising aesthetic finesse.',
  },
];

export default function JournalsPage() {
  return (
    <div style={{ backgroundColor: '#FFFFFF', color: '#111111', minHeight: '100vh', padding: '40px 0 80px' }}>
      <div className="wrap">
        {/* PAGE HEADER */}
        <div style={{ borderBottom: '1px solid #E2DDD5', paddingBottom: '32px', marginBottom: '48px' }}>
          <div className="mono" style={{ color: '#666666', letterSpacing: '0.15em', marginBottom: '12px' }}>
            MANUFACTURING & DESIGN INSIGHTS
          </div>
          <h1 className="disp" style={{ fontSize: 'clamp(36px, 5vw, 56px)', fontWeight: 400, color: '#111111', margin: 0 }}>
            Journals & Field Notes
          </h1>
          <p style={{ fontSize: '18px', color: '#555555', maxWidth: '64ch', marginTop: '16px', lineHeight: '1.6' }}>
            Technical articles, craft heritage studies, and project specification guides from our Udaipur and Jodhpur production facilities.
          </p>
        </div>

        {/* FEATURED ARTICLE HERO */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '1.1fr 0.9fr',
            gap: '40px',
            alignItems: 'center',
            backgroundColor: '#F1EFE9',
            border: '1px solid #E2DDD5',
            borderRadius: '8px',
            padding: '36px',
            marginBottom: '64px',
          }}
        >
          <div>
            <span className="mono" style={{ color: '#111111', fontSize: '11px', fontWeight: 600, letterSpacing: '0.12em', display: 'inline-block', marginBottom: '12px' }}>
              FEATURED READ · {JOURNAL_ARTICLES[0].category}
            </span>
            <h2 className="disp" style={{ fontSize: '32px', fontWeight: 400, color: '#111111', lineHeight: '1.2', marginBottom: '16px' }}>
              {JOURNAL_ARTICLES[0].title}
            </h2>
            <p style={{ fontSize: '15.5px', color: '#4A4640', lineHeight: '1.6', marginBottom: '24px' }}>
              {JOURNAL_ARTICLES[0].excerpt}
            </p>
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px', fontSize: '13px', color: '#666666' }}>
              <span>{JOURNAL_ARTICLES[0].author}</span>
              <span>•</span>
              <span>{JOURNAL_ARTICLES[0].readTime}</span>
            </div>
          </div>
          <div style={{ width: '100%', height: '320px', borderRadius: '6px', overflow: 'hidden' }}>
            <img
              src={JOURNAL_ARTICLES[0].image}
              alt={JOURNAL_ARTICLES[0].title}
              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
            />
          </div>
        </div>

        {/* ARTICLES GRID */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: '32px' }}>
          {JOURNAL_ARTICLES.slice(1).map((article) => (
            <article
              key={article.slug}
              style={{
                backgroundColor: '#FFFFFF',
                border: '1px solid #E2DDD5',
                borderRadius: '8px',
                overflow: 'hidden',
                display: 'flex',
                flexDirection: 'column',
                transition: 'transform 0.2s ease, box-shadow 0.2s ease',
              }}
            >
              <div style={{ width: '100%', height: '220px', overflow: 'hidden', backgroundColor: '#F1EFE9' }}>
                <img
                  src={article.image}
                  alt={article.title}
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                />
              </div>
              <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', flex: 1 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                  <span className="mono" style={{ fontSize: '10.5px', color: '#777777', fontWeight: 600 }}>
                    {article.category}
                  </span>
                  <span style={{ fontSize: '12px', color: '#888888' }}>{article.readTime}</span>
                </div>
                <h3 className="disp" style={{ fontSize: '22px', fontWeight: 400, color: '#111111', lineHeight: '1.3', marginBottom: '12px' }}>
                  {article.title}
                </h3>
                <p style={{ fontSize: '14px', color: '#555555', lineHeight: '1.6', marginBottom: '20px', flex: 1 }}>
                  {article.excerpt}
                </p>
                <div style={{ borderTop: '1px solid #E2DDD5', paddingTop: '14px', marginTop: 'auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '12px', color: '#777777' }}>{article.date}</span>
                  <span style={{ fontSize: '13px', fontWeight: 600, color: '#111111' }}>Read Article →</span>
                </div>
              </div>
            </article>
          ))}
        </div>
      </div>
    </div>
  );
}
