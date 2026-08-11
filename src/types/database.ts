export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
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
        Insert: {
          id: string
          email: string
          full_name: string
          company_name?: string | null
          company_address?: string | null
          company_phone?: string | null
          company_email?: string | null
          tax_id?: string | null
          logo_url?: string | null
          currency?: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          email?: string
          full_name?: string
          company_name?: string | null
          company_address?: string | null
          company_phone?: string | null
          company_email?: string | null
          tax_id?: string | null
          logo_url?: string | null
          currency?: string
          created_at?: string
          updated_at?: string
        }
      }
      clients: {
        Row: {
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
        Insert: {
          id?: string
          user_id: string
          name: string
          email?: string | null
          phone?: string | null
          address?: string | null
          city?: string | null
          country?: string | null
          tax_id?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          name?: string
          email?: string | null
          phone?: string | null
          address?: string | null
          city?: string | null
          country?: string | null
          tax_id?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      invoices: {
        Row: {
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
        }
        Insert: {
          id?: string
          user_id: string
          client_id: string
          invoice_number: string
          status?: 'draft' | 'sent' | 'paid' | 'overdue' | 'cancelled'
          issue_date: string
          due_date: string
          subtotal: number
          tax_rate: number
          tax_amount: number
          total: number
          notes?: string | null
          currency?: string
          cinetpay_payment_id?: string | null
          paid_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          client_id?: string
          invoice_number?: string
          status?: 'draft' | 'sent' | 'paid' | 'overdue' | 'cancelled'
          issue_date?: string
          due_date?: string
          subtotal?: number
          tax_rate?: number
          tax_amount?: number
          total?: number
          notes?: string | null
          currency?: string
          cinetpay_payment_id?: string | null
          paid_at?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      invoice_items: {
        Row: {
          id: string
          invoice_id: string
          description: string
          quantity: number
          unit_price: number
          amount: number
          created_at: string
        }
        Insert: {
          id?: string
          invoice_id: string
          description: string
          quantity: number
          unit_price: number
          amount: number
          created_at?: string
        }
        Update: {
          id?: string
          invoice_id?: string
          description?: string
          quantity?: number
          unit_price?: number
          amount?: number
          created_at?: string
        }
      }
      payments: {
        Row: {
          id: string
          invoice_id: string
          user_id: string
          amount: number
          currency: string
          method: string
          status: 'pending' | 'completed' | 'failed' | 'refunded'
          cinetpay_transaction_id: string | null
          metadata: Json | null
          created_at: string
        }
        Insert: {
          id?: string
          invoice_id: string
          user_id: string
          amount: number
          currency: string
          method: string
          status?: 'pending' | 'completed' | 'failed' | 'refunded'
          cinetpay_transaction_id?: string | null
          metadata?: Json | null
          created_at?: string
        }
        Update: {
          id?: string
          invoice_id?: string
          user_id?: string
          amount?: number
          currency?: string
          method?: string
          status?: 'pending' | 'completed' | 'failed' | 'refunded'
          cinetpay_transaction_id?: string | null
          metadata?: Json | null
          created_at?: string
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      invoice_status: 'draft' | 'sent' | 'paid' | 'overdue' | 'cancelled'
      payment_status: 'pending' | 'completed' | 'failed' | 'refunded'
    }
  }
}
