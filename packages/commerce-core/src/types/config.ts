export type StoreMode = 'FULL_STORE' | 'CATALOG' | 'HEADLESS_STORE' | 'HEADLESS_CATALOG';

export interface StoreConfig {
  name: string;
  description: string;
  storeMode: StoreMode;
  purchasingEnabled: boolean;
  isHeadless: boolean;
  currency: string;
  currencySymbol: string;
  version: string;
}

export interface SDKConfig {
  endpoint: string;
  transport?: 'rest' | 'graphql';
  revalidateSecret?: string;
}
