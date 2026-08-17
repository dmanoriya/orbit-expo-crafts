# High-Level System Architecture

```text
                        CUSTOMER / BROWSER
                                 |
                                 v
                       NEXT.JS 15 STOREFRONT
                      (App Router / React 19)
                                 |
                                 v
                        COMMERCE TS SDK
                     (@company/commerce-sdk)
                                 |
               +-----------------+-----------------+
               |                                   |
               v                                   v
       GraphQL Adapter                       REST Adapter
               |                                   |
               +-----------------+-----------------+
                                 |
                                 v
              HEADLESS COMMERCE CORE (WP PLUGIN)
                        /wp-json/hcc/v1/
                                 |
             +-------------------+-------------------+
             |                                       |
             v                                       v
       WORDPRESS CORE                           WOOCOMMERCE
             |                                       |
       Rank Math / Yoast                       Cart / Checkout / Payments
```

## Security Design
- **No Consumer Key Leakage**: Frontends never expose WooCommerce REST API consumer keys or secrets.
- **HTTP-Only Cookies / Sessions**: Customer auth uses secure HTTP-only cookies and session tokens.
- **Rate Limiting & Sanitization**: Strict rate limiting (120 requests/min/IP) and input sanitization across all REST/GraphQL endpoints.

## Caching Strategy
- **Read Heavy Data**: Products, Categories, Attributes, CMS Pages, and SEO metadata are aggressively cached via WordPress Object Cache / Redis and Next.js ISR.
- **Dynamic Operations**: Cart operations, Checkout, Customer Auth, Orders, and Payments remain dynamic.
- **Invalidation**: `woocommerce_update_product`, `woocommerce_product_set_stock`, and term edit hooks trigger automatic Next.js revalidation webhooks.
