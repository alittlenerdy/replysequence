export interface PaymentMethod {
  brand: string;
  last4: string;
  expMonth: number;
  expYear: number;
}

export interface Subscription {
  id: string;
  status: string;
  currentPeriodEnd: string;
  cancelAtPeriodEnd: boolean;
  trialEnd: string | null;
  billingInterval: 'month' | 'year';
  plan: {
    amount: number;
    interval: string;
    productName: string;
  };
}

export interface Invoice {
  id: string;
  date: string;
  amount: number;
  status: string;
  invoiceUrl: string | null;
  pdfUrl: string | null;
  periodStart: string | null;
  periodEnd: string | null;
  planName: string | null;
}

export interface BillingAddress {
  line1: string | null;
  line2: string | null;
  city: string | null;
  state: string | null;
  postalCode: string | null;
  country: string | null;
}

export interface BillingDetails {
  name: string | null;
  email: string | null;
  address: BillingAddress | null;
}

export interface UsageData {
  draftsUsed: number;
  draftsLimit: number;
  draftsRemaining: number;
}

export type SubscriptionTierType = 'free' | 'pro' | 'team';

export interface BillingData {
  subscription: Subscription | null;
  paymentMethod: PaymentMethod | null;
  billingDetails: BillingDetails | null;
  invoices: Invoice[];
  tier: SubscriptionTierType;
  usage: UsageData;
}
