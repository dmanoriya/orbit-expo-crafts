import React from 'react';
import Link from 'next/link';
import { notFound, permanentRedirect } from 'next/navigation';
import { fetchWpProductBySlug, fetchWpStorefrontData } from '../../../lib/wpCommerce';
import ProductClientView from './ProductClientView';
import { Metadata } from 'next';

export const revalidate = 60;

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const { product } = await fetchWpProductBySlug(slug);

  if (!product) {
    return {
      title: 'Product Not Found | Orbit Expo Crafts',
      robots: { index: false, follow: false },
    };
  }

  const seo = product.seo;
  const title = seo?.title || `${product.name} | Orbit Expo Crafts`;
  const description = seo?.description || product.shortDescription || product.description || `Custom contract specification ${product.name} for hospitality projects.`;
  const canonicalUrl = seo?.canonical || `https://orbitexpocrafts.com/product/${product.slug || slug}`;
  const ogImage = seo?.openGraph?.image || product.image || '/og-image.jpg';

  const isNoIndex = seo?.robots ? seo.robots.toLowerCase().includes('noindex') : false;
  const isNoFollow = seo?.robots ? seo.robots.toLowerCase().includes('nofollow') : false;

  return {
    title,
    description,
    alternates: {
      canonical: canonicalUrl,
    },
    robots: {
      index: !isNoIndex,
      follow: !isNoFollow,
      googleBot: {
        index: !isNoIndex,
        follow: !isNoFollow,
        'max-video-preview': -1,
        'max-image-preview': 'large',
        'max-snippet': -1,
      },
    },
    keywords: seo?.keywords ? seo.keywords.split(',').map((k) => k.trim()) : [product.name, product.catName, product.material || 'Solid Wood', 'Contract Furniture', 'Orbit Expo Crafts'],
    openGraph: {
      title: seo?.openGraph?.title || title,
      description: seo?.openGraph?.description || description,
      url: canonicalUrl,
      siteName: 'Orbit Expo Crafts',
      images: [
        {
          url: ogImage,
          width: 1200,
          height: 630,
          alt: product.name,
        },
      ],
      type: 'website',
    },
    twitter: {
      card: (seo?.twitter?.card as any) || 'summary_large_image',
      title: seo?.twitter?.title || title,
      description: seo?.twitter?.description || description,
      images: [seo?.twitter?.image || ogImage],
    },
  };
}

export default async function ProductDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const cleanSlug = decodeURIComponent(slug).toLowerCase();

  // Concurrent server-side data fetching from Next.js tagged cache
  const [productData, storefrontData] = await Promise.all([
    fetchWpProductBySlug(slug),
    fetchWpStorefrontData(),
  ]);

  const { product, gallery } = productData;

  if (!product) {
    return (
      <div className="wrap" style={{ padding: '100px 28px', textAlign: 'center', minHeight: '65vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
        <span className="mono" style={{ fontSize: 12, letterSpacing: '0.14em', color: 'var(--brand)', textTransform: 'uppercase', marginBottom: 12 }}>
          404 ERROR
        </span>
        <h1 className="disp" style={{ fontSize: 'clamp(28px, 4vw, 42px)', marginBottom: 16, fontWeight: 400 }}>
          Product Not Found
        </h1>
        <p style={{ color: 'var(--ink-2)', fontSize: 16, maxWidth: 460, marginBottom: 32, lineHeight: 1.6 }}>
          The product you are looking for has been removed, deleted, or is no longer available in our catalogue.
        </p>
        <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap', justifyContent: 'center' }}>
          <Link href="/collections" className="btn btn-primary" style={{ padding: '12px 24px' }}>
            BROWSE COLLECTIONS
          </Link>
          <Link href="/" className="btn btn-outline" style={{ padding: '12px 24px' }}>
            BACK TO HOME
          </Link>
        </div>
      </div>
    );
  }

  // Automatic 308/301 Permanent Redirect if the slug was updated in WordPress backend or accessed via SKU
  if (product.slug && product.slug.toLowerCase() !== cleanSlug) {
    permanentRedirect(`/product/${product.slug}`);
  }

  const allProducts = storefrontData?.products || [];
  const related = allProducts
    .filter((x) => String(x.id) !== String(product.id) && (x.cat === product.cat || x.catName === product.catName))
    .slice(0, 12);

  const initialGallery = gallery.length > 0 ? gallery : [product.image || '/fallback-product.svg'];

  return (
    <>
      {product.seo?.schema && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(product.seo.schema) }}
        />
      )}
      <ProductClientView
        initialProduct={product}
        initialGallery={initialGallery}
        relatedProducts={related}
      />
    </>
  );
}
