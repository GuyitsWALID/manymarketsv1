// Marketplace Integration APIs for Gumroad and Payhip

export type MarketplacePlatform = 'manymarkets' | 'gumroad';

export interface PlatformConnection {
  platform: MarketplacePlatform;
  connected: boolean;
  accessToken?: string;
  accountId?: string;
  accountEmail?: string;
  connectedAt?: string;
}

export interface ProductLaunchData {
  name: string;
  description: string;
  price: number;
  currency?: string;
  coverImageUrl?: string;
  fileUrls?: string[];
  productType?: string;
  tags?: string[];
}

export interface LaunchResult {
  platform: MarketplacePlatform;
  success: boolean;
  productUrl?: string;
  productId?: string;
  error?: string;
}

// Platform configuration
export const PLATFORM_CONFIG: Record<MarketplacePlatform, {
  name: string;
  icon: string;
  color: string;
  description: string;
  oauthUrl?: string;
  fee: string;
}> = {
  manymarkets: {
    name: 'ManyMarkets',
    icon: '🏪',
    color: 'orange',
    description: 'Our native marketplace with 0% platform fees',
    fee: '0% + Stripe fees (2.9% + $0.30)',
  },
  gumroad: {
    name: 'Gumroad',
    icon: '🍬',
    color: 'pink',
    description: 'Popular platform for creators',
    oauthUrl: 'https://gumroad.com/oauth/authorize',
    fee: '10% + payment processing',
  },
};

// Gumroad API Integration
export class GumroadAPI {
  private accessToken: string;
  private baseUrl = 'https://api.gumroad.com/v2';

  constructor(accessToken: string) {
    this.accessToken = accessToken;
  }

  async getUser(): Promise<{ email: string; name: string; id: string } | null> {
    try {
      const response = await fetch(`${this.baseUrl}/user`, {
        headers: {
          Authorization: `Bearer ${this.accessToken}`,
        },
      });
      
      if (!response.ok) return null;
      
      const data = await response.json();
      return data.user;
    } catch (error) {
      console.error('Gumroad getUser error:', error);
      return null;
    }
  }

  async createProduct(product: ProductLaunchData): Promise<LaunchResult> {
    try {
      const formData = new FormData();
      formData.append('name', product.name);
      formData.append('description', product.description || '');
      formData.append('price', (product.price * 100).toString()); // Gumroad uses cents
      formData.append('currency', product.currency || 'usd');
      
      if (product.tags && product.tags.length > 0) {
        formData.append('tags', product.tags.join(','));
      }

      const response = await fetch(`${this.baseUrl}/products`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${this.accessToken}`,
        },
        body: formData,
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        return {
          platform: 'gumroad',
          success: false,
          error: data.message || 'Failed to create product on Gumroad',
        };
      }

      return {
        platform: 'gumroad',
        success: true,
        productId: data.product.id,
        productUrl: data.product.short_url,
      };
    } catch (error) {
      console.error('Gumroad createProduct error:', error);
      return {
        platform: 'gumroad',
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  async updateProduct(productId: string, updates: Partial<ProductLaunchData>): Promise<boolean> {
    try {
      const formData = new FormData();
      if (updates.name) formData.append('name', updates.name);
      if (updates.description) formData.append('description', updates.description);
      if (updates.price) formData.append('price', (updates.price * 100).toString());

      const response = await fetch(`${this.baseUrl}/products/${productId}`, {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${this.accessToken}`,
        },
        body: formData,
      });

      return response.ok;
    } catch (error) {
      console.error('Gumroad updateProduct error:', error);
      return false;
    }
  }
}



// Helper to get OAuth URL for connecting platforms
export function getOAuthUrl(platform: MarketplacePlatform, redirectUri: string, clientId: string): string | null {
  const config = PLATFORM_CONFIG[platform];
  if (!config.oauthUrl) return null;

  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    response_type: 'code',
    scope: 'edit_products view_profile',
  });

  return `${config.oauthUrl}?${params.toString()}`;
}

// Store connection in localStorage (for demo - in production use Supabase)
export function savePlatformConnection(connection: PlatformConnection): void {
  const connections = getPlatformConnections();
  const index = connections.findIndex(c => c.platform === connection.platform);
  
  if (index >= 0) {
    connections[index] = connection;
  } else {
    connections.push(connection);
  }
  
  if (typeof window !== 'undefined') {
    localStorage.setItem('marketplace_connections', JSON.stringify(connections));
  }
}

export function getPlatformConnections(): PlatformConnection[] {
  if (typeof window === 'undefined') return [];
  
  const stored = localStorage.getItem('marketplace_connections');
  if (!stored) return [];
  
  try {
    return JSON.parse(stored);
  } catch {
    return [];
  }
}

export function getPlatformConnection(platform: MarketplacePlatform): PlatformConnection | null {
  const connections = getPlatformConnections();
  return connections.find(c => c.platform === platform) || null;
}

export function disconnectPlatform(platform: MarketplacePlatform): void {
  const connections = getPlatformConnections().filter(c => c.platform !== platform);
  
  if (typeof window !== 'undefined') {
    localStorage.setItem('marketplace_connections', JSON.stringify(connections));
  }
}

// Check if platform is connected
export function isPlatformConnected(platform: MarketplacePlatform): boolean {
  if (platform === 'manymarkets') return true; // Always connected to own platform
  const connection = getPlatformConnection(platform);
  return connection?.connected ?? false;
}
