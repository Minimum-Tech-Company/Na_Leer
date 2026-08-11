'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Select } from '@/components/ui/select'
import { generateInvoiceNumber, formatCurrency } from '@/lib/utils'
import { ArrowLeft, Plus, Trash2 } from 'lucide-react'
import Link from 'next/link'
import { Client, InvoiceItem } from '@/types'

export default function NewInvoicePage() {
  const [clients, setClients] = useState<Client[]>([])
  const [clientId, setClientId] = useState('')
  const [invoiceNumber, setInvoiceNumber] = useState('')
  const [issueDate, setIssueDate] = useState(new Date().toISOString().split('T')[0])
  const [dueDate, setDueDate] = useState('')
  const [taxRate, setTaxRate] = useState(18)
  const [notes, setNotes] = useState('')
  const [items, setItems] = useState<InvoiceItem[]>([
    { description: '', quantity: 1, unit_price: 0, amount: 0 },
  ])
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    setInvoiceNumber(generateInvoiceNumber())
    const nextMonth = new Date()
    nextMonth.setMonth(nextMonth.getMonth() + 1)
    setDueDate(nextMonth.toISOString().split('T')[0])

    const fetchClients = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      const { data } = await supabase
        .from('clients')
        .select('*')
        .eq('user_id', user.id)
        .order('name')
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

  const addItem = () => {
    setItems([...items, { description: '', quantity: 1, unit_price: 0, amount: 0 }])
  }

  const removeItem = (index: number) => {
    if (items.length > 1) {
      setItems(items.filter((_, i) => i !== index))
    }
  }

  const subtotal = items.reduce((sum, item) => sum + item.amount, 0)
  const taxAmount = subtotal * (taxRate / 100)
  const total = subtotal + taxAmount

  const handleSave = async (status: 'draft' | 'sent') => {
    if (!clientId) {
      alert('Veuillez sélectionner un client')
      return
    }
    if (items.some(item => !item.description)) {
      alert('Veuillez remplir toutes les descriptions')
      return
    }

    setLoading(true)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const { data: invoice, error: invoiceError } = await supabase
      .from('invoices')
      .insert({
        user_id: user.id,
        client_id: clientId,
        invoice_number: invoiceNumber,
        status,
        issue_date: issueDate,
        due_date: dueDate,
        subtotal,
        tax_rate: taxRate,
        tax_amount: taxAmount,
        total,
        notes,
      })
      .select()
      .single()

    if (invoiceError || !invoice) {
      alert('Erreur lors de la création')
      setLoading(false)
      return
    }

    const invoiceItems = items.map(item => ({
      invoice_id: invoice.id,
      description: item.description,
      quantity: item.quantity,
      unit_price: item.unit_price,
      amount: item.amount,
    }))

    await supabase.from('invoice_items').insert(invoiceItems)

    router.push(`/dashboard/invoices/${invoice.id}`)
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/dashboard/invoices">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-5 w-5" />
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Nouvelle facture</h1>
          <p className="text-gray-600">Remplissez les informations ci-dessous</p>
        </div>
      </div>

      {/* Invoice info */}
      <Card>
        <CardHeader>
          <CardTitle>Informations de la facture</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Numéro de facture
              </label>
              <Input
                value={invoiceNumber}
                onChange={(e) => setInvoiceNumber(e.target.value)}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Client *
              </label>
              <Select value={clientId} onChange={(e) => setClientId(e.target.value)}>
                <option value="">Sélectionner un client</option>
                {clients.map((client) => (
                  <option key={client.id} value={client.id}>
                    {client.name}
                  </option>
                ))}
              </Select>
              {clients.length === 0 && (
                <p className="text-xs text-gray-500 mt-1">
                  <Link href="/dashboard/clients" className="text-blue-600 hover:underline">
                    Ajoutez un client d&apos;abord
                  </Link>
                </p>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Date d&apos;émission
              </label>
              <Input
                type="date"
                value={issueDate}
                onChange={(e) => setIssueDate(e.target.value)}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Date d&apos;échéance
              </label>
              <Input
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Items */}
      <Card>
        <CardHeader>
          <CardTitle>Articles / Services</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {items.map((item, index) => (
            <div key={index} className="flex gap-3 items-start">
              <div className="flex-1">
                <Input
                  placeholder="Description"
                  value={item.description}
                  onChange={(e) => updateItem(index, 'description', e.target.value)}
                />
              </div>
              <div className="w-24">
                <Input
                  type="number"
                  placeholder="Qté"
                  min="1"
                  value={item.quantity}
                  onChange={(e) => updateItem(index, 'quantity', Number(e.target.value))}
                />
              </div>
              <div className="w-36">
                <Input
                  type="number"
                  placeholder="Prix unitaire"
                  min="0"
                  value={item.unit_price || ''}
                  onChange={(e) => updateItem(index, 'unit_price', Number(e.target.value))}
                />
              </div>
              <div className="w-32 text-right text-sm font-medium pt-2.5">
                {formatCurrency(item.amount)}
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => removeItem(index)}
                disabled={items.length === 1}
              >
                <Trash2 className="h-4 w-4 text-red-500" />
              </Button>
            </div>
          ))}
          <Button variant="outline" onClick={addItem}>
            <Plus className="h-4 w-4 mr-2" />
            Ajouter une ligne
          </Button>
        </CardContent>
      </Card>

      {/* Notes & Totals */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Notes</CardTitle>
          </CardHeader>
          <CardContent>
            <Textarea
              placeholder="Conditions de paiement, remarques..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={4}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Totaux</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Sous-total</span>
              <span className="font-medium">{formatCurrency(subtotal)}</span>
            </div>
            <div className="flex justify-between text-sm items-center gap-2">
              <span className="text-gray-600">TVA (%)</span>
              <div className="flex items-center gap-2">
                <Input
                  type="number"
                  min="0"
                  max="100"
                  value={taxRate}
                  onChange={(e) => setTaxRate(Number(e.target.value))}
                  className="w-20 h-8 text-right text-sm"
                />
                <span className="text-sm text-gray-500">%</span>
              </div>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">TVA</span>
              <span className="font-medium">{formatCurrency(taxAmount)}</span>
            </div>
            <div className="border-t pt-3 flex justify-between">
              <span className="font-bold">Total</span>
              <span className="font-bold text-lg">{formatCurrency(total)}</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Actions */}
      <div className="flex justify-end gap-3">
        <Button variant="outline" onClick={() => handleSave('draft')} disabled={loading}>
          Sauvegarder brouillon
        </Button>
        <Button onClick={() => handleSave('sent')} disabled={loading}>
          Créer et envoyer
        </Button>
      </div>
    </div>
  )
}
