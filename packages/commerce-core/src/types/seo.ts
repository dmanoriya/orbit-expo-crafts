export interface SEOData {
  provider: 'rankmath' | 'yoast' | 'native';
  title: string;
  description: string;
  canonical: string;
  robots: string;
  openGraph: {
    title: string;
    description: string;
    image: string;
  };
}
