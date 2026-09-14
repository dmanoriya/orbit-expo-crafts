'use client';

import React, { useState, useEffect, useMemo, useRef } from 'react';
import Link from 'next/link';
import { useSearchParams, useRouter } from 'next/navigation';
import { CATEGORIES, SEGMENTS, MATERIALS, FINISHES, ProductItem, MOCK_PRODUCTS, getProductSlug } from '../../data/catalogData';
import { useEnquiry } from '../../context/EnquiryContext';
import { useFavorites } from '../../context/FavoritesContext';
import {
  fetchWpStorefrontData,
  getCachedStorefrontData,
  WpCategoryItem,
  WpColorItem,
  getCategorySeoPath,
  getCategoryBreadcrumbs,
} from '../../lib/wpCommerce';
import { resolveTaxonomyPath } from '../../lib/categoryTaxonomy';
import ProductSkeletonGrid from '../../components/ProductSkeletonGrid';
import Pagination from '../../components/Pagination';

interface CollectionsClientProps {
  slugArray?: string[];
  initialProducts?: ProductItem[];
  initialCategories?: WpCategoryItem[];
  initialSegments?: string[];
  initialMaterials?: string[];
  initialColors?: WpColorItem[];
  isWpConnected?: boolean;
}

const ITEMS_PER_PAGE = 24;

export default function CollectionsClient({
  slugArray = [],
  initialProducts,
  initialCategories,
  initialSegments,
  initialMaterials,
  initialColors,
  isWpConnected: initialWpConnected,
}: CollectionsClientProps) {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { addEnquiry } = useEnquiry();
  const { isFavorite, toggleFavorite } = useFavorites();

  const activeCategorySlug = slugArray.length > 0 ? decodeURIComponent(slugArray[slugArray.length - 1]).toLowerCase().trim() : 'all';

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
  const [expandedCats, setExpandedCats] = useState<Record<string, boolean>>({});

  const gridRef = useRef<HTMLDivElement>(null);

  // Sync state when search params or URL slug changes
  useEffect(() => {
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
    setCurrentPage(isNaN(p) ? 1 : p);
  }, [searchParams, slugArray]);

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

  // Resolve taxonomy path metadata
  const taxonomyInfo = useMemo(() => resolveTaxonomyPath(slugArray), [slugArray]);

  // Find active category item
  const activeCategory = useMemo(() => {
    if (activeCategorySlug === 'all') return null;
    const direct = categories.find(
      (c) =>
        c.slug.toLowerCase() === activeCategorySlug ||
        c.id.toLowerCase() === activeCategorySlug ||
        String(c.wpId) === activeCategorySlug
    );
    if (direct) return direct;

    for (let i = slugArray.length - 1; i >= 0; i--) {
      const s = decodeURIComponent(slugArray[i]).toLowerCase().trim();
      const match = categories.find(
        (c) => c.slug.toLowerCase() === s || c.id.toLowerCase() === s || String(c.wpId) === s
      );
      if (match) return match;
    }
    return null;
  }, [categories, activeCategorySlug, slugArray]);

  // Active category display title (from WooCommerce or master taxonomy tree)
  const activeCategoryName = useMemo(() => {
    if (slugArray.length === 0 || slugArray[0] === 'all') return null;
    if (activeCategory) return activeCategory.name;
    return taxonomyInfo.displayName;
  }, [activeCategory, taxonomyInfo, slugArray]);

  // Automatically expand active category's ancestors in the accordion
  useEffect(() => {
    if (!activeCategory || categories.length === 0) return;

    const idMap = new Map<number, WpCategoryItem>();
    categories.forEach((c) => {
      if (c.wpId) idMap.set(c.wpId, c);
    });

    const newExpanded: Record<string, boolean> = { ...expandedCats };
    let current: WpCategoryItem | undefined = activeCategory;
    while (current) {
      newExpanded[current.slug] = true;
      if (current.parent && idMap.has(current.parent)) {
        current = idMap.get(current.parent);
      } else {
        break;
      }
    }
    setExpandedCats(newExpanded);
  }, [activeCategory, categories]);

  // Get descendant category slugs set for deep matching
  const activeCategorySlugsSet = useMemo(() => {
    const set = new Set<string>();
    if (!activeCategory) {
      if (activeCategorySlug !== 'all') {
        set.add(activeCategorySlug.toLowerCase());
      }
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
  }, [activeCategory, activeCategorySlug, categories]);

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

    // Filter base by category if browsing a specific category
    const basePool = products.filter((p) => {
      if (activeCategorySlug === 'all') return true;
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

      const isDirectMatch =
        prodSlugs.some((s) => activeCategorySlugsSet.has(s)) ||
        prodCatNames.some((n) => activeCategorySlugsSet.has(n)) ||
        (activeCategory && (
          prodSlugs.includes(activeCategory.slug.toLowerCase()) ||
          (activeCategory.wpId && prodSlugs.includes(String(activeCategory.wpId))) ||
          prodCatNames.includes(activeCategory.name.toLowerCase())
        ));

      const isTaxonomyMatch = taxonomyInfo.matchingTerms.some((term) => {
        const t = term.toLowerCase();
        return (
          prodSlugs.some((s) => s === t || s.includes(t)) ||
          prodCatNames.some((n) => n === t || n.includes(t)) ||
          ((p as any).type && (p as any).type.toLowerCase().includes(t)) ||
          (taxonomyInfo.level === 3 && (p.name || '').toLowerCase().includes(t))
        );
      });

      return isDirectMatch || isTaxonomyMatch;
    });

    const allKnownTypes = Array.from(new Set(CATEGORIES.flatMap((c) => c.types))).sort((a, b) => b.length - a.length);

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
  }, [products, activeCategorySlug, activeCategory, activeCategorySlugsSet, taxonomyInfo]);

  const activeFiltersCount =
    (activeCategorySlug !== 'all' ? 1 : 0) +
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

    if (key === 'type') setTypeFilter(value);
    if (key === 'seg') setSegFilter(value);
    if (key === 'mat') setMatFilter(value);
    if (key === 'color') setColorFilter(value);
    if (key === 'moq') setMoqFilter(value);
    if (key === 'lead') setLeadFilter(value);
    if (key === 'badge') setBadgeFilter(value);
    if (key === 'sort') setSortFilter(value);

    const basePath = getCategorySeoPath(activeCategory, categories);
    const query = params.toString();
    router.push(query ? `${basePath}?${query}` : basePath, { scroll: false });
  };

  const handleClearAllFilters = () => {
    setTypeFilter('all');
    setSegFilter('all');
    setMatFilter('all');
    setColorFilter('all');
    setMoqFilter('all');
    setLeadFilter('all');
    setBadgeFilter('all');
    setSortFilter('default');
    setSearchQuery('');
    router.push('/collections');
  };

  const handleRemoveChip = (key: string) => {
    const params = new URLSearchParams(searchParams.toString());
    params.delete(key);
    params.delete('page');

    if (key === 'category') {
      router.push('/collections');
      return;
    }
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

    const basePath = getCategorySeoPath(activeCategory, categories);
    const query = params.toString();
    router.push(query ? `${basePath}?${query}` : basePath, { scroll: false });
  };

  const activeChips = useMemo(() => {
    const chips: Array<{ key: string; label: string; value: string }> = [];
    if (activeCategorySlug !== 'all' && activeCategory) {
      chips.push({ key: 'category', label: 'Category', value: activeCategory.name });
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
  }, [activeCategorySlug, activeCategory, typeFilter, segFilter, matFilter, colorFilter, moqFilter, leadFilter, badgeFilter, sortFilter, searchQuery]);

  // Complete multi-attribute product filtering
  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      // Category filter (match current category or any descendant category)
      if (activeCategorySlug !== 'all' && (activeCategory || taxonomyInfo.matchingTerms.length > 0 || activeCategorySlugsSet.size > 0)) {
        const prodCatSlug = (p.cat || '').toLowerCase();
        const prodCatName = (p.catName || '').toLowerCase();
        const prodType = ((p as any).type || '').toLowerCase();
        const prodName = (p.name || '').toLowerCase();

        // 1. Gather all assigned category slugs & names
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

        // 2. Direct match against active category and its descendants
        const isDirectMatch =
          prodSlugs.some((s) => activeCategorySlugsSet.has(s)) ||
          prodCatNames.some((n) => activeCategorySlugsSet.has(n)) ||
          (activeCategory && (
            prodSlugs.includes(activeCategory.slug.toLowerCase()) ||
            (activeCategory.wpId && prodSlugs.includes(String(activeCategory.wpId))) ||
            prodCatNames.includes(activeCategory.name.toLowerCase())
          ));

        // 3. Taxonomy match against all matching terms
        const isTaxonomyMatch = taxonomyInfo.matchingTerms.some((term) => {
          const t = term.toLowerCase();
          return (
            prodSlugs.some((s) => s === t || s.includes(t)) ||
            prodCatNames.some((n) => n === t || n.includes(t)) ||
            prodType === t ||
            prodType.includes(t) ||
            (taxonomyInfo.level === 3 && prodName.includes(t))
          );
        });

        if (!isDirectMatch && !isTaxonomyMatch) return false;
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

      // 2. Space / Segment (checks segment, segment2, pa_segment, attributes)
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

      // 3. Material & Craft (checks material, material2, pa_material, attributes, specs)
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

      // 4. Color & Finish (checks color, availableColors, pa_color, variations)
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

      // 5. Minimum Order Quantity (MOQ)
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
  }, [products, activeCategorySlug, activeCategory, activeCategorySlugsSet, taxonomyInfo, typeFilter, segFilter, matFilter, colorFilter, moqFilter, leadFilter, badgeFilter, searchQuery]);

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

    const basePath = getCategorySeoPath(activeCategory, categories);
    const query = params.toString();
    router.push(query ? `${basePath}?${query}` : basePath, { scroll: false });

    if (gridRef.current) {
      gridRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  const toggleExpandCat = (slug: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setExpandedCats((prev) => ({ ...prev, [slug]: !prev[slug] }));
  };

  const crumbs = useMemo(() => {
    if (taxonomyInfo && taxonomyInfo.breadcrumbs && taxonomyInfo.breadcrumbs.length > 1) {
      return taxonomyInfo.breadcrumbs;
    }
    const legacy = getCategoryBreadcrumbs(activeCategory, categories);
    return [{ name: 'Home', url: '/' }, ...legacy];
  }, [taxonomyInfo, activeCategory, categories]);

  // Organize categories into 4-level tree for sidebar
  const categoryTree = useMemo(() => {
    const itemMap = new Map<number, WpCategoryItem & { childrenNode: WpCategoryItem[] }>();
    const roots: (WpCategoryItem & { childrenNode: WpCategoryItem[] })[] = [];

    categories.forEach((cat) => {
      if (cat.wpId) {
        itemMap.set(cat.wpId, { ...cat, childrenNode: [] });
      }
    });

    itemMap.forEach((item) => {
      if (item.parent && itemMap.has(item.parent)) {
        itemMap.get(item.parent)!.childrenNode.push(item);
      } else {
        roots.push(item);
      }
    });

    return roots;
  }, [categories]);

  // Recursive Category Sidebar Item Component
  const RenderCategoryNode = ({ item, depth = 0 }: { item: WpCategoryItem & { childrenNode?: WpCategoryItem[] }; depth?: number }) => {
    const isSelected = activeCategorySlug.toLowerCase() === item.slug.toLowerCase();
    const hasChildren = item.childrenNode && item.childrenNode.length > 0;
    const isExpanded = !!expandedCats[item.slug];
    const seoUrl = getCategorySeoPath(item, categories);

    return (
      <div key={item.id || item.slug} style={{ marginBottom: 2 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Link
            href={seoUrl}
            className={`fopt ${isSelected ? 'on' : ''}`}
            style={{
              flex: 1,
              fontWeight: depth === 0 ? 600 : depth === 1 ? 500 : 400,
              paddingLeft: depth > 0 ? depth * 12 : 0,
              fontSize: depth === 0 ? 14 : 13,
            }}
          >
            {item.name} {item.count ? `(${item.count})` : ''}
          </Link>
          {hasChildren && (
            <button
              onClick={(e) => toggleExpandCat(item.slug, e)}
              style={{
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                padding: '4px 8px',
                fontSize: 12,
                color: 'var(--ink-2)',
              }}
              aria-label="Toggle subcategories"
            >
              {isExpanded ? '−' : '+'}
            </button>
          )}
        </div>

        {hasChildren && isExpanded && (
          <div style={{ marginLeft: depth > 0 ? 8 : 4, borderLeft: '1px solid var(--border-color, #E2DDD5)', paddingLeft: 6 }}>
            {item.childrenNode!.map((child) => (
              <RenderCategoryNode key={child.id || child.slug} item={child as any} depth={depth + 1} />
            ))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="wrap" style={{ paddingBottom: 80 }}>
      {/* SEO BREADCRUMBS */}
      <div className="crumbs" style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap', margin: '16px 0' }}>
        {crumbs.map((crumb, idx) => (
          <React.Fragment key={`${crumb.url}-${idx}`}>
            {idx > 0 && <span>/</span>}
            {idx === crumbs.length - 1 ? (
              <span style={{ fontWeight: 600, color: 'var(--ink)' }}>{crumb.name}</span>
            ) : (
              <Link href={crumb.url}>{crumb.name}</Link>
            )}
          </React.Fragment>
        ))}
      </div>

      {/* COLLECTION HERO HEADER */}
      <div className="cat-hero" style={{ margin: '16px 0 32px' }}>
        <div>
          <h1 className="disp" style={{ fontSize: 'clamp(28px, 4vw, 42px)', margin: '0 0 8px', textTransform: 'capitalize' }}>
            {activeCategoryName ? activeCategoryName : 'All Collections & Architectural Designs'}
          </h1>
          <p style={{ maxWidth: 720, color: 'var(--ink-2)', lineHeight: 1.6 }}>
            {activeCategory?.description ||
              (activeCategoryName
                ? `Explore handcrafted contract-grade ${activeCategoryName.toLowerCase()} engineered for luxury hospitality, commercial fit-outs, and bespoke architectural projects.`
                : 'Explore handcrafted bespoke furniture, lighting, rugs, and decor elements engineered for luxury hospitality, commercial fit-outs, and high-end residential projects.')}
          </p>
        </div>
        <span
          className="pill-note"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 6,
            fontSize: 13,
            background: 'var(--surface-2)',
            padding: '8px 16px',
            borderRadius: 'var(--r-pill)',
          }}
        >
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 15a2 2 0 01-2 2H8l-5 4V5a2 2 0 012-2h14a2 2 0 012 2z" />
          </svg>
          Direct B2B Manufacturing · Quote-First Catalog
        </span>
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
              <h4>Filter Collections</h4>
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
            {/* 1. CATEGORIES ACCORDION TREE */}
            <div className="fgroup">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                <h5>Department / Category</h5>
                {activeCategorySlug !== 'all' && (
                  <Link href="/collections" style={{ fontSize: 12, color: 'var(--brand)', textDecoration: 'underline' }}>
                    View All
                  </Link>
                )}
              </div>

              <Link
                href="/collections"
                className={`fopt ${activeCategorySlug === 'all' ? 'on' : ''}`}
                style={{ fontWeight: 600, marginBottom: 6 }}
              >
                <span>All Departments & Categories</span>
                <span className="fopt-count">({products.length})</span>
              </Link>

              {categoryTree.map((dept) => (
                <RenderCategoryNode key={dept.id || dept.slug} item={dept} depth={0} />
              ))}
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
              <label htmlFor="col-sort-select" style={{ fontSize: 13, color: 'var(--ink-2)', whiteSpace: 'nowrap' }}>Sort:</label>
              <select
                id="col-sort-select"
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
                              q: p.moq || 1,
                              image: (p as any).img || p.image || '/fallback-product.svg',
                              moq: p.moq || 1,
                              unitPrice: p.price || 0,
                              currency: p.currency || 'USD',
                              currencySymbol: p.currencySymbol || '$',
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
                      <span className="meta">{p.catName || p.type || 'FURNITURE'}</span>
                      <span className="made-to-order-tag">Made-To-Order</span>
                      <Link href={`/product/${getProductSlug(p)}`}>
                        <h4>{p.name}</h4>
                      </Link>
                      <span className="price-note">Price on request</span>
                    </div>
                  </article>
                ))}
              </div>

              {totalPages > 1 && (
                <Pagination
                  currentPage={currentPage}
                  totalPages={totalPages}
                  totalItems={filteredProducts.length}
                  itemsPerPage={ITEMS_PER_PAGE}
                  onPageChange={handlePageChange}
                />
              )}
            </>
          ) : (
            <div
              className="no-results"
              style={{
                textAlign: 'center',
                padding: '64px 28px',
                background: '#FAF8F5',
                border: '1px solid #ECE7DE',
                borderRadius: 12,
                margin: '20px 0',
              }}
            >
              <div
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 8,
                  padding: '6px 14px',
                  background: '#EBF3F8',
                  color: '#1A5276',
                  borderRadius: 20,
                  fontSize: 12,
                  fontWeight: 600,
                  letterSpacing: '0.04em',
                  textTransform: 'uppercase',
                  marginBottom: 16,
                }}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10" />
                  <line x1="12" y1="8" x2="12" y2="12" />
                  <line x1="12" y1="16" x2="12.01" y2="16" />
                </svg>
                Custom Manufacturing & Contract Prototyping
              </div>

              <h3 style={{ fontSize: 'clamp(22px, 2.8vw, 30px)', fontWeight: 500, color: '#111111', margin: '0 0 12px' }}>
                {activeCategoryName
                  ? `No Catalog Designs Currently Uploaded for ${activeCategoryName}`
                  : 'No Matching Designs Found'}
              </h3>

              <p style={{ color: '#666666', maxWidth: 640, margin: '0 auto 28px', lineHeight: 1.65, fontSize: 15 }}>
                {activeCategoryName ? (
                  <>
                    Orbit Expo Crafts manufactures custom bespoke <strong>{activeCategoryName}</strong> to your exact project CAD drawings, 3D models, and Bill of Quantities (BOQ). Contact our trade desk to request custom manufacturing and factory estimates.
                  </>
                ) : (
                  'Try resetting your category or material filters to explore our full furniture and architectural decor portfolio.'
                )}
              </p>

              <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
                {activeCategoryName && (
                  <Link href="/discuss-projects" className="btn btn-primary" style={{ padding: '12px 24px', fontSize: 13.5 }}>
                    Submit CAD / Request Custom Manufacturing →
                  </Link>
                )}
                {activeFiltersCount > 0 && (
                  <button className="btn btn-outline" onClick={handleClearAllFilters} style={{ padding: '12px 24px', fontSize: 13.5 }}>
                    Reset All Filters
                  </button>
                )}
                <Link href="/collections" className="btn btn-soft" style={{ padding: '12px 24px', fontSize: 13.5 }}>
                  Explore All Collections
                </Link>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
