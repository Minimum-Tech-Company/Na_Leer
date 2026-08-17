'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { generateInvoiceNumber, formatCurrency } from '@/lib/utils'
import { ArrowLeft, Plus, Trash2, Mail } from 'lucide-react'
import Link from 'next/link'
import { Client, InvoiceItem } from '@/types'
import { canCreateInvoice } from '@/lib/subscription'
import { logActivity } from '@/lib/activity'

export default function NewInvoicePage() {
  const [clients, setClients] = useState<Client[]>([])
  const [clientId, setClientId] = useState('')
  const [invoiceNumber, setInvoiceNumber] = useState('')
  const [issueDate, setIssueDate] = useState(new Date().toISOString().split('T')[0])
  const [dueDate, setDueDate] = useState('')
  const [taxRate, setTaxRate] = useState(18)
  const [notes, setNotes] = useState('')
  const [items, setItems] = useState<InvoiceItem[]>([{ description: '', quantity: 1, unit_price: 0, amount: 0 }])
  const [loading, setLoading] = useState(false)
  const [sendEmail, setSendEmail] = useState(false)
  const [planLimit, setPlanLimit] = useState<{ allowed: boolean; reason?: string; current: number; max: number } | null>(null)
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    const checkPlan = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      const limit = await canCreateInvoice(user.id)
      setPlanLimit(limit)
    }
    checkPlan()
  }, [supabase])

  useEffect(() => {
    setInvoiceNumber(generateInvoiceNumber())
    const nextMonth = new Date()
    nextMonth.setMonth(nextMonth.getMonth() + 1)
    setDueDate(nextMonth.toISOString().split('T')[0])

    const fetchClients = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      const { data } = await supabase.from('clients').select('*').eq('user_id', user.id).order('name')
      setClients(data || [])
    }
    fetchClients()
  }, [supabase])

  const updateItem = (index: number, field: keyof InvoiceItem, value: string | number) => {
    const newItems = [...items]
    newItems[index] = { ...newItems[index], [field]: value }
    if (field === 'quantity' || field === 'unit_price') {
      newItems[index].amount = newItems[index].quantity * newItems[index].unit_price
    }
    setItems(newItems)
  }

  const addItem = () => setItems([...items, { description: '', quantity: 1, unit_price: 0, amount: 0 }])
  const removeItem = (index: number) => { if (items.length > 1) setItems(items.filter((_, i) => i !== index)) }

  const subtotal = items.reduce((sum, item) => sum + item.amount, 0)
  const taxAmount = subtotal * (taxRate / 100)
  const total = subtotal + taxAmount

  const handleSave = async (status: 'draft' | 'sent') => {
    if (!clientId) { alert('Veuillez sélectionner un client'); return }
    if (items.some(item => !item.description)) { alert('Veuillez remplir toutes les descriptions'); return }

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const limitCheck = await canCreateInvoice(user.id)
    if (!limitCheck.allowed) { alert(limitCheck.reason); return }

    setLoading(true)
    const { data: invoice, error: invoiceError } = await supabase.from('invoices').insert({
      user_id: user.id, client_id: clientId, invoice_number: invoiceNumber, status,
      issue_date: issueDate, due_date: dueDate, subtotal, tax_rate: taxRate,
      tax_amount: taxAmount, total, notes,
    }).select().single()

    if (invoiceError || !invoice) { alert('Erreur lors de la création'); setLoading(false); return }

    await supabase.from('invoice_items').insert(items.map(item => ({ invoice_id: invoice.id, description: item.description, quantity: item.quantity, unit_price: item.unit_price, amount: item.amount })))

    await logActivity('created', 'invoice', invoice.id, invoiceNumber, { total, status })

    if (sendEmail && status === 'sent') {
      const selectedClient = clients.find(c => c.id === clientId)
      if (selectedClient?.email) {
        try { await fetch('/api/invoices/send-email', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ invoice_id: invoice.id }) }) } catch {}
      }
    }
    router.push(`/invoices/${invoice.id}`)
  }

  const selectedClient = clients.find(c => c.id === clientId)

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href="/invoices">
          <Button variant="ghost" size="icon" className="rounded-xl"><ArrowLeft className="h-5 w-5" /></Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Nouvelle facture</h1>
          <p className="text-gray-500 mt-1">Remplissez les informations ci-dessous</p>
        </div>
      </div>

      {/* Plan limit warning */}
      {planLimit && !planLimit.allowed && (
        <div className="bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 rounded-xl p-4 flex items-center justify-between">
          <div>
            <p className="text-amber-800 text-sm font-semibold">Limite atteinte</p>
            <p className="text-amber-700 text-sm mt-0.5">{planLimit.reason}</p>
          </div>
          <Link href="/pricing">
            <Button size="sm" className="bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 shadow-lg shadow-amber-200/50 btn-press rounded-xl">
              Passer au Pro
            </Button>
          </Link>
        </div>
      )}

      {planLimit && planLimit.allowed && planLimit.max > 0 && (
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-3 flex items-center justify-between">
          <p className="text-blue-700 text-sm font-medium">{planLimit.current}/{planLimit.max} factures ce mois</p>
          <div className="w-32 h-2 bg-blue-100 rounded-full overflow-hidden">
            <div className="h-full bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full transition-all" style={{ width: `${Math.min((planLimit.current / planLimit.max) * 100, 100)}%` }} />
          </div>
        </div>
      )}

      {/* Invoice info */}
      <Card className="border-0 shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-semibold text-gray-500 uppercase tracking-wider">Informations de la facture</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Numéro de facture</label>
              <Input value={invoiceNumber} onChange={(e) => setInvoiceNumber(e.target.value)} className="rounded-xl" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Client *</label>
              <select value={clientId} onChange={(e) => setClientId(e.target.value)}
                className="w-full h-10 px-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white">
                <option value="">Sélectionner un client</option>
                {clients.map(client => <option key={client.id} value={client.id}>{client.name}</option>)}
              </select>
              {clients.length === 0 && (
                <p className="text-xs text-gray-500 mt-1"><Link href="/clients" className="text-blue-600 hover:underline">Ajoutez un client d'abord</Link></p>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Date d'émission</label>
              <Input type="date" value={issueDate} onChange={(e) => setIssueDate(e.target.value)} className="rounded-xl" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Date d'échéance</label>
              <Input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} className="rounded-xl" />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Items */}
      <Card className="border-0 shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-semibold text-gray-500 uppercase tracking-wider">Articles / Services</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {items.map((item, index) => (
            <div key={index} className="flex gap-3 items-start p-3 bg-gray-50/50 rounded-xl">
              <div className="flex-1">
                <Input placeholder="Description du service" value={item.description} onChange={(e) => updateItem(index, 'description', e.target.value)} className="rounded-xl border-0 bg-white" />
              </div>
              <div className="w-24">
                <Input type="number" placeholder="Qté" min="1" value={item.quantity} onChange={(e) => updateItem(index, 'quantity', Number(e.target.value))} className="rounded-xl border-0 bg-white" />
              </div>
              <div className="w-36">
                <Input type="number" placeholder="Prix unitaire" min="0" value={item.unit_price || ''} onChange={(e) => updateItem(index, 'unit_price', Number(e.target.value))} className="rounded-xl border-0 bg-white" />
              </div>
              <div className="w-32 text-right text-sm font-bold text-gray-900 pt-2.5">{formatCurrency(item.amount)}</div>
              <Button variant="ghost" size="icon" onClick={() => removeItem(index)} disabled={items.length === 1} className="rounded-xl hover:bg-red-50 hover:text-red-600">
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          ))}
          <Button variant="outline" onClick={addItem} className="rounded-xl border-dashed border-2 border-gray-200 hover:border-blue-400 hover:bg-blue-50 hover:text-blue-600 w-full btn-press">
            <Plus className="h-4 w-4 mr-2" /> Ajouter une ligne
          </Button>
        </CardContent>
      </Card>

      {/* Notes & Totals */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="border-0 shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold text-gray-500 uppercase tracking-wider">Notes</CardTitle>
          </CardHeader>
          <CardContent>
            <Textarea placeholder="Conditions de paiement, remarques..." value={notes} onChange={(e) => setNotes(e.target.value)} rows={4} className="rounded-xl" />
          </CardContent>
        </Card>

        <Card className="border-0 shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold text-gray-500 uppercase tracking-wider">Totaux</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Sous-total</span>
              <span className="font-medium text-gray-900">{formatCurrency(subtotal)}</span>
            </div>
            <div className="flex justify-between text-sm items-center gap-2">
              <span className="text-gray-500">TVA (%)</span>
              <div className="flex items-center gap-2">
                <Input type="number" min="0" max="100" value={taxRate} onChange={(e) => setTaxRate(Number(e.target.value))} className="w-20 h-8 text-right text-sm rounded-lg" />
                <span className="text-sm text-gray-400">%</span>
              </div>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">TVA</span>
              <span className="font-medium text-gray-900">{formatCurrency(taxAmount)}</span>
            </div>
            <div className="border-t border-gray-200 pt-3 flex justify-between">
              <span className="font-bold text-gray-900">Total</span>
              <span className="font-bold text-xl bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">{formatCurrency(total)}</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Email option */}
      {selectedClient?.email && (
        <Card className="border-0 shadow-sm border-l-4 border-l-blue-500">
          <CardContent className="pt-6">
            <label className="flex items-center gap-3 cursor-pointer">
              <input type="checkbox" checked={sendEmail} onChange={(e) => setSendEmail(e.target.checked)}
                className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500" />
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center"><Mail className="h-4 w-4 text-blue-600" /></div>
                <div>
                  <p className="text-sm font-medium text-gray-700">Envoyer la facture par email</p>
                  <p className="text-xs text-gray-500">Un email sera envoyé à {selectedClient.email} avec le lien de paiement</p>
                </div>
              </div>
            </label>
          </CardContent>
        </Card>
      )}

      {/* Actions */}
      <div className="flex justify-end gap-3 pb-8">
        <Button variant="outline" onClick={() => handleSave('draft')} disabled={loading} className="rounded-xl border-gray-200 btn-press">
          Sauvegarder brouillon
        </Button>
        <Button onClick={() => handleSave('sent')} disabled={loading}
          className="rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 shadow-lg shadow-blue-200/50 btn-press px-8">
          Créer et envoyer
        </Button>
      </div>
    </div>
  )
}
