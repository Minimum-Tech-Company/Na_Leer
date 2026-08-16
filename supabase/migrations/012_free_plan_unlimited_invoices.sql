-- Update Free plan to unlimited invoices
update public.plans
set max_invoices = -1
where id = 'free';
