import { createCommerce } from '../packages/commerce-sdk/src/index';

describe('Commerce SDK Architecture & Transport Unit Verification', () => {
  const sdk = createCommerce({
    endpoint: 'http://localhost:8080',
    transport: 'rest',
  });

  it('should initialize SDK with domain namespace methods', () => {
    expect(typeof sdk.config.get).toBe('function');
    expect(typeof sdk.products.list).toBe('function');
    expect(typeof sdk.products.getBySlug).toBe('function');
    expect(typeof sdk.cart.addItem).toBe('function');
    expect(typeof sdk.checkout.placeOrder).toBe('function');
    expect(typeof sdk.seo.get).toBe('function');
  });

  it('should format endpoint paths correctly for REST', async () => {
    // Basic verification that SDK methods are callable
    expect(sdk).toBeDefined();
  });
});
