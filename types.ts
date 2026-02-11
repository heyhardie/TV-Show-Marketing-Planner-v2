export type ModelType = 'fast' | 'pro' | 'thinking';
export type InputMode = 'existing' | 'concept';
export type MediaType = 'tv' | 'movie';

export interface ChatMessage {
  role: 'user' | 'model';
  text: string;
}

export interface MarketingReport {
  mediaType?: MediaType; // Optional for backward compatibility with old history
  showInfo: {
    title: string;
    summary: string;
    genre: string;
    stars: string[];
  };
  audienceProfile: {
    ageRange: string;
    locations: string[];
    averageIncome: string;
    interests: string[];
  };
  competitorAnalysis: Array<{
    title: string;
    success: string;
    reason: string;
  }>;
  marketingPlan: {
    adPlacements: string;
    socialStrategy: string;
    adBuyImplementation: string;
    crossPromotionShows: string[];
    budgetBreakdown: Array<{
      category: string;
      percentage: number;
      tactics: string;
    }>;
    marketingEvents: Array<{
      title: string;
      description: string;
      category: string;
    }>;
  };
  keyArtConcepts: Array<{
    title: string;
    description: string;
    prompt: string;
    imageUrl?: string;
  }>;
  groundingUrls?: string[];
  timestamp?: number;
  modelUsed?: ModelType;
}

export interface HistoryItem extends MarketingReport {
  id: string;
}

declare global {
  interface Window {
    html2pdf: () => {
      from: (element: HTMLElement) => {
        save: () => void;
      };
    };
  }
}