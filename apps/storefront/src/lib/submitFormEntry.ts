/**
 * Universal Resilient Form Submission Client Helper
 * Ensures all form submissions (checkout, contact, discuss-projects, interior-designers, sample/cad)
 * reach the WordPress backend under all network and hosting environments.
 */

export interface FormSubmissionPayload {
  form_type: string;
  reference_id?: string;
  full_name: string;
  email: string;
  phone?: string;
  company?: string;
  tax_id?: string;
  project_type?: string;
  quantity?: string | number;
  finish_preference?: string;
  product_name?: string;
  product_sku?: string;
  product_url?: string;
  product_image?: string;
  source_page?: string;
  source_title?: string;
  user_id?: string | number;
  account_status?: string;
  shipping_address?: any;
  booking_data?: any;
  notes?: string;
  shortlist_items?: any;
  create_account?: boolean;
  password?: string;
  [key: string]: any;
}

export interface FormSubmissionResult {
  success: boolean;
  referenceId?: string;
  entryId?: number;
  message?: string;
  error?: string;
}

const DIRECT_WP_ORIGIN =
  process.env.NEXT_PUBLIC_WORDPRESS_URL ||
  (typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1' || window.location.hostname.startsWith('192.168.'))
    ? 'http://woo-catalog-nextjs.local'
    : 'https://admin.orbitexpocrafts.com');

export async function submitFormEntry(payload: FormSubmissionPayload): Promise<FormSubmissionResult> {
  const jsonBody = JSON.stringify(payload);

  // TIER 1: Next.js API Route Proxy (/api/wp/forms/submit)
  try {
    const res = await fetch('/api/wp/forms/submit', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: jsonBody,
    });

    if (res.ok) {
      const data = await res.json().catch(() => null);
      if (data && (data.success || data.data?.entry_id || data.entry_id)) {
        return {
          success: true,
          referenceId: data.data?.reference_id || data.reference_id || payload.reference_id,
          entryId: data.data?.entry_id || data.entry_id,
          message: data.data?.message || data.message || 'Form submitted successfully',
        };
      }
    }
  } catch (proxyErr) {
    console.warn('Next.js form proxy failed, trying direct WordPress fallback:', proxyErr);
  }

  // TIER 2: Direct browser call to WordPress (Rest Route Query Param)
  const cleanWp = DIRECT_WP_ORIGIN.replace(/\/$/, '');
  try {
    const directRes = await fetch(`${cleanWp}/index.php?rest_route=/hcc/v1/forms/submit`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: jsonBody,
    });

    if (directRes.ok) {
      const data = await directRes.json().catch(() => null);
      if (data && (data.success || data.data?.entry_id || data.entry_id)) {
        return {
          success: true,
          referenceId: data.data?.reference_id || data.reference_id || payload.reference_id,
          entryId: data.data?.entry_id || data.entry_id,
          message: data.data?.message || data.message || 'Form submitted successfully',
        };
      }
    }
  } catch (directErr) {
    console.warn('Direct index.php rest_route failed, trying wp-json fallback:', directErr);
  }

  // TIER 3: Direct browser call to WordPress (Pretty Permalinks)
  try {
    const wpJsonRes = await fetch(`${cleanWp}/wp-json/hcc/v1/forms/submit`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: jsonBody,
    });

    if (wpJsonRes.ok) {
      const data = await wpJsonRes.json().catch(() => null);
      if (data && (data.success || data.data?.entry_id || data.entry_id)) {
        return {
          success: true,
          referenceId: data.data?.reference_id || data.reference_id || payload.reference_id,
          entryId: data.data?.entry_id || data.entry_id,
          message: data.data?.message || data.message || 'Form submitted successfully',
        };
      }
    }
  } catch (wpJsonErr) {
    console.error('All form submission endpoints failed:', wpJsonErr);
  }

  return {
    success: false,
    error: 'Could not connect to submission server.',
    referenceId: payload.reference_id,
  };
}
