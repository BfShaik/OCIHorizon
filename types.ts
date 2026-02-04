export interface OCIConsumptionRow {
  sku: string;
  productName: string;
  usageAmount: number;
  unit: string;
  cost: number;
  region?: string;
  shape?: string;
}

export interface ReleaseNote {
  id: string;
  title: string;
  date: string;
  content: string;
  service: string;
  url: string;
  isRelevant?: boolean;
  matchScore?: number;
  summary?: string;
}

export interface StrategicInsight {
  type: 'optimization' | 'security' | 'architecture' | 'cost' | 'growth';
  title: string;
  description: string;
  impact: 'high' | 'medium' | 'low';
  actionLabel: string;
  savings?: string;
  cveId?: string;
}

export type AnalysisStep = 'idle' | 'parsing' | 'searching' | 'mapping' | 'insights' | 'complete';

export interface EmailSchedule {
  frequency: 'daily' | 'weekly' | 'monthly';
  dayOfWeek: number; // 0-6
  recipientEmail: string;
  enabled: boolean;
  lastSent?: string;
}

export interface AppState {
  consumptionData: OCIConsumptionRow[];
  releaseNotes: ReleaseNote[];
  insights: StrategicInsight[];
  isLoading: boolean;
  error: string | null;
  schedule: EmailSchedule;
  analysisStep: AnalysisStep;
}