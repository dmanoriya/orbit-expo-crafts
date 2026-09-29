import React from 'react';
import Link from 'next/link';
import { fetchWpBlogPosts, WpBlogPostItem, FALLBACK_JOURNAL_ARTICLES } from '../../lib/wpCommerce';

export const revalidate = 60;

export const metadata = {
  title: 'Journals & Articles — ORBIT Expo Crafts',
  description: 'Insights into contract furniture manufacturing, timber treatments, bone inlay techniques, and turnkey hospitality fit-outs in Rajasthan.',
};

export default async function JournalsPage() {
  const wpPosts = await fetchWpBlogPosts();
  const articles = wpPosts && wpPosts.length > 0 ? wpPosts : FALLBACK_JOURNAL_ARTICLES;

  const featured = articles[0];
  const gridArticles = articles.slice(1);

  return (
    <div className="journal-page">
      <div className="wrap">
        {/* BREADCRUMBS */}
        <div className="crumbs" style={{ marginBottom: 16 }}>
          <Link href="/">Home</Link> / <span style={{ fontWeight: 600 }}>Journals</span>
        </div>

        {/* PAGE HEADER */}
        <div className="journal-page-header">
          <div className="mono" style={{ color: '#666666', letterSpacing: '0.15em', marginBottom: '10px' }}>
            MANUFACTURING &amp; DESIGN INSIGHTS
          </div>
          <h1 className="disp" style={{ fontSize: 'clamp(28px, 5.5vw, 54px)', fontWeight: 400, color: '#111111', margin: 0, lineHeight: 1.15 }}>
            Journals &amp; Field Notes
          </h1>
          <p style={{ fontSize: '16.5px', color: '#555555', maxWidth: '64ch', marginTop: '12px', lineHeight: '1.6' }}>
            Technical articles, craft heritage studies, and project specification guides directly from our Udaipur and Jodhpur production facilities.
          </p>
        </div>

        {/* FEATURED ARTICLE HERO */}
        {featured && (
          <Link
            href={`/journal/${featured.slug}`}
            style={{ textDecoration: 'none', color: 'inherit', display: 'block' }}
          >
            <div className="featured-journal-hero">
              <div className="featured-journal-content">
                <span className="mono" style={{ color: '#111111', fontSize: '11px', fontWeight: 600, letterSpacing: '0.12em', display: 'inline-block', marginBottom: '12px' }}>
                  FEATURED READ · {featured.category}
                </span>
                <h2 className="disp" style={{ fontSize: '32px', fontWeight: 400, color: '#111111', lineHeight: '1.2', marginBottom: '16px' }}>
                  {featured.title}
                </h2>
                <p style={{ fontSize: '15.5px', color: '#4A4640', lineHeight: '1.6', marginBottom: '20px' }}>
                  {featured.excerpt}
                </p>
                <div className="featured-journal-meta">
                  <span>{featured.author}</span>
                  <span>•</span>
                  <span>{featured.date}</span>
                  <span>•</span>
                  <span>{featured.readTime}</span>
                </div>
              </div>
              <div className="featured-journal-media">
                <img
                  src={featured.image}
                  alt={featured.title}
                />
              </div>
            </div>
          </Link>
        )}

        {/* ARTICLES GRID */}
        <div className="journal-grid">
          {gridArticles.map((article) => (
            <Link
              key={article.slug || article.id}
              href={`/journal/${article.slug}`}
              style={{ textDecoration: 'none', color: 'inherit', display: 'flex', flexDirection: 'column' }}
            >
              <article className="journal-card">
                <div className="journal-card-media">
                  <img
                    src={article.image}
                    alt={article.title}
                  />
                </div>
                <div className="journal-card-body">
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px', flexWrap: 'wrap', gap: 6 }}>
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
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
