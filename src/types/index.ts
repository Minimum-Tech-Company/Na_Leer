export interface DexchangeCheckoutConfig {
  reference: string
  item_name: string
  amount: number
  currency: string
  success_url: string
  failure_url: string
  webhook_url: string
  metadata?: Record<string, any>
}

export interface DexchangeCheckoutResponse {
  id: string
  reference: string
  payment_url?: string
  status: string
}

export interface InvoiceItem {
  id?: string
  description: string
  quantity: number
  unit_price: number
  amount: number
}

export interface Invoice {
  id: string
  user_id: string
  client_id: string
  invoice_number: string
  status: 'draft' | 'sent' | 'paid' | 'overdue' | 'cancelled'
  issue_date: string
  due_date: string
  subtotal: number
  tax_rate: number
  tax_amount: number
  total: number
  notes: string | null
  currency: string
  dexchange_payment_id: string | null
  paid_at: string | null
  created_at: string
  updated_at: string
  client?: Client
  items?: InvoiceItem[]
}

export interface Client {
  id: string
  user_id: string
  name: string
  email: string | null
  phone: string | null
  address: string | null
  city: string | null
  country: string | null
  tax_id: string | null
  created_at: string
  updated_at: string
}

export interface Profile {
  id: string
  email: string
  full_name: string
  company_name: string | null
  company_address: string | null
  company_phone: string | null
  company_email: string | null
  tax_id: string | null
  rccm: string | null
  forme_juridique: string | null
  ville: string | null
  pays: string | null
  logo_url: string | null
  currency: string
  created_at: string
  updated_at: string
}

export interface Payment {
  id: string
  invoice_id: string
  user_id: string
  amount: number
  currency: string
  method: string
  status: 'pending' | 'completed' | 'failed' | 'refunded'
  dexchange_transaction_id: string | null
  metadata: Record<string, any> | null
  created_at: string
}

export interface DashboardStats {
  totalRevenue: number
  totalInvoices: number
  paidInvoices: number
  pendingInvoices: number
  overdueInvoices: number
  recentPayments: Payment[]
}

export interface Plan {
  id: string
  name: string
  price_xof: number
  max_invoices: number
  max_clients: number
  has_online_payments: boolean
  has_auto_reminders: boolean
  has_multi_users: boolean
  has_api_access: boolean
}

export interface Subscription {
  id: string
  user_id: string
  plan_id: string
  status: 'active' | 'cancelled' | 'expired' | 'pending'
  started_at: string
  expires_at: string | null
  dexchange_transaction_id: string | null
  created_at: string
  updated_at: string
  plan?: Plan
}

export interface TeamMember {
  id: string
  owner_id: string
  user_id: string
  role: 'admin' | 'member'
  created_at: string
  updated_at: string
  user?: Profile
}

export interface Invitation {
  id: string
  owner_id: string
  email: string
  role: 'admin' | 'member'
  token: string
  status: 'pending' | 'accepted' | 'expired'
  expires_at: string
  created_at: string
}

export interface ApiKey {
  id: string
  user_id: string
  name: string
  key_prefix: string
  key_hash: string
  last_used_at: string | null
  expires_at: string | null
  is_active: boolean
  created_at: string
}

export interface InvoiceTemplate {
  id: string
  user_id: string
  name: string
  primary_color: string
  accent_color: string
  show_logo: boolean
  show_tax_id: boolean
  show_rccm: boolean
  footer_text: string
  is_default: boolean
  created_at: string
  updated_at: string
}

export interface SupportTicket {
  id: string
  user_id: string
  subject: string
  message: string
  status: 'open' | 'in_progress' | 'resolved' | 'closed'
  priority: 'low' | 'normal' | 'high' | 'urgent'
  is_business: boolean
  created_at: string
  updated_at: string
}
