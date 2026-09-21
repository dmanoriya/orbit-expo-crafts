'use client';

import React, { useState, useEffect, useMemo, useRef } from 'react';
import Link from 'next/link';
import { useSearchParams, useRouter } from 'next/navigation';
import { CATEGORIES, SEGMENTS, MATERIALS, FINISHES, ProductItem, MOCK_PRODUCTS, getProductSlug } from '../../data/catalogData';
import { useEnquiry } from '../../context/EnquiryContext';
import { useFavorites } from '../../context/FavoritesContext';
import { fetchWpStorefrontData, getCachedStorefrontData, WpCategoryItem, WpColorItem } from '../../lib/wpCommerce';
import ProductSkeletonGrid from '../../components/ProductSkeletonGrid';
import Pagination from '../../components/Pagination';

interface CatalogueClientProps {
  initialCategory?: string;
  initialProducts?: ProductItem[];
  initialCategories?: WpCategoryItem[];
  initialSegments?: string[];
  initialMaterials?: string[];
  initialColors?: WpColorItem[];
  isWpConnected?: boolean;
}

const ITEMS_PER_PAGE = 24;

export default function CatalogueClient({
  initialCategory,
  initialProducts,
  initialCategories,
  initialSegments,
  initialMaterials,
  initialColors,
  isWpConnected: initialWpConnected,
}: CatalogueClientProps) {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { addEnquiry } = useEnquiry();
  const { isFavorite, toggleFavorite } = useFavorites();

  const activeCategoryParam = initialCategory || searchParams.get('cat') || 'all';

  const [catFilter, setCatFilter] = useState(activeCategoryParam);
  const [typeFilter, setTypeFilter] = useState(searchParams.get('type') || 'all');
  const [segFilter, setSegFilter] = useState(searchParams.get('seg') || 'all');
  const [matFilter, setMatFilter] = useState(searchParams.get('mat') || 'all');
  const [colorFilter, setColorFilter] = useState(searchParams.get('color') || 'all');
  const [moqFilter, setMoqFilter] = useState(searchParams.get('moq') || 'all');
  const [leadFilter, setLeadFilter] = useState(searchParams.get('lead') || 'all');
  const [badgeFilter, setBadgeFilter] = useState(searchParams.get('badge') || 'all');
  const [sortFilter, setSortFilter] = useState(searchParams.get('sort') || 'default');
  const [searchQuery, setSearchQuery] = useState(searchParams.get('search') || searchParams.get('q') || '');
  const [currentPage, setCurrentPage] = useState(1);

  const initialCache = getCachedStorefrontData();

  const [products, setProducts] = useState<ProductItem[]>(
    initialProducts || (initialCache ? initialCache.products : MOCK_PRODUCTS)
  );
  const [categories, setCategories] = useState<WpCategoryItem[]>(
    initialCategories || (initialCache ? initialCache.categories : [])
  );
  const [segmentsList, setSegmentsList] = useState<string[]>(
    initialSegments || (initialCache && initialCache.segments.length > 0 ? initialCache.segments : SEGMENTS)
  );
  const [materialsList, setMaterialsList] = useState<string[]>(
    initialMaterials || (initialCache && initialCache.materials.length > 0 ? initialCache.materials : MATERIALS)
  );
  const [colorsList, setColorsList] = useState<WpColorItem[]>(
    initialColors || (initialCache && initialCache.colors.length > 0 ? initialCache.colors : FINISHES)
  );
  const [isWpConnected, setIsWpConnected] = useState(
    initialWpConnected ?? (initialCache ? initialCache.isWpConnected : false)
  );
  const [loading, setLoading] = useState(!initialProducts && !initialCache);
  const [isMobileFilterOpen, setIsMobileFilterOpen] = useState(false);

  const gridRef = useRef<HTMLDivElement>(null);

  // Sync state when search params or URL category changes
  useEffect(() => {
    const cat = initialCategory || searchParams.get('cat') || 'all';
    setCatFilter(cat);
    setTypeFilter(searchParams.get('type') || 'all');
    setSegFilter(searchParams.get('seg') || 'all');
    setMatFilter(searchParams.get('mat') || 'all');
    setColorFilter(searchParams.get('color') || 'all');
    setMoqFilter(searchParams.get('moq') || 'all');
    setLeadFilter(searchParams.get('lead') || 'all');
    setBadgeFilter(searchParams.get('badge') || 'all');
    setSortFilter(searchParams.get('sort') || 'default');
    setSearchQuery(searchParams.get('search') || searchParams.get('q') || '');
    const p = parseInt(searchParams.get('page') || '1', 10);
    setCurrentPage(isNaN(p) || p < 1 ? 1 : p);
  }, [initialCategory, searchParams]);

  useEffect(() => {
    if (initialProducts && initialProducts.length > 0) {
      setProducts(initialProducts);
      if (initialCategories) setCategories(initialCategories);
      if (initialSegments) setSegmentsList(initialSegments);
      if (initialMaterials) setMaterialsList(initialMaterials);
      if (initialColors) setColorsList(initialColors);
      if (initialWpConnected !== undefined) setIsWpConnected(initialWpConnected);
      setLoading(false);
      return;
    }
    async function loadData() {
      const data = await fetchWpStorefrontData();
      setProducts(data.products);
      setCategories(data.categories);
      if (data.segments && data.segments.length > 0) setSegmentsList(data.segments);
      if (data.materials && data.materials.length > 0) setMaterialsList(data.materials);
      if (data.colors && data.colors.length > 0) setColorsList(data.colors);
      setIsWpConnected(data.isWpConnected);
      setLoading(false);
    }
    loadData();
  }, [initialProducts, initialCategories, initialSegments, initialMaterials, initialColors, initialWpConnected]);

  // Active category object
  const activeCategory = useMemo(() => {
    if (catFilter === 'all') return null;
    const clean = catFilter.toLowerCase();
    return categories.find((c) => c.slug.toLowerCase() === clean || c.id.toLowerCase() === clean || String(c.wpId) === clean) || null;
  }, [categories, catFilter]);

  // Category descendant slugs set
  const activeCategorySlugsSet = useMemo(() => {
    const set = new Set<string>();
    if (!activeCategory) {
      if (catFilter !== 'all') set.add(catFilter.toLowerCase());
      return set;
    }

    set.add(activeCategory.slug.toLowerCase());
    set.add(activeCategory.id.toLowerCase());
    if (activeCategory.wpId) set.add(String(activeCategory.wpId));

    if (activeCategory.wpId) {
      const queue = [activeCategory.wpId];
      const childrenMap = new Map<number, WpCategoryItem[]>();
      categories.forEach((item) => {
        if (item.parent) {
          const list = childrenMap.get(item.parent) || [];
          list.push(item);
          childrenMap.set(item.parent, list);
        }
      });

      while (queue.length > 0) {
        const currentId = queue.shift()!;
        const kids = childrenMap.get(currentId) || [];
        kids.forEach((k) => {
          set.add(k.slug.toLowerCase());
          set.add(k.id.toLowerCase());
          if (k.wpId) {
            set.add(String(k.wpId));
            queue.push(k.wpId);
          }
        });
      }
    }
    return set;
  }, [activeCategory, catFilter, categories]);

  // Dynamically calculate available filter options and product counts
  const filterOptions = useMemo(() => {
    const typeCountMap = new Map<string, number>();
    const segCountMap = new Map<string, number>();
    const matCountMap = new Map<string, number>();
    const colorCountMap = new Map<string, number>();
    let moqLowCount = 0;
    let moqMedCount = 0;
    let moqBulkCount = 0;
    let leadFastCount = 0;
    let leadStdCount = 0;
    let leadCustCount = 0;
    let badgeNewCount = 0;
    let badgeBestCount = 0;
    let badgeMtoCount = 0;

    const allKnownTypes = Array.from(new Set(CATEGORIES.flatMap((c) => c.types))).sort((a, b) => b.length - a.length);

    // Filter base pool by category
    const basePool = products.filter((p) => {
      if (catFilter === 'all') return true;
      const prodSlugs = [
        p.cat?.toLowerCase(),
        ...((p as any).catSlugs || []).map((s: string) => s.toLowerCase()),
        ...((p as any).categories || []).map((c: any) => String(c.slug || '').toLowerCase()),
        ...((p as any).categories || []).map((c: any) => String(c.id || '')),
      ].filter(Boolean);

      const prodCatNames: string[] = [
        p.catName?.toLowerCase(),
        ...((p as any).catNames || []).map((n: string) => n.toLowerCase()),
        ...((p as any).categories || []).map((c: any) => String(c.name || '').toLowerCase()),
      ].filter(Boolean);

      return (
        prodSlugs.some((s) => activeCategorySlugsSet.has(s)) ||
        prodCatNames.some((n) => activeCategorySlugsSet.has(n)) ||
        (activeCategory && (
          prodSlugs.includes(activeCategory.slug.toLowerCase()) ||
          (activeCategory.wpId && prodSlugs.includes(String(activeCategory.wpId))) ||
          prodCatNames.includes(activeCategory.name.toLowerCase())
        ))
      );
    });

    basePool.forEach((p) => {
      // Type / Subtype
      let detectedType = (p as any).subtype;
      if (!detectedType) {
        const lowerName = (p.name || '').toLowerCase();
        for (const t of allKnownTypes) {
          if (lowerName.includes(t.toLowerCase())) {
            detectedType = t;
            break;
          }
        }
      }
      if (!detectedType && (p as any).type && (p as any).type !== 'variable' && (p as any).type !== 'simple') {
        detectedType = (p as any).type;
      }
      if (detectedType) {
        typeCountMap.set(detectedType, (typeCountMap.get(detectedType) || 0) + 1);
      }

      // Segments / Spaces
      const pSegs = new Set<string>();
      if (p.segment) pSegs.add(p.segment);
      if ((p as any).segment2) pSegs.add((p as any).segment2);
      if (Array.isArray((p as any).attributes?.pa_segment)) {
        (p as any).attributes.pa_segment.forEach((s: string) => pSegs.add(s));
      }
      if (Array.isArray((p as any).attributes?.segment)) {
        (p as any).attributes.segment.forEach((s: string) => pSegs.add(s));
      }
      pSegs.forEach((s) => segCountMap.set(s, (segCountMap.get(s) || 0) + 1));

      // Materials & Crafts
      const pMats = new Set<string>();
      if (p.material) pMats.add(p.material);
      if ((p as any).material2) pMats.add((p as any).material2);
      if (Array.isArray((p as any).attributes?.pa_material)) {
        (p as any).attributes.pa_material.forEach((m: string) => pMats.add(m));
      }
      if (Array.isArray((p as any).attributes?.material)) {
        (p as any).attributes.material.forEach((m: string) => pMats.add(m));
      }
      pMats.forEach((m) => matCountMap.set(m, (matCountMap.get(m) || 0) + 1));

      // Colors & Finishes
      const pCols = new Set<string>();
      if (p.color) pCols.add(p.color);
      if (Array.isArray((p as any).availableColors)) {
        (p as any).availableColors.forEach((c: string) => pCols.add(c));
      }
      if (Array.isArray((p as any).attributes?.pa_color)) {
        (p as any).attributes.pa_color.forEach((c: string) => pCols.add(c));
      }
      pCols.forEach((c) => colorCountMap.set(c, (colorCountMap.get(c) || 0) + 1));

      // MOQ
      const moq = Number(p.moq) || 1;
      if (moq <= 2) moqLowCount++;
      else if (moq <= 10) moqMedCount++;
      else moqBulkCount++;

      // Lead Time
      const lead = Number(p.lead) || Number((p as any).leadTime) || 21;
      if (lead <= 21) leadFastCount++;
      else if (lead <= 30) leadStdCount++;
      else leadCustCount++;

      // Badges
      if (p.badge === 'New' || (p as any).is_new) badgeNewCount++;
      if (p.badge === 'Best Seller' || (p as any).onSale) badgeBestCount++;
      if (p.lead >= 21 || (p as any).leadTime >= 21) badgeMtoCount++;
    });

    const types = Array.from(typeCountMap.entries())
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count || a.name.localeCompare(b.name));

    const segments = Array.from(segCountMap.entries())
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count || a.name.localeCompare(b.name));

    const materials = Array.from(matCountMap.entries())
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count || a.name.localeCompare(b.name));

    const colors = Array.from(colorCountMap.entries())
      .map(([name, count]) => {
        const match = FINISHES.find((f) => f.name.toLowerCase() === name.toLowerCase());
        return { name, code: match?.code || '#8A7968', count };
      })
      .sort((a, b) => b.count - a.count || a.name.localeCompare(b.name));

    return {
      basePoolCount: basePool.length,
      types,
      segments,
      materials,
      colors,
      moq: { low: moqLowCount, med: moqMedCount, bulk: moqBulkCount },
      lead: { fast: leadFastCount, std: leadStdCount, cust: leadCustCount },
      badges: { new: badgeNewCount, bestseller: badgeBestCount, mto: badgeMtoCount },
    };
  }, [products, catFilter, activeCategory, activeCategorySlugsSet]);

  const activeFiltersCount =
    (catFilter !== 'all' ? 1 : 0) +
    (typeFilter !== 'all' ? 1 : 0) +
    (segFilter !== 'all' ? 1 : 0) +
    (matFilter !== 'all' ? 1 : 0) +
    (colorFilter !== 'all' ? 1 : 0) +
    (moqFilter !== 'all' ? 1 : 0) +
    (leadFilter !== 'all' ? 1 : 0) +
    (badgeFilter !== 'all' ? 1 : 0) +
    (sortFilter !== 'default' ? 1 : 0) +
    (searchQuery ? 1 : 0);

  const updateFilter = (key: string, value: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (value === 'all' || value === 'default' || !value) {
      params.delete(key);
    } else {
      params.set(key, value);
    }
    params.delete('page');

    if (key === 'cat') setCatFilter(value);
    if (key === 'type') setTypeFilter(value);
    if (key === 'seg') setSegFilter(value);
    if (key === 'mat') setMatFilter(value);
    if (key === 'color') setColorFilter(value);
    if (key === 'moq') setMoqFilter(value);
    if (key === 'lead') setLeadFilter(value);
    if (key === 'badge') setBadgeFilter(value);
    if (key === 'sort') setSortFilter(value);

    const basePath = '/catalogue';
    const query = params.toString();
    router.push(query ? `${basePath}?${query}` : basePath, { scroll: false });
  };

  const handleClearAllFilters = () => {
    setCatFilter('all');
    setTypeFilter('all');
    setSegFilter('all');
    setMatFilter('all');
    setColorFilter('all');
    setMoqFilter('all');
    setLeadFilter('all');
    setBadgeFilter('all');
    setSortFilter('default');
    setSearchQuery('');
    router.push('/catalogue');
  };

  const handleRemoveChip = (key: string) => {
    const params = new URLSearchParams(searchParams.toString());
    params.delete(key);
    params.delete('page');

    if (key === 'cat') setCatFilter('all');
    if (key === 'type') setTypeFilter('all');
    if (key === 'seg') setSegFilter('all');
    if (key === 'mat') setMatFilter('all');
    if (key === 'color') setColorFilter('all');
    if (key === 'moq') setMoqFilter('all');
    if (key === 'lead') setLeadFilter('all');
    if (key === 'badge') setBadgeFilter('all');
    if (key === 'sort') setSortFilter('default');
    if (key === 'search' || key === 'q') {
      params.delete('search');
      params.delete('q');
      setSearchQuery('');
    }

    const basePath = '/catalogue';
    const query = params.toString();
    router.push(query ? `${basePath}?${query}` : basePath, { scroll: false });
  };

  const activeChips = useMemo(() => {
    const chips: Array<{ key: string; label: string; value: string }> = [];
    if (catFilter !== 'all') {
      const matchCat = categories.find((c) => c.slug.toLowerCase() === catFilter.toLowerCase() || c.id.toLowerCase() === catFilter.toLowerCase());
      chips.push({ key: 'cat', label: 'Category', value: matchCat?.name || catFilter });
    }
    if (typeFilter !== 'all') {
      chips.push({ key: 'type', label: 'Type', value: typeFilter });
    }
    if (segFilter !== 'all') {
      chips.push({ key: 'seg', label: 'Space', value: segFilter });
    }
    if (matFilter !== 'all') {
      chips.push({ key: 'mat', label: 'Material', value: matFilter });
    }
    if (colorFilter !== 'all') {
      chips.push({ key: 'color', label: 'Finish', value: colorFilter });
    }
    if (moqFilter !== 'all') {
      const moqLabels: Record<string, string> = { low: '1–2 units', medium: '3–10 units', bulk: '11+ units' };
      chips.push({ key: 'moq', label: 'MOQ', value: moqLabels[moqFilter] || moqFilter });
    }
    if (leadFilter !== 'all') {
      const leadLabels: Record<string, string> = { fast: '≤ 21 days', standard: '22–30 days', custom: '31+ days' };
      chips.push({ key: 'lead', label: 'Lead Time', value: leadLabels[leadFilter] || leadFilter });
    }
    if (badgeFilter !== 'all') {
      const badgeLabels: Record<string, string> = { new: 'New Arrivals', bestseller: 'Best Sellers', custom: 'Made-To-Order' };
      chips.push({ key: 'badge', label: 'Collection', value: badgeLabels[badgeFilter] || badgeFilter });
    }
    if (sortFilter !== 'default') {
      const sortLabels: Record<string, string> = {
        newest: 'Newest First',
        'price-asc': 'Price: Low to High',
        'price-desc': 'Price: High to Low',
        'name-asc': 'Name: A to Z',
      };
      chips.push({ key: 'sort', label: 'Sort', value: sortLabels[sortFilter] || sortFilter });
    }
    if (searchQuery) {
      chips.push({ key: 'search', label: 'Search', value: `"${searchQuery}"` });
    }
    return chips;
  }, [catFilter, typeFilter, segFilter, matFilter, colorFilter, moqFilter, leadFilter, badgeFilter, sortFilter, searchQuery, categories]);

  // Multi-attribute product filtering
  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      // 0. Category filter
      if (catFilter !== 'all') {
        const prodCatSlug = (p.cat || '').toLowerCase();
        const prodCatName = (p.catName || '').toLowerCase();

        const prodSlugs: string[] = Array.from(
          new Set([
            prodCatSlug,
            ...(p.catSlugs || []).map((s) => s.toLowerCase()),
            ...((p as any).categories || []).map((c: any) => String(c.slug || '').toLowerCase()),
            ...((p as any).categories || []).map((c: any) => String(c.id || '')),
          ])
        ).filter(Boolean);

        const prodCatNames: string[] = Array.from(
          new Set([
            prodCatName,
            ...((p as any).catNames || []).map((n: string) => n.toLowerCase()),
            ...((p as any).categories || []).map((c: any) => String(c.name || '').toLowerCase()),
          ])
        ).filter(Boolean);

        const isCategoryMatch =
          prodSlugs.some((s) => activeCategorySlugsSet.has(s)) ||
          prodCatNames.some((n) => activeCategorySlugsSet.has(n)) ||
          (activeCategory && (
            prodSlugs.includes(activeCategory.slug.toLowerCase()) ||
            (activeCategory.wpId && prodSlugs.includes(String(activeCategory.wpId))) ||
            prodCatNames.includes(activeCategory.name.toLowerCase())
          ));

        if (!isCategoryMatch) return false;
      }

      // 1. Product Type / Subtype
      if (typeFilter !== 'all') {
        const targetType = typeFilter.toLowerCase();
        const pType = ((p as any).type || '').toLowerCase();
        const pSubtype = ((p as any).subtype || '').toLowerCase();
        const pName = (p.name || '').toLowerCase();
        const matchesType = pType === targetType || pType.includes(targetType) || pSubtype === targetType || pName.includes(targetType);
        if (!matchesType) return false;
      }

      // 2. Space / Segment
      if (segFilter !== 'all') {
        const targetSeg = segFilter.toLowerCase();
        const prodSegs = [
          p.segment,
          (p as any).segment2,
          ...(Array.isArray((p as any).attributes?.pa_segment) ? (p as any).attributes.pa_segment : []),
          ...(Array.isArray((p as any).attributes?.segment) ? (p as any).attributes.segment : []),
        ].filter(Boolean).map((s: string) => s.toLowerCase());

        const matchesSeg = prodSegs.some((s: string) => s === targetSeg || s.includes(targetSeg) || targetSeg.includes(s));
        if (!matchesSeg) return false;
      }

      // 3. Material & Craft
      if (matFilter !== 'all') {
        const targetMat = matFilter.toLowerCase();
        const prodMats = [
          p.material,
          (p as any).material2,
          (p as any).specs?.material,
          (p as any).specs?.material2,
          ...(Array.isArray((p as any).attributes?.pa_material) ? (p as any).attributes.pa_material : []),
          ...(Array.isArray((p as any).attributes?.material) ? (p as any).attributes.material : []),
        ].filter(Boolean).map((m: string) => m.toLowerCase());

        const matchesMat = prodMats.some((m: string) => m === targetMat || m.includes(targetMat) || targetMat.includes(m));
        if (!matchesMat) return false;
      }

      // 4. Color & Finish
      if (colorFilter !== 'all') {
        const targetCol = colorFilter.toLowerCase();
        const prodColors = [
          p.color,
          ...((p as any).availableColors || []),
          ...(Array.isArray((p as any).attributes?.pa_color) ? (p as any).attributes.pa_color : []),
          ...((p as any).variations || []).map((v: any) => v.color),
        ].filter(Boolean).map((c: string) => c.toLowerCase());

        const matchesCol = prodColors.some((c: string) => c === targetCol || c.includes(targetCol) || targetCol.includes(c));
        if (!matchesCol) return false;
      }

      // 5. Minimum Order (MOQ)
      if (moqFilter !== 'all') {
        const moq = Number(p.moq) || 1;
        if (moqFilter === 'low' && moq > 2) return false;
        if (moqFilter === 'medium' && (moq < 3 || moq > 10)) return false;
        if (moqFilter === 'bulk' && moq <= 10) return false;
      }

      // 6. Lead Time
      if (leadFilter !== 'all') {
        const lead = Number(p.lead) || Number((p as any).leadTime) || 21;
        if (leadFilter === 'fast' && lead > 21) return false;
        if (leadFilter === 'standard' && (lead < 22 || lead > 30)) return false;
        if (leadFilter === 'custom' && lead <= 30) return false;
      }

      // 7. Curated Collection / Badge
      if (badgeFilter !== 'all') {
        if (badgeFilter === 'new' && p.badge !== 'New' && !(p as any).is_new) return false;
        if (badgeFilter === 'bestseller' && p.badge !== 'Best Seller' && !(p as any).onSale) return false;
        if (badgeFilter === 'custom' && ((p.badge as string) === 'In Stock' || (p as any).inStock === true)) return false;
      }

      // 8. Text search
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        const availCols = ((p as any).availableColors || []).join(' ').toLowerCase();
        const haystack = [p.name, p.id, (p as any).sku, (p as any).type, p.catName, p.material, (p as any).material2, p.segment, availCols].join(' ').toLowerCase();
        if (!haystack.includes(q)) return false;
      }

      return true;
    });
  }, [products, catFilter, activeCategory, activeCategorySlugsSet, typeFilter, segFilter, matFilter, colorFilter, moqFilter, leadFilter, badgeFilter, searchQuery]);

  const sortedProducts = useMemo(() => {
    const list = [...filteredProducts];
    if (sortFilter === 'newest') {
      list.sort((a, b) => {
        const dateA = (a as any).dateCreated ? new Date((a as any).dateCreated).getTime() : 0;
        const dateB = (b as any).dateCreated ? new Date((b as any).dateCreated).getTime() : 0;
        if (dateA !== dateB) return dateB - dateA;
        const numA = parseInt(String(a.id).replace(/\D/g, ''), 10) || 0;
        const numB = parseInt(String(b.id).replace(/\D/g, ''), 10) || 0;
        return numB - numA;
      });
    } else if (sortFilter === 'price-asc') {
      list.sort((a, b) => ((a as any).price || 0) - ((b as any).price || 0));
    } else if (sortFilter === 'price-desc') {
      list.sort((a, b) => ((b as any).price || 0) - ((a as any).price || 0));
    } else if (sortFilter === 'name-asc') {
      list.sort((a, b) => a.name.localeCompare(b.name));
    }
    return list;
  }, [filteredProducts, sortFilter]);

  const totalPages = Math.ceil(sortedProducts.length / ITEMS_PER_PAGE);

  const paginatedProducts = useMemo(() => {
    const safePage = Math.min(Math.max(1, currentPage), Math.max(1, totalPages));
    const start = (safePage - 1) * ITEMS_PER_PAGE;
    return sortedProducts.slice(start, start + ITEMS_PER_PAGE);
  }, [sortedProducts, currentPage, totalPages]);

  const handlePageChange = (newPage: number) => {
    setCurrentPage(newPage);
    const params = new URLSearchParams(searchParams.toString());
    if (newPage > 1) params.set('page', String(newPage));
    else params.delete('page');

    const basePath = '/catalogue';
    const query = params.toString();
    router.push(query ? `${basePath}?${query}` : basePath, { scroll: false });

    if (gridRef.current) {
      gridRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  return (
    <div className="wrap" style={{ paddingBottom: 80 }}>
      {/* CRUMBS */}
      <div className="crumbs">
        <Link href="/">Home</Link> / <Link href="/catalogue">Catalogue</Link>
        {activeCategory && <span> / {activeCategory.name}</span>}
      </div>

      {/* CATALOGUE HERO */}
      <div className="cat-hero" style={{ margin: '16px 0 32px' }}>
        <div>
          <h1 className="disp" style={{ fontSize: 'clamp(28px, 4vw, 42px)', margin: '0 0 8px', textTransform: 'capitalize' }}>
            {activeCategory ? activeCategory.name : 'All Collections & Architectural Designs'}
          </h1>
          <p style={{ maxWidth: 720, color: 'var(--ink-2)', lineHeight: 1.6 }}>
            {activeCategory?.description ||
              'Explore handcrafted bespoke furniture, lighting, rugs, and decor elements engineered for luxury hospitality, commercial fit-outs, and high-end residential projects.'}
          </p>
        </div>
      </div>

      {/* FILTER DRAWER BACKDROP (MOBILE/TABLET) */}
      <div
        className={`filter-drawer-backdrop ${isMobileFilterOpen ? 'open' : ''}`}
        onClick={() => setIsMobileFilterOpen(false)}
      />

      {/* MAIN CATALOGUE LAYOUT */}
      <div className="cat-layout">
        {/* SIDEBAR FILTERS */}
        <aside className={`filters ${isMobileFilterOpen ? 'drawer-open' : ''}`}>
          <div className="filter-drawer-header">
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <h4>Filter Catalogue</h4>
              {activeFiltersCount > 0 && (
                <button className="clear-all-btn" onClick={handleClearAllFilters}>
                  Reset ({activeFiltersCount})
                </button>
              )}
            </div>
            <button className="close-btn" onClick={() => setIsMobileFilterOpen(false)} aria-label="Close filters">
              ✕
            </button>
          </div>

          <div className="filter-drawer-content">
            {/* 1. CATEGORY */}
            <div className="fgroup">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                <h5>Category</h5>
                {catFilter !== 'all' && (
                  <button onClick={() => updateFilter('cat', 'all')} style={{ background: 'none', border: 'none', color: 'var(--brand)', fontSize: 11, cursor: 'pointer', textDecoration: 'underline' }}>
                    View All
                  </button>
                )}
              </div>

              <button
                className={`fopt ${catFilter === 'all' ? 'on' : ''}`}
                onClick={() => updateFilter('cat', 'all')}
                style={{ fontWeight: 600, marginBottom: 6 }}
              >
                <span>All Categories</span>
                <span className="fopt-count">({products.length})</span>
              </button>

              <div className="fgroup-scroll">
                {categories.map((c) => (
                  <button
                    key={c.id || c.slug}
                    className={`fopt ${catFilter.toLowerCase() === (c.slug || c.id).toLowerCase() ? 'on' : ''}`}
                    onClick={() => updateFilter('cat', c.slug || c.id)}
                  >
                    <span>{c.name}</span>
                    {c.count !== undefined && <span className="fopt-count">({c.count})</span>}
                  </button>
                ))}
              </div>
            </div>

            {/* 2. PRODUCT SUBTYPE / ITEM TYPE */}
            {filterOptions.types.length > 0 && (
              <div className="fgroup">
                <h5>
                  <span>Product Type</span>
                  {typeFilter !== 'all' && (
                    <button onClick={() => updateFilter('type', 'all')} style={{ background: 'none', border: 'none', color: 'var(--brand)', fontSize: 11, cursor: 'pointer', textDecoration: 'underline' }}>
                      Reset
                    </button>
                  )}
                </h5>
                <button
                  className={`fopt ${typeFilter === 'all' ? 'on' : ''}`}
                  onClick={() => updateFilter('type', 'all')}
                >
                  <span>All Types</span>
                  <span className="fopt-count">({filterOptions.basePoolCount})</span>
                </button>
                <div className="fgroup-scroll">
                  {filterOptions.types.map((t) => (
                    <button
                      key={t.name}
                      className={`fopt ${typeFilter.toLowerCase() === t.name.toLowerCase() ? 'on' : ''}`}
                      onClick={() => updateFilter('type', t.name)}
                    >
                      <span>{t.name}</span>
                      <span className="fopt-count">({t.count})</span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* 3. SPACE / SEGMENT */}
            {filterOptions.segments.length > 0 && (
              <div className="fgroup">
                <h5>
                  <span>Space / Segment</span>
                  {segFilter !== 'all' && (
                    <button onClick={() => updateFilter('seg', 'all')} style={{ background: 'none', border: 'none', color: 'var(--brand)', fontSize: 11, cursor: 'pointer', textDecoration: 'underline' }}>
                      Reset
                    </button>
                  )}
                </h5>
                <button
                  className={`fopt ${segFilter === 'all' ? 'on' : ''}`}
                  onClick={() => updateFilter('seg', 'all')}
                >
                  <span>All Spaces</span>
                  <span className="fopt-count">({filterOptions.basePoolCount})</span>
                </button>
                <div className="fgroup-scroll">
                  {filterOptions.segments.map((s) => (
                    <button
                      key={s.name}
                      className={`fopt ${segFilter.toLowerCase() === s.name.toLowerCase() ? 'on' : ''}`}
                      onClick={() => updateFilter('seg', s.name)}
                    >
                      <span>{s.name}</span>
                      <span className="fopt-count">({s.count})</span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* 4. MATERIAL & CRAFT */}
            {filterOptions.materials.length > 0 && (
              <div className="fgroup">
                <h5>
                  <span>Material & Craft</span>
                  {matFilter !== 'all' && (
                    <button onClick={() => updateFilter('mat', 'all')} style={{ background: 'none', border: 'none', color: 'var(--brand)', fontSize: 11, cursor: 'pointer', textDecoration: 'underline' }}>
                      Reset
                    </button>
                  )}
                </h5>
                <button
                  className={`fopt ${matFilter === 'all' ? 'on' : ''}`}
                  onClick={() => updateFilter('mat', 'all')}
                >
                  <span>All Materials</span>
                  <span className="fopt-count">({filterOptions.basePoolCount})</span>
                </button>
                <div className="fgroup-scroll">
                  {filterOptions.materials.map((m) => (
                    <button
                      key={m.name}
                      className={`fopt ${matFilter.toLowerCase() === m.name.toLowerCase() ? 'on' : ''}`}
                      onClick={() => updateFilter('mat', m.name)}
                    >
                      <span>{m.name}</span>
                      <span className="fopt-count">({m.count})</span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* 5. COLOR & FINISH */}
            {filterOptions.colors.length > 0 && (
              <div className="fgroup">
                <h5>
                  <span>Color & Finish</span>
                  {colorFilter !== 'all' && (
                    <button onClick={() => updateFilter('color', 'all')} style={{ background: 'none', border: 'none', color: 'var(--brand)', fontSize: 11, cursor: 'pointer', textDecoration: 'underline' }}>
                      Reset
                    </button>
                  )}
                </h5>
                <button
                  className={`fopt ${colorFilter === 'all' ? 'on' : ''}`}
                  onClick={() => updateFilter('color', 'all')}
                >
                  <span>All Finishes</span>
                  <span className="fopt-count">({filterOptions.basePoolCount})</span>
                </button>
                <div className="fgroup-scroll">
                  {filterOptions.colors.map((col) => (
                    <button
                      key={col.name}
                      className={`fopt ${colorFilter.toLowerCase() === col.name.toLowerCase() ? 'on' : ''}`}
                      onClick={() => updateFilter('color', col.name)}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <span style={{ width: 12, height: 12, borderRadius: 2, background: col.code, border: '1px solid rgba(0,0,0,0.18)', flexShrink: 0 }} />
                        <span>{col.name}</span>
                      </div>
                      <span className="fopt-count">({col.count})</span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* 6. MINIMUM ORDER (MOQ) */}
            <div className="fgroup">
              <h5>
                <span>Minimum Order (MOQ)</span>
                {moqFilter !== 'all' && (
                  <button onClick={() => updateFilter('moq', 'all')} style={{ background: 'none', border: 'none', color: 'var(--brand)', fontSize: 11, cursor: 'pointer', textDecoration: 'underline' }}>
                    Reset
                  </button>
                )}
              </h5>
              <button className={`fopt ${moqFilter === 'all' ? 'on' : ''}`} onClick={() => updateFilter('moq', 'all')}>
                <span>All Quantities</span>
                <span className="fopt-count">({filterOptions.basePoolCount})</span>
              </button>
              {filterOptions.moq.low > 0 && (
                <button className={`fopt ${moqFilter === 'low' ? 'on' : ''}`} onClick={() => updateFilter('moq', 'low')}>
                  <span>Low MOQ (1–2 units)</span>
                  <span className="fopt-count">({filterOptions.moq.low})</span>
                </button>
              )}
              {filterOptions.moq.med > 0 && (
                <button className={`fopt ${moqFilter === 'medium' ? 'on' : ''}`} onClick={() => updateFilter('moq', 'medium')}>
                  <span>Medium (3–10 units)</span>
                  <span className="fopt-count">({filterOptions.moq.med})</span>
                </button>
              )}
              {filterOptions.moq.bulk > 0 && (
                <button className={`fopt ${moqFilter === 'bulk' ? 'on' : ''}`} onClick={() => updateFilter('moq', 'bulk')}>
                  <span>Volume Orders (11+ units)</span>
                  <span className="fopt-count">({filterOptions.moq.bulk})</span>
                </button>
              )}
            </div>

            {/* 7. LEAD TIME */}
            <div className="fgroup">
              <h5>
                <span>Production Lead Time</span>
                {leadFilter !== 'all' && (
                  <button onClick={() => updateFilter('lead', 'all')} style={{ background: 'none', border: 'none', color: 'var(--brand)', fontSize: 11, cursor: 'pointer', textDecoration: 'underline' }}>
                    Reset
                  </button>
                )}
              </h5>
              <button className={`fopt ${leadFilter === 'all' ? 'on' : ''}`} onClick={() => updateFilter('lead', 'all')}>
                <span>All Lead Times</span>
                <span className="fopt-count">({filterOptions.basePoolCount})</span>
              </button>
              {filterOptions.lead.fast > 0 && (
                <button className={`fopt ${leadFilter === 'fast' ? 'on' : ''}`} onClick={() => updateFilter('lead', 'fast')}>
                  <span>Quick Ship (≤ 21 days)</span>
                  <span className="fopt-count">({filterOptions.lead.fast})</span>
                </button>
              )}
              {filterOptions.lead.std > 0 && (
                <button className={`fopt ${leadFilter === 'standard' ? 'on' : ''}`} onClick={() => updateFilter('lead', 'standard')}>
                  <span>Standard (22–30 days)</span>
                  <span className="fopt-count">({filterOptions.lead.std})</span>
                </button>
              )}
              {filterOptions.lead.cust > 0 && (
                <button className={`fopt ${leadFilter === 'custom' ? 'on' : ''}`} onClick={() => updateFilter('lead', 'custom')}>
                  <span>Custom Project (31+ days)</span>
                  <span className="fopt-count">({filterOptions.lead.cust})</span>
                </button>
              )}
            </div>

            {/* 8. CURATED COLLECTION */}
            <div className="fgroup">
              <h5>
                <span>Curated Status</span>
                {badgeFilter !== 'all' && (
                  <button onClick={() => updateFilter('badge', 'all')} style={{ background: 'none', border: 'none', color: 'var(--brand)', fontSize: 11, cursor: 'pointer', textDecoration: 'underline' }}>
                    Reset
                  </button>
                )}
              </h5>
              <button className={`fopt ${badgeFilter === 'all' ? 'on' : ''}`} onClick={() => updateFilter('badge', 'all')}>
                <span>All Pieces</span>
                <span className="fopt-count">({filterOptions.basePoolCount})</span>
              </button>
              {filterOptions.badges.new > 0 && (
                <button className={`fopt ${badgeFilter === 'new' ? 'on' : ''}`} onClick={() => updateFilter('badge', 'new')}>
                  <span>New Arrivals</span>
                  <span className="fopt-count">({filterOptions.badges.new})</span>
                </button>
              )}
              {filterOptions.badges.bestseller > 0 && (
                <button className={`fopt ${badgeFilter === 'bestseller' ? 'on' : ''}`} onClick={() => updateFilter('badge', 'bestseller')}>
                  <span>Best Sellers</span>
                  <span className="fopt-count">({filterOptions.badges.bestseller})</span>
                </button>
              )}
              {filterOptions.badges.mto > 0 && (
                <button className={`fopt ${badgeFilter === 'custom' ? 'on' : ''}`} onClick={() => updateFilter('badge', 'custom')}>
                  <span>Made-To-Order</span>
                  <span className="fopt-count">({filterOptions.badges.mto})</span>
                </button>
              )}
            </div>
          </div>

          <div className="filter-drawer-footer">
            <button className="btn btn-primary" style={{ width: '100%', justifyContent: 'center' }} onClick={() => setIsMobileFilterOpen(false)}>
              Show {filteredProducts.length} Designs
            </button>
          </div>
        </aside>

        {/* MAIN PRODUCT DISPLAY */}
        <div ref={gridRef} style={{ scrollMarginTop: 100 }}>
          {/* SEARCH TOOLBAR */}
          <div className="toolbar">
            <button className="filter-toggle-btn" onClick={() => setIsMobileFilterOpen(true)} aria-label="Open filter options">
              <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3" />
              </svg>
              <span>Filter & Refine</span>
              {activeFiltersCount > 0 && <span className="filter-count-badge">{activeFiltersCount}</span>}
            </button>

            <div className="searchbox">
              <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M11 19a8 8 0 100-16 8 8 0 000 16zM21 21l-4.5-4.5" />
              </svg>
              <input
                placeholder="Search designs, codes, materials…"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>

            <div className="sortbox" style={{ display: 'flex', alignItems: 'center', gap: 6, marginLeft: 'auto' }}>
              <label htmlFor="cat-sort-select" style={{ fontSize: 13, color: 'var(--ink-2)', whiteSpace: 'nowrap' }}>Sort:</label>
              <select
                id="cat-sort-select"
                value={sortFilter}
                onChange={(e) => updateFilter('sort', e.target.value)}
                style={{
                  padding: '7px 12px',
                  borderRadius: 'var(--r-sm, 6px)',
                  border: '1px solid var(--border-color, #E2DDD5)',
                  background: 'var(--surface, #FFF)',
                  color: 'var(--ink, #1F1E1C)',
                  fontSize: 13,
                  fontFamily: 'inherit',
                  cursor: 'pointer',
                }}
                aria-label="Sort designs"
              >
                <option value="default">Featured / Default</option>
                <option value="newest">Newest First</option>
                <option value="price-asc">Price: Low to High</option>
                <option value="price-desc">Price: High to Low</option>
                <option value="name-asc">Name: A to Z</option>
              </select>
            </div>

            <span className="mono" style={{ color: 'var(--ink-3)', whiteSpace: 'nowrap' }}>
              {sortedProducts.length} designs
            </span>
          </div>

          {/* ACTIVE FILTER CHIPS */}
          {activeChips.length > 0 && (
            <div className="active-filter-bar">
              <span className="active-filter-label">Active:</span>
              {activeChips.map((chip) => (
                <button
                  key={chip.key}
                  className="active-filter-chip"
                  onClick={() => handleRemoveChip(chip.key)}
                  title={`Remove ${chip.label} filter`}
                >
                  <span>{chip.label}: <strong>{chip.value}</strong></span>
                  <span className="chip-x">✕</span>
                </button>
              ))}
              <button className="clear-all-chips-btn" onClick={handleClearAllFilters}>
                Clear All
              </button>
            </div>
          )}

          {/* PRODUCT GRID */}
          {loading ? (
            <ProductSkeletonGrid count={8} />
          ) : filteredProducts.length > 0 ? (
            <>
              <div className="prod-grid">
                {paginatedProducts.map((p) => (
                  <article key={p.id} className="card">
                    <div className="thumb" style={{ position: 'relative' }}>
                      {p.badge && p.badge.toLowerCase() !== 'none' && (
                        <span className={`tag ${p.badge === 'New' ? 'new' : ''}`}>{p.badge}</span>
                      )}
                      <button
                        type="button"
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          toggleFavorite({
                            id: p.id,
                            name: p.name,
                            catName: p.catName,
                            image: (p as any).img || p.image || '/fallback-product.svg',
                            moq: p.moq || 1,
                            material: p.material,
                            finish: (p as any).color || (p as any).finish,
                            slug: getProductSlug(p),
                          });
                        }}
                        title={isFavorite(p.id) ? 'Remove from Favourites' : 'Save to Favourites'}
                        aria-label={isFavorite(p.id) ? 'Remove from Favourites' : 'Save to Favourites'}
                        style={{
                          position: 'absolute',
                          top: 8,
                          right: 8,
                          width: 32,
                          height: 32,
                          borderRadius: '50%',
                          background: isFavorite(p.id) ? '#FFFFFF' : 'rgba(255, 255, 255, 0.9)',
                          border: '1px solid rgba(0, 0, 0, 0.08)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          cursor: 'pointer',
                          zIndex: 3,
                          boxShadow: '0 2px 6px rgba(0,0,0,0.12)',
                          transition: 'all 0.2s ease',
                        }}
                      >
                        <svg
                          width="16"
                          height="16"
                          viewBox="0 0 24 24"
                          fill={isFavorite(p.id) ? '#B85735' : 'none'}
                          stroke={isFavorite(p.id) ? '#B85735' : '#111111'}
                          strokeWidth="1.8"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        >
                          <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
                        </svg>
                      </button>

                      <Link href={`/product/${getProductSlug(p)}`}>
                        <img
                          src={(p as any).img || p.image || '/fallback-product.svg'}
                          alt={p.name}
                          loading="lazy"
                          onError={(e) => {
                            e.currentTarget.onerror = null;
                            e.currentTarget.src = (p as any).cat ? `/categories/${(p as any).cat}.jpg` : '/fallback-product.svg';
                          }}
                        />
                      </Link>

                      <div className="acts">
                        <Link href={`/product/${getProductSlug(p)}`} className="btn btn-soft btn-sm">
                          Details
                        </Link>
                        <button
                          className="btn btn-primary btn-sm"
                          onClick={() =>
                            addEnquiry({
                              id: p.id,
                              name: p.name,
                              catName: p.catName,
                              q: p.moq,
                              image: (p as any).img || p.image || '/fallback-product.svg',
                              moq: p.moq,
                              unitPrice: p.price || 0,
                              currency: p.currency || 'INR',
                              currencySymbol: p.currencySymbol || '₹',
                              material: p.material,
                              finish: p.color,
                              slug: p.slug,
                            })
                          }
                        >
                          + Enquiry
                        </button>
                      </div>
                    </div>

                    <div className="body">
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 6, marginBottom: 4 }}>
                        <span className="meta">{p.catName || p.type || 'FURNITURE'}</span>
                        <span className="made-to-order-tag">Made-To-Order</span>
                      </div>
                      <Link href={`/product/${getProductSlug(p)}`}>
                        <h4>{p.name}</h4>
                      </Link>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 8, fontSize: 12, color: 'var(--ink-3)' }}>
                        <span>MOQ: <strong style={{ color: 'var(--ink)' }}>{p.moq || 1} units</strong></span>
                        <span>Lead: <strong style={{ color: 'var(--ink)' }}>{p.lead || (p as any).leadTime || 21}d</strong></span>
                      </div>
                      <span className="price-note">Price on request</span>
                    </div>
                  </article>
                ))}
              </div>

              {/* PAGINATION */}
              <Pagination
                currentPage={currentPage}
                totalPages={totalPages}
                totalItems={filteredProducts.length}
                itemsPerPage={ITEMS_PER_PAGE}
                onPageChange={handlePageChange}
              />
            </>
          ) : (
            <div className="empty" style={{ textAlign: 'center', padding: '60px 20px', background: 'var(--surface)', borderRadius: 'var(--r-lg)', border: '1px solid var(--line)' }}>
              <svg width="56" height="56" viewBox="0 0 24 24" fill="none" stroke="var(--line)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ margin: '0 auto 16px' }}>
                <path d="M11 19a8 8 0 100-16 8 8 0 000 16zM21 21l-4.5-4.5" />
              </svg>
              <h4 className="disp" style={{ fontSize: 24 }}>No designs match that combination</h4>
              <p style={{ margin: '8px 0 18px', color: 'var(--ink-2)' }}>
                We very likely still make it — we build to drawing.
              </p>
              <button onClick={handleClearAllFilters} className="btn btn-primary" style={{ marginRight: 12 }}>
                Clear Filters
              </button>
              <Link href="/contact" className="btn btn-outline">
                Ask our project desk
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
