export interface CinetPayConfig {
  apikey: string
  site_id: string
  transaction_id: string
  amount: number
  currency: string
  description: string
  customer_name: string
  customer_email: string
  customer_phone_number?: string
  notify_url: string
  return_url: string
  cancel_url: string
  metadata?: string
}

export interface CinetPayPaymentResponse {
  code: number
  message: string
  data: {
    payment_url: string
    payment_token: string
    transaction_id: string
  }
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
  cinetpay_payment_id: string | null
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
  cinetpay_transaction_id: string | null
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
  cinetpay_transaction_id: string | null
  created_at: string
  updated_at: string
  plan?: Plan
}
