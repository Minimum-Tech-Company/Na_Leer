-- Add payment_method column to invoices table
ALTER TABLE public.invoices ADD COLUMN IF NOT EXISTS payment_method text;

COMMENT ON COLUMN public.invoices.payment_method IS 'Payment method used by the client (wave, orange_money, free_money, visa, mastercard, etc.)';
