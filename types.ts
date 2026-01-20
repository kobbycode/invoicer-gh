
export enum InvoiceStatus {
  PAID = 'Paid',
  PENDING = 'Pending',
  OVERDUE = 'Overdue',
  DRAFT = 'Draft',
  SENT = 'Sent'
}

export interface LineItem {
  id: string;
  description: string;
  quantity: number;
  price: number;
}

export interface Client {
  id: string;
  name: string;
  email: string;
  momoNumber: string;
  momoNetwork: 'MTN' | 'Telecel' | 'AT';
  invoicesCount: number;
  status: 'Active' | 'Pending';
  location?: string;
  createdAt?: number;
  updatedAt?: number;
}

export interface Invoice {
  id: string;
  invoiceNumber: string;
  client: Client; // Or just clientId and snapshotted client name
  date: string;
  dueDate: string;
  items: LineItem[];
  status: InvoiceStatus;
  currency: string;
  vatEnabled: boolean;
  leviesEnabled: boolean;
  covidLevyEnabled: boolean;
  total: number;
  businessInfo?: BusinessProfile;
  termsEnabled?: boolean;
  termsText?: string;
  termsMomoNumber?: string;
  termsMomoNetwork?: string;
  termsAccountName?: string;
  createdAt?: number;
  updatedAt?: number;
}

export interface BusinessProfile {
  name: string;
  email: string;
  address: string;
  logoUrl?: string;
  momoNumber?: string;
  momoNetwork?: string;
  tin: string;
}

export interface Preferences {
  defaultCurrency: string;
  defaultTaxRate: number;
  invoicePrefix: string;
  autoSave: boolean;
}

export interface UserProfile extends BusinessProfile {
  uid: string;
  createdAt: number;
  updatedAt: number;
  preferences?: Preferences;
}
