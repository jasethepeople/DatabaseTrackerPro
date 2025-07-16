import { Request, Response } from 'express';

interface APIEndpoint {
  id: string;
  name: string;
  category: string;
  description: string;
  baseUrl: string;
  requiresAuth: boolean;
  authType?: 'bearer' | 'api-key' | 'oauth' | 'basic';
  headers?: Record<string, string>;
  rateLimit?: number;
  endpoints: {
    path: string;
    method: string;
    description: string;
    params?: string[];
  }[];
}

export const externalAPIs: APIEndpoint[] = [
  // Security & Penetration Testing
  {
    id: 'metasploit',
    name: 'Metasploit Framework',
    category: 'security',
    description: 'Penetration testing and vulnerability assessment',
    baseUrl: 'https://api.metasploit.com',
    requiresAuth: true,
    authType: 'api-key',
    endpoints: [
      { path: '/modules/exploits', method: 'GET', description: 'List available exploits' },
      { path: '/sessions', method: 'GET', description: 'Active sessions' },
      { path: '/vulnerabilities/scan', method: 'POST', description: 'Run vulnerability scan' }
    ]
  },
  
  // OSINT & Intelligence
  {
    id: 'shodan',
    name: 'Shodan',
    category: 'osint',
    description: 'Search engine for Internet-connected devices',
    baseUrl: 'https://api.shodan.io',
    requiresAuth: true,
    authType: 'api-key',
    endpoints: [
      { path: '/shodan/host/search', method: 'GET', description: 'Search hosts', params: ['query'] },
      { path: '/shodan/host/{ip}', method: 'GET', description: 'Host information' },
      { path: '/dns/domain/{domain}', method: 'GET', description: 'DNS information' }
    ]
  },
  
  {
    id: 'virustotal',
    name: 'VirusTotal',
    category: 'security',
    description: 'File and URL analysis service',
    baseUrl: 'https://www.virustotal.com/vtapi/v2',
    requiresAuth: true,
    authType: 'api-key',
    endpoints: [
      { path: '/file/scan', method: 'POST', description: 'Scan file' },
      { path: '/url/scan', method: 'POST', description: 'Scan URL' },
      { path: '/file/report', method: 'GET', description: 'Get scan report' }
    ]
  },

  // AI & Machine Learning
  {
    id: 'openai',
    name: 'OpenAI API',
    category: 'ai',
    description: 'GPT models and AI services',
    baseUrl: 'https://api.openai.com/v1',
    requiresAuth: true,
    authType: 'bearer',
    endpoints: [
      { path: '/chat/completions', method: 'POST', description: 'Chat completions' },
      { path: '/images/generations', method: 'POST', description: 'Generate images' },
      { path: '/audio/transcriptions', method: 'POST', description: 'Transcribe audio' }
    ]
  },

  {
    id: 'xai',
    name: 'xAI Grok',
    category: 'ai',
    description: 'Grok AI models',
    baseUrl: 'https://api.x.ai/v1',
    requiresAuth: true,
    authType: 'bearer',
    endpoints: [
      { path: '/chat/completions', method: 'POST', description: 'Grok chat completions' },
      { path: '/models', method: 'GET', description: 'Available models' }
    ]
  },

  // Government & Public Data
  {
    id: 'weather',
    name: 'National Weather Service',
    category: 'government',
    description: 'Weather data and forecasts',
    baseUrl: 'https://api.weather.gov',
    requiresAuth: false,
    endpoints: [
      { path: '/points/{lat},{lon}', method: 'GET', description: 'Location metadata' },
      { path: '/gridpoints/{office}/{grid}/forecast', method: 'GET', description: 'Weather forecast' },
      { path: '/alerts/active', method: 'GET', description: 'Active weather alerts' }
    ]
  },

  {
    id: 'census',
    name: 'US Census Bureau',
    category: 'government',
    description: 'Population and demographic data',
    baseUrl: 'https://api.census.gov/data',
    requiresAuth: false,
    endpoints: [
      { path: '/2020/dec/pl', method: 'GET', description: 'Population data' },
      { path: '/2021/acs/acs5', method: 'GET', description: 'American Community Survey' },
      { path: '/timeseries/poverty/saipe', method: 'GET', description: 'Poverty statistics' }
    ]
  },

  // Mapping & Geolocation
  {
    id: 'googlemaps',
    name: 'Google Maps API',
    category: 'mapping',
    description: 'Maps, geocoding, and location services',
    baseUrl: 'https://maps.googleapis.com/maps/api',
    requiresAuth: true,
    authType: 'api-key',
    endpoints: [
      { path: '/geocode/json', method: 'GET', description: 'Geocoding', params: ['address'] },
      { path: '/directions/json', method: 'GET', description: 'Directions' },
      { path: '/place/nearbysearch/json', method: 'GET', description: 'Nearby places' }
    ]
  },

  {
    id: 'mapbox',
    name: 'Mapbox API',
    category: 'mapping',
    description: 'Maps, navigation, and location intelligence',
    baseUrl: 'https://api.mapbox.com',
    requiresAuth: true,
    authType: 'api-key',
    endpoints: [
      { path: '/geocoding/v5/mapbox.places/{query}.json', method: 'GET', description: 'Geocoding' },
      { path: '/directions/v5/mapbox/driving/{coordinates}', method: 'GET', description: 'Directions' },
      { path: '/isochrone/v1/mapbox/driving/{coordinates}', method: 'GET', description: 'Isochrone analysis' }
    ]
  },

  // Social Media & Communication
  {
    id: 'twitter',
    name: 'X (Twitter) API',
    category: 'social',
    description: 'Social media data and analytics',
    baseUrl: 'https://api.twitter.com/2',
    requiresAuth: true,
    authType: 'bearer',
    endpoints: [
      { path: '/tweets/search/recent', method: 'GET', description: 'Search tweets' },
      { path: '/users/by/username/{username}', method: 'GET', description: 'User information' },
      { path: '/tweets', method: 'POST', description: 'Post tweet' }
    ]
  },

  // Microsoft Services
  {
    id: 'microsoft-graph',
    name: 'Microsoft Graph',
    category: 'productivity',
    description: 'Microsoft 365 services and data',
    baseUrl: 'https://graph.microsoft.com/v1.0',
    requiresAuth: true,
    authType: 'bearer',
    endpoints: [
      { path: '/me', method: 'GET', description: 'Current user profile' },
      { path: '/me/drive/root/children', method: 'GET', description: 'OneDrive files' },
      { path: '/me/events', method: 'GET', description: 'Calendar events' }
    ]
  },

  // Financial & Economic Data
  {
    id: 'alpha-vantage',
    name: 'Alpha Vantage',
    category: 'finance',
    description: 'Real-time and historical market data',
    baseUrl: 'https://www.alphavantage.co/query',
    requiresAuth: true,
    authType: 'api-key',
    endpoints: [
      { path: '?function=TIME_SERIES_DAILY', method: 'GET', description: 'Daily stock prices' },
      { path: '?function=CURRENCY_EXCHANGE_RATE', method: 'GET', description: 'Currency exchange' },
      { path: '?function=CRYPTO_INTRADAY', method: 'GET', description: 'Cryptocurrency data' }
    ]
  },

  // Public Safety & Registry
  {
    id: 'nsopw',
    name: 'National Sex Offender Registry',
    category: 'safety',
    description: 'Public safety information',
    baseUrl: 'https://www.nsopw.gov/api',
    requiresAuth: false,
    endpoints: [
      { path: '/search', method: 'GET', description: 'Search registry', params: ['name', 'location'] }
    ]
  },

  // DMV & Vehicle Data
  {
    id: 'vehicle-api',
    name: 'Vehicle Information API',
    category: 'automotive',
    description: 'Vehicle registration and VIN lookup',
    baseUrl: 'https://vpic.nhtsa.dot.gov/api',
    requiresAuth: false,
    endpoints: [
      { path: '/vehicles/DecodeVin/{vin}', method: 'GET', description: 'Decode VIN' },
      { path: '/vehicles/GetMakesForVehicleType/car', method: 'GET', description: 'Vehicle makes' },
      { path: '/vehicles/GetModelsForMake/{make}', method: 'GET', description: 'Vehicle models' }
    ]
  },

  // Data Aggregation & Research
  {
    id: 'nexus',
    name: 'Nexus Data Platform',
    category: 'data',
    description: 'Comprehensive data aggregation and research',
    baseUrl: 'https://api.nexusdata.com/v2',
    requiresAuth: true,
    authType: 'api-key',
    endpoints: [
      { path: '/search/people', method: 'GET', description: 'People search' },
      { path: '/search/businesses', method: 'GET', description: 'Business lookup' },
      { path: '/search/addresses', method: 'GET', description: 'Address verification' }
    ]
  },

  // News & Media
  {
    id: 'newsapi',
    name: 'News API',
    category: 'media',
    description: 'Global news aggregation',
    baseUrl: 'https://newsapi.org/v2',
    requiresAuth: true,
    authType: 'api-key',
    endpoints: [
      { path: '/everything', method: 'GET', description: 'Search articles' },
      { path: '/top-headlines', method: 'GET', description: 'Top headlines' },
      { path: '/sources', method: 'GET', description: 'News sources' }
    ]
  },

  // Blockchain & Crypto
  {
    id: 'coinbase',
    name: 'Coinbase API',
    category: 'crypto',
    description: 'Cryptocurrency trading and data',
    baseUrl: 'https://api.coinbase.com/v2',
    requiresAuth: true,
    authType: 'api-key',
    endpoints: [
      { path: '/exchange-rates', method: 'GET', description: 'Exchange rates' },
      { path: '/currencies', method: 'GET', description: 'Supported currencies' },
      { path: '/prices/{currency-pair}/spot', method: 'GET', description: 'Spot price' }
    ]
  }
];

export class ExternalAPIService {
  async makeAPICall(
    apiId: string, 
    endpoint: string, 
    method: string = 'GET', 
    params?: Record<string, any>,
    apiKey?: string
  ): Promise<any> {
    const api = externalAPIs.find(a => a.id === apiId);
    if (!api) {
      throw new Error(`API ${apiId} not found`);
    }

    const url = new URL(endpoint, api.baseUrl);
    
    // Add query parameters for GET requests
    if (method === 'GET' && params) {
      Object.entries(params).forEach(([key, value]) => {
        url.searchParams.append(key, value);
      });
    }

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'User-Agent': 'LocalReplit/1.0',
      ...api.headers
    };

    // Add authentication headers
    if (api.requiresAuth && apiKey) {
      switch (api.authType) {
        case 'bearer':
          headers['Authorization'] = `Bearer ${apiKey}`;
          break;
        case 'api-key':
          headers['X-API-Key'] = apiKey;
          break;
        case 'basic':
          headers['Authorization'] = `Basic ${Buffer.from(apiKey).toString('base64')}`;
          break;
      }
    }

    const requestOptions: RequestInit = {
      method,
      headers,
      body: method !== 'GET' && params ? JSON.stringify(params) : undefined
    };

    try {
      const response = await fetch(url.toString(), requestOptions);
      
      if (!response.ok) {
        throw new Error(`API call failed: ${response.status} ${response.statusText}`);
      }

      const contentType = response.headers.get('content-type');
      if (contentType?.includes('application/json')) {
        return await response.json();
      } else {
        return await response.text();
      }
    } catch (error) {
      throw new Error(`Failed to call ${api.name}: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  getAPIsByCategory(category?: string): APIEndpoint[] {
    if (!category) return externalAPIs;
    return externalAPIs.filter(api => api.category === category);
  }

  getAPICategories(): string[] {
    return [...new Set(externalAPIs.map(api => api.category))];
  }

  searchAPIs(query: string): APIEndpoint[] {
    const lowercaseQuery = query.toLowerCase();
    return externalAPIs.filter(api => 
      api.name.toLowerCase().includes(lowercaseQuery) ||
      api.description.toLowerCase().includes(lowercaseQuery) ||
      api.category.toLowerCase().includes(lowercaseQuery)
    );
  }
}

export const externalAPIService = new ExternalAPIService();