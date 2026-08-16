-- Fix Free plan: 5 invoices/month, 5 clients for life
update public.plans
set max_invoices = 5, max_clients = 5
where id = 'free';
