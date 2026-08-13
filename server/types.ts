export interface DataRecord {
  [key: string]: any;
}

export interface ColumnProfile {
  name: string;
  type: 'number' | 'string' | 'datetime' | 'boolean';
  semanticRole: 'datetime' | 'pickup_location' | 'dropoff_location' | 'fare' | 'distance' | 'passenger_count' | 'payment_type' | 'id' | 'other';
  nullCount: number;
  nullPercentage: number;
  uniqueCount: number;
  sampleValues: any[];
  min?: number | string;
  max?: number | string;
  mean?: number;
  median?: number;
  stdDev?: number;
}

export interface DatasetMetadata {
  id: string;
  name: string;
  isDemo: boolean;
  rowCount: number;
  columnCount: number;
  fileSizeBytes: number;
  uploadTimestamp: string;
  qualityScore: number;
  columns: ColumnProfile[];
  schemaMapping: Record<string, string>;
}

export interface QualityCheckResult {
  category: string;
  check: string;
  status: 'passed' | 'warning' | 'failed';
  scoreImpact: number;
  details: string;
  affectedCount: number;
}

export interface DataQualityReport {
  score: number;
  status: 'Excellent' | 'Good' | 'Fair' | 'Poor';
  checks: QualityCheckResult[];
  summary: string;
  recommendations: string[];
}

export interface AnomalyItem {
  id: string;
  type: 'Demand Spike' | 'Surge Outlier' | 'Unusual Distance' | 'Fare Anomaly' | 'Unusual Hour';
  severity: 'High' | 'Medium' | 'Low';
  description: string;
  value: string;
  expectedRange: string;
  recordIndex?: number;
}

export interface InsightItem {
  id: string;
  category: 'Demand Trend' | 'Location Pattern' | 'Pricing & Fare' | 'Quality Issue' | 'Peak Hour';
  title: string;
  summary: string;
  detail: string;
  metric?: string;
  change?: string;
  impact: 'High' | 'Medium' | 'Low';
  visualizationType?: 'line' | 'bar' | 'pie' | 'scatter';
  chartData?: any[];
}

export interface RagDocument {
  id: string;
  filename: string;
  title: string;
  chunkCount: number;
  uploadedAt: string;
  fileSize: number;
  type: 'data_dictionary' | 'business_rules' | 'dataset_doc' | 'general';
}

export interface RagChunk {
  id: string;
  documentId: string;
  documentName: string;
  page?: number;
  section?: string;
  content: string;
}

export interface SearchCitation {
  documentName: string;
  section?: string;
  snippet: string;
  relevanceScore: number;
}

export interface ChatMessage {
  id: string;
  sender: 'user' | 'assistant';
  text: string;
  timestamp: string;
  toolSteps?: {
    step: string;
    description: string;
    status: 'pending' | 'running' | 'completed' | 'failed';
  }[];
  intentType?: 'KNOWLEDGE' | 'ANALYTICS' | 'SQL' | 'VISUALIZATION' | 'STATISTICS' | 'INSIGHTS' | 'COMPLEX';
  metrics?: Record<string, any>;
  chartConfig?: {
    title: string;
    type: 'line' | 'bar' | 'area' | 'pie' | 'scatter';
    data: any[];
    xAxisKey: string;
    yAxisKey: string;
    seriesKeys?: string[];
  };
  sqlQuery?: string;
  sqlResult?: any[];
  citations?: SearchCitation[];
  methodology?: string;
}

export interface ReportContent {
  title: string;
  generatedAt: string;
  datasetName: string;
  executiveSummary: string;
  kpis: { label: string; value: string; detail: string }[];
  keyFindings: { title: string; description: string }[];
  qualityOverview: string;
  methodology: string;
  recommendations: string[];
}
