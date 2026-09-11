import React from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import {
  fetchWpBlogPostBySlug,
  fetchWpBlogPosts,
  WpBlogPostItem,
  FALLBACK_JOURNAL_ARTICLES,
} from "../../../lib/wpCommerce";

interface JournalPostPageProps {
  params: Promise<{ slug: string }>;
}

export const revalidate = 60;

export async function generateMetadata({ params }: JournalPostPageProps): Promise<Metadata> {
  const { slug } = await params;
  const post = await fetchWpBlogPostBySlug(slug);

  if (!post) {
    return {
      title: "Article Not Found — ORBIT Expo Crafts",
      description: "The requested journal article could not be found.",
    };
  }

  const title = post.seo?.title || `${post.title} — ORBIT Expo Crafts`;
  const description = post.seo?.description || post.excerpt;
  const canonical = post.seo?.canonical || `https://orbitexpocrafts.com/journal/${post.slug}`;
  const ogImage = post.seo?.openGraph?.image || post.image || "/categories/tables.jpg";

  return {
    title,
    description,
    alternates: {
      canonical,
    },
    openGraph: {
      title,
      description,
      url: canonical,
      siteName: "ORBIT Expo Crafts",
      locale: "en_US",
      type: "article",
      publishedTime: post.date,
      images: [
        {
          url: ogImage,
          width: 1200,
          height: 630,
          alt: post.title,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [ogImage],
    },
  };
}

export default async function JournalPostPage({ params }: JournalPostPageProps) {
  const { slug } = await params;
  const post = await fetchWpBlogPostBySlug(slug);

  if (!post) {
    notFound();
  }

  // Fetch all posts to curate 3 related articles
  const allPosts = await fetchWpBlogPosts();
  const related = (allPosts && allPosts.length > 0 ? allPosts : FALLBACK_JOURNAL_ARTICLES)
    .filter((p) => p.slug !== post.slug && p.id !== post.id)
    .slice(0, 3);

  const fallbackSchema = {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    headline: post.title,
    description: post.excerpt,
    image: post.image ? [post.image] : [],
    datePublished: post.date,
    author: {
      "@type": "Organization",
      name: "Orbit Expo Crafts",
    },
    publisher: {
      "@type": "Organization",
      name: "Orbit Expo Crafts",
    },
    mainEntityOfPage: {
      "@type": "WebPage",
      "@id": `https://orbitexpocrafts.com/journal/${post.slug}`,
    },
  };

  const schemaJson = post.seo?.schema || fallbackSchema;

  return (
    <article className="journal-single-layout">
      {/* Schema.org BlogPosting JSON-LD */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(schemaJson) }}
      />

      <div className="wrap">
        {/* BREADCRUMBS & TOP BACK LINK */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 28, flexWrap: "wrap", gap: 12 }}>
          <div className="crumbs" style={{ margin: 0 }}>
            <Link href="/">Home</Link>
            <span>/</span>
            <Link href="/journal">Journal</Link>
            <span>/</span>
            <span style={{ fontWeight: 600, color: "#111111" }}>{post.category || "Article"}</span>
          </div>

          <Link
            href="/journal"
            style={{
              fontSize: "13px",
              fontWeight: 600,
              color: "#8C532B",
              textDecoration: "none",
              display: "inline-flex",
              alignItems: "center",
              gap: "6px",
            }}
          >
            ← Back to all articles
          </Link>
        </div>

        {/* ARTICLE HEADER */}
        <header className="journal-header-block">
          {post.category && (
            <div className="journal-meta-tag">
              <span>{post.category}</span>
              <span>·</span>
              <span>{post.readTime || "5 min read"}</span>
            </div>
          )}

          <h1 className="journal-article-title">{post.title}</h1>

          <div className="journal-article-meta">
            <span style={{ fontWeight: 500, color: "#111111" }}>By {post.author || "Orbit Expo Crafts Team"}</span>
            <span>•</span>
            <time dateTime={post.date}>{post.date}</time>
            <span>•</span>
            <span>Factory Dispatch Notes</span>
          </div>
        </header>

        {/* FEATURED HERO IMAGE */}
        {post.image && (
          <div className="journal-hero-art">
            <img src={post.image} alt={post.title} loading="eager" />
          </div>
        )}

        {/* ARTICLE BODY */}
        <div
          className="journal-content-body"
          dangerouslySetInnerHTML={{ __html: post.content || `<p>${post.excerpt}</p>` }}
        />

        {/* PROJECT INQUIRY / TRADE DESK CTA BOX */}
        <section className="journal-project-cta">
          <div style={{ maxWidth: "500px" }}>
            <span className="mono" style={{ fontSize: "11px", color: "#8C532B", fontWeight: 600, letterSpacing: "0.12em", display: "block", marginBottom: "8px" }}>
              DIRECT CONTRACT SPECIFICATION
            </span>
            <h3 className="disp" style={{ fontSize: "24px", fontWeight: 400, color: "#111111", margin: "0 0 10px" }}>
              Specifying bespoke furniture for a project?
            </h3>
            <p style={{ fontSize: "14.5px", color: "#555555", margin: 0, lineHeight: "1.6" }}>
              Send your project BOQ or drawings. Our engineering desk provides CAD review, timber samples, and formal pricing within 24 working hours.
            </p>
          </div>

          <div style={{ display: "flex", gap: "14px", flexWrap: "wrap", alignItems: "center" }}>
            <Link
              href="/contact"
              className="btn btn-primary btn-lg"
              style={{ padding: "14px 28px", fontSize: "14px" }}
            >
              Start an enquiry →
            </Link>
            <Link
              href="/collections"
              className="btn btn-outline btn-lg"
              style={{ padding: "14px 24px", fontSize: "14px", borderColor: "#D0C9BE", color: "#111111" }}
            >
              Browse 2026 collections
            </Link>
          </div>
        </section>

        {/* RELATED ARTICLES */}
        {related.length > 0 && (
          <section className="journal-related-section">
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: "32px" }}>
              <div>
                <span className="mono" style={{ fontSize: "11px", color: "#8C532B", fontWeight: 600, letterSpacing: "0.12em" }}>
                  CONTINUE READING
                </span>
                <h2 className="disp" style={{ fontSize: "28px", fontWeight: 400, color: "#111111", marginTop: "6px" }}>
                  More from the Journal
                </h2>
              </div>

              <Link href="/journal" style={{ fontSize: "13.5px", fontWeight: 600, color: "#111111" }}>
                View all articles →
              </Link>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))", gap: "28px" }}>
              {related.map((item) => (
                <Link
                  key={item.slug || item.id}
                  href={`/journal/${item.slug}`}
                  style={{ textDecoration: "none", color: "inherit", display: "flex", flexDirection: "column" }}
                >
                  <article
                    className="journal-card"
                    style={{
                      backgroundColor: "#FFFFFF",
                      border: "1px solid #E2DDD5",
                      borderRadius: "8px",
                      overflow: "hidden",
                      display: "flex",
                      flexDirection: "column",
                      height: "100%",
                      transition: "transform 0.2s ease, box-shadow 0.2s ease, border-color 0.2s ease",
                    }}
                  >
                    <div style={{ width: "100%", height: "190px", overflow: "hidden", backgroundColor: "#F1EFE9" }}>
                      <img
                        src={item.image}
                        alt={item.title}
                        style={{ width: "100%", height: "100%", objectFit: "cover" }}
                      />
                    </div>
                    <div style={{ padding: "20px", display: "flex", flexDirection: "column", flex: 1 }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "10px" }}>
                        <span className="mono" style={{ fontSize: "10px", color: "#777777", fontWeight: 600 }}>
                          {item.category}
                        </span>
                        <span style={{ fontSize: "11.5px", color: "#888888" }}>{item.readTime}</span>
                      </div>
                      <h3 className="disp" style={{ fontSize: "19px", fontWeight: 400, color: "#111111", lineHeight: "1.3", marginBottom: "10px" }}>
                        {item.title}
                      </h3>
                      <p style={{ fontSize: "13.5px", color: "#555555", lineHeight: "1.5", marginBottom: "16px", flex: 1 }}>
                        {item.excerpt}
                      </p>
                      <div style={{ borderTop: "1px solid #EAE6DF", paddingTop: "12px", marginTop: "auto", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                        <span style={{ fontSize: "12px", color: "#777777" }}>{item.date}</span>
                        <span style={{ fontSize: "12.5px", fontWeight: 600, color: "#8C532B" }}>Read Article →</span>
                      </div>
                    </div>
                  </article>
                </Link>
              ))}
            </div>
          </section>
        )}
      </div>
    </article>
  );
}
