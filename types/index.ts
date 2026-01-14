export interface Message {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: Date;
}

export interface ResearchSession {
  id: string;
  userId: string;
  industry: string;
  niche?: string;
  uvz?: UVZ;
  conversation: Message[];
  status: 'in_progress' | 'completed';
  createdAt: Date;
  updatedAt: Date;
}

export interface UVZ {
  description: string;
  problem_statement: string;
  target_customer: string;
  current_solutions: string;
  unique_angle: string;
  opportunity_score: number;
  problem_score?: number;
  feasibility_score?: number;
  total_score?: number;
  scores_explanation?: {
    opportunity?: string;
    problem?: string;
    feasibility?: string;
  };
  validation: {
    demand_level: 'High' | 'Medium' | 'Low';
    market_signals: string[];
    recommendation: 'Go' | 'No-Go' | 'Test';
  };
}

export interface Niche {
  name: string;
  market_size: string;
  growth_rate: string;
  target_audience: string;
  differentiation: string;
  monetization: string[];
}
