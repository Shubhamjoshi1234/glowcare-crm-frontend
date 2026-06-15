export type Channel = "whatsapp" | "sms" | "email" | "rcs";
export type CampaignStatus =
  | "draft"
  | "sending"
  | "sent"
  | "partially_failed"
  | "completed"
  | "failed";

export interface Customer {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  city: string | null;
  age?: number | null;
  gender?: string | null;
  preferredChannel: Channel;
  totalSpend: number;
  orderCount: number;
  lastOrderDate: string | null;
  lastPurchaseCategory: string | null;
  categoriesPurchased?: string[];
  createdAt?: string;
}

export interface Order {
  id: string;
  productName: string;
  category: string;
  amount: number;
  orderDate: string;
  customer: { id: string; name: string; city: string | null };
}

export interface SegmentRules {
  city?: string;
  preferred_channel?: Channel;
  min_total_spend?: number;
  max_total_spend?: number;
  inactive_days?: number;
  active_within_days?: number;
  category_purchased?: string;
  min_order_count?: number;
  max_order_count?: number;
}

export interface Segment {
  id: string;
  name: string;
  description: string | null;
  rulesJson: SegmentRules;
  matchedCount: number;
  createdAt: string;
}

export interface CampaignStats {
  audienceSize: number;
  communicationsCreated: number;
  queued: number;
  sent: number;
  delivered: number;
  failed: number;
  opened: number;
  read: number;
  clicked: number;
  converted: number;
  deliveryRate: number;
  readRate: number;
  clickRate: number;
  conversionRate: number;
}

export interface Campaign {
  id: string;
  name: string;
  channel: Channel;
  campaignGoal: string | null;
  messageTemplate: string;
  status: CampaignStatus;
  createdAt: string;
  sentAt: string | null;
  segment: { id?: string; name: string };
  stats: CampaignStats;
}

export interface Communication {
  id: string;
  personalizedMessage: string;
  personalizationSource: "openai" | "fallback" | "template";
  personalizationReason: string | null;
  currentStatus: string;
  providerMessageId: string | null;
  failureReason: string | null;
  createdAt: string;
  updatedAt: string;
  sentAt: string | null;
  deliveredAt: string | null;
  failedAt: string | null;
  openedAt: string | null;
  readAt: string | null;
  clickedAt: string | null;
  convertedAt: string | null;
  customer: {
    id: string;
    name: string;
    city: string | null;
    email: string | null;
    phone: string | null;
    preferredChannel: Channel;
  };
}

export interface ReceiptEvent {
  id: string;
  eventId: string;
  communicationId: string | null;
  status: string;
  processed: boolean;
  processingNote: string | null;
  receivedAt: string;
}

export interface CampaignOpportunity {
  id: string;
  headline: string;
  incentiveLabel: string;
  offer: string;
  rationale: string;
  periodDays: number;
  anchor: {
    productName: string;
    category: string;
    orders: number;
    previousOrders: number;
    trendPercent: number | null;
  };
  featuredProducts: Array<{
    productName: string;
    category: string;
    orders: number;
    previousOrders: number;
    trendPercent: number | null;
  }>;
  potentialAudience: number;
  suggestedAudience: {
    name: string;
    description: string;
    rules: SegmentRules;
    estimatedSize: number;
  };
  campaignName: string;
  campaignGoal: string;
  messageTemplate: string;
}

export interface CatalogProductPerformance {
  rank: number;
  productName: string;
  category: string;
  orders: number;
  previousOrders: number;
  revenue: number;
  trendPercent: number | null;
  status: "strong" | "middle" | "focus";
}

export interface CampaignOpportunityResponse {
  generatedAt: string;
  periodDays: number;
  provider: "openai" | "fallback";
  productPerformance: CatalogProductPerformance[];
  focusProducts: CatalogProductPerformance[];
  opportunities: CampaignOpportunity[];
  limitations: string[];
}

export interface AudienceBehaviorMetric {
  id:
    | "high_value"
    | "active_high_value"
    | "at_risk_high_value"
    | "repeat"
    | "one_time"
    | "slipping"
    | "inactive";
  label: string;
  description: string;
  count: number;
  sharePercent: number;
  totalLifetimeValue: number;
  averageSpend: number;
}

export interface AudienceSuggestion {
  id: string;
  title: string;
  rationale: string;
  recommendedName: string;
  description: string;
  rules: SegmentRules;
  matchedCount: number;
  shareOfAudience: number;
  averageSpend: number;
  averageOrderCount: number;
  averageDaysSinceOrder: number | null;
  totalLifetimeValue: number;
  currentPeriodRevenue: number;
  previousPeriodRevenue: number;
  revenueChangePercent: number | null;
  highlights: string[];
}

export interface AudienceInsightResponse {
  generatedAt: string;
  periodDays: number;
  provider: "openai" | "fallback";
  overview: {
    totalShoppers: number;
    activeShoppers: number;
    inactiveShoppers: number;
    activePercent: number;
    inactivePercent: number;
    currentOrders: number;
    previousOrders: number;
    orderTrendPercent: number | null;
    currentRevenue: number;
    previousRevenue: number;
    revenueTrendPercent: number | null;
  };
  economics: {
    averageOrderValue: number;
    revenuePerActiveShopper: number;
    averageLifetimeValue: number;
    repeatBuyerRate: number;
    oneTimeBuyerRate: number;
    top20RevenueShare: number;
    highValueThreshold: number;
    valueAtRisk: number;
  };
  behaviorMetrics: AudienceBehaviorMetric[];
  costAvailability: {
    customerAcquisitionCost: false;
    productCost: false;
    grossMargin: false;
    campaignCost: false;
    messageCost: false;
    note: string;
  };
  suggestions: AudienceSuggestion[];
  limitations: string[];
}
