import React from 'react';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { fetchWpProductBySlug, fetchWpStorefrontData } from '../../../lib/wpCommerce';
import ProductClientView from './ProductClientView';
import { Metadata } from 'next';

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const { product } = await fetchWpProductBySlug(slug);

  if (!product) {
    return {
      title: 'Product Not Found | Orbit Expo Crafts',
    };
  }

  return {
    title: `${product.name} | Orbit Expo Crafts`,
    description: product.shortDescription || product.description || `Custom contract specification ${product.name} for hospitality projects.`,
  };
}

export default async function ProductDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;

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
          <Link href="/catalogue" className="btn btn-primary" style={{ padding: '12px 24px' }}>
            BROWSE CATALOGUE
          </Link>
          <Link href="/" className="btn btn-outline" style={{ padding: '12px 24px' }}>
            BACK TO HOME
          </Link>
        </div>
      </div>
    );
  }

  const allProducts = storefrontData?.products || [];
  const related = allProducts
    .filter((x) => String(x.id) !== String(product.id) && (x.cat === product.cat || x.catName === product.catName))
    .slice(0, 12);

  const initialGallery = gallery.length > 0 ? gallery : [product.image || '/fallback-product.svg'];

  return (
    <ProductClientView
      initialProduct={product}
      initialGallery={initialGallery}
      relatedProducts={related}
    />
  );
}
