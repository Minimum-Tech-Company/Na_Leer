'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { InvoiceTemplate, Plan } from '@/types'
import { Palette, Plus, Check, Eye } from 'lucide-react'

const PRESET_COLORS = [
  { name: 'Bleu', primary: '#2563EB', accent: '#1E40AF' },
  { name: 'Vert', primary: '#16A34A', accent: '#15803D' },
  { name: 'Orange', primary: '#EA580C', accent: '#C2410C' },
  { name: 'Violet', primary: '#7C3AED', accent: '#6D28D9' },
  { name: 'Rose', primary: '#E11D48', accent: '#BE123C' },
  { name: 'Noir', primary: '#1F2937', accent: '#111827' },
]

export default function TemplatesPage() {
  const [templates, setTemplates] = useState<InvoiceTemplate[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [currentPlan, setCurrentPlan] = useState<Plan | null>(null)
  const [editing, setEditing] = useState<InvoiceTemplate | null>(null)
  const [showNew, setShowNew] = useState(false)
  const supabase = createClient()

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const { data: sub } = await supabase
      .from('subscriptions')
      .select('plans(*)')
      .eq('user_id', user.id)
      .eq('status', 'active')
      .order('created_at', { ascending: false })
      .limit(1)
      .single()

    setCurrentPlan(sub?.plans as Plan || null)

    const { data } = await supabase
      .from('invoice_templates')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })

    setTemplates(data || [])
    setLoading(false)
  }

  const handleSave = async () => {
    if (!editing) return
    setSaving(true)
    setError('')

    const { error: upsertError } = await supabase
      .from('invoice_templates')
      .upsert({
        id: editing.id,
        user_id: editing.user_id,
        name: editing.name,
        primary_color: editing.primary_color,
        accent_color: editing.accent_color,
        show_logo: editing.show_logo,
        show_tax_id: editing.show_tax_id,
        show_rccm: editing.show_rccm,
        footer_text: editing.footer_text,
        is_default: editing.is_default,
        updated_at: new Date().toISOString(),
      })

    if (upsertError) {
      setError(upsertError.message)
    } else {
      setSuccess('Template sauvegardé !')
      setEditing(null)
      fetchData()
    }

    setSaving(false)
  }

  const handleCreate = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const { data, error } = await supabase
      .from('invoice_templates')
      .insert({
        user_id: user.id,
        name: 'Nouveau template',
        primary_color: '#2563EB',
        accent_color: '#1E40AF',
        show_logo: true,
        show_tax_id: true,
        show_rccm: true,
        footer_text: 'Merci pour votre paiement',
        is_default: templates.length === 0,
      })
      .select()
      .single()

    if (data) {
      setEditing(data)
      setShowNew(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Supprimer ce template ?')) return
    const { error } = await supabase
      .from('invoice_templates')
      .delete()
      .eq('id', id)

    if (!error) fetchData()
  }

  const handleSetDefault = async (id: string) => {
    // Unset all defaults
    for (const t of templates) {
      await supabase
        .from('invoice_templates')
        .update({ is_default: t.id === id })
        .eq('id', t.id)
    }
    fetchData()
  }

  const isBusiness = currentPlan?.id === 'business'

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">Chargement...</div>
      </div>
    )
  }

  if (!isBusiness) {
    return (
      <div className="max-w-2xl mx-auto space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Templates de factures</h1>
          <p className="text-gray-600">Personnalisez l&apos;apparence de vos factures</p>
        </div>
        <Card>
          <CardContent className="py-12 text-center">
            <Palette className="h-12 w-12 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Fonctionnalité Business
            </h3>
            <p className="text-gray-500 mb-4">
              La personnalisation avancée est disponible avec le plan Business (35 000 FCFA/mois)
            </p>
            <a href="/pricing">
              <Button>Passer au plan Business</Button>
            </a>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Templates de factures</h1>
          <p className="text-gray-600">Personnalisez l&apos;apparence de vos factures</p>
        </div>
        <Button onClick={() => handleCreate()}>
          <Plus className="h-4 w-4 mr-1" />
          Nouveau template
        </Button>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-lg text-sm">{error}</div>
      )}
      {success && (
        <div className="bg-green-50 border border-green-200 text-green-700 p-4 rounded-lg text-sm">{success}</div>
      )}

      {/* Editor */}
      {editing && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Palette className="h-5 w-5" />
              Éditer le template
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Nom</label>
              <Input
                value={editing.name}
                onChange={(e) => setEditing({ ...editing, name: e.target.value })}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Couleurs prédéfinies</label>
              <div className="flex gap-2 flex-wrap">
                {PRESET_COLORS.map((preset) => (
                  <button
                    key={preset.name}
                    onClick={() => setEditing({ ...editing, primary_color: preset.primary, accent_color: preset.accent })}
                    className={`flex items-center gap-2 px-3 py-2 rounded-lg border text-sm ${
                      editing.primary_color === preset.primary ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:bg-gray-50'
                    }`}
                  >
                    <div className="flex gap-1">
                      <div className="w-4 h-4 rounded-full" style={{ backgroundColor: preset.primary }} />
                      <div className="w-4 h-4 rounded-full" style={{ backgroundColor: preset.accent }} />
                    </div>
                    {preset.name}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Couleur principale</label>
                <div className="flex gap-2">
                  <input
                    type="color"
                    value={editing.primary_color}
                    onChange={(e) => setEditing({ ...editing, primary_color: e.target.value })}
                    className="w-10 h-10 rounded border cursor-pointer"
                  />
                  <Input
                    value={editing.primary_color}
                    onChange={(e) => setEditing({ ...editing, primary_color: e.target.value })}
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Couleur d&apos;accent</label>
                <div className="flex gap-2">
                  <input
                    type="color"
                    value={editing.accent_color}
                    onChange={(e) => setEditing({ ...editing, accent_color: e.target.value })}
                    className="w-10 h-10 rounded border cursor-pointer"
                  />
                  <Input
                    value={editing.accent_color}
                    onChange={(e) => setEditing({ ...editing, accent_color: e.target.value })}
                  />
                </div>
              </div>
            </div>

            <div className="flex gap-4">
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={editing.show_logo}
                  onChange={(e) => setEditing({ ...editing, show_logo: e.target.checked })}
                  className="rounded"
                />
                Afficher le logo
              </label>
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={editing.show_tax_id}
                  onChange={(e) => setEditing({ ...editing, show_tax_id: e.target.checked })}
                  className="rounded"
                />
                Afficher le NINEA
              </label>
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={editing.show_rccm}
                  onChange={(e) => setEditing({ ...editing, show_rccm: e.target.checked })}
                  className="rounded"
                />
                Afficher le RCCM
              </label>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Texte de pied de facture</label>
              <Input
                value={editing.footer_text}
                onChange={(e) => setEditing({ ...editing, footer_text: e.target.value })}
                placeholder="Merci pour votre paiement"
              />
            </div>

            {/* Preview */}
            <div className="border rounded-lg p-4 bg-white">
              <h4 className="text-sm font-medium text-gray-700 mb-2">Aperçu</h4>
              <div className="border rounded p-4" style={{ borderTop: `4px solid ${editing.primary_color}` }}>
                <div className="flex justify-between items-start">
                  <div>
                    <div className="text-lg font-bold" style={{ color: editing.primary_color }}>FACTURE</div>
                    <div className="text-sm text-gray-500">N° FAC-2025-001</div>
                  </div>
                  {editing.show_logo && (
                    <div className="w-16 h-16 bg-gray-100 rounded flex items-center justify-center text-xs text-gray-400">
                      Logo
                    </div>
                  )}
                </div>
                <div className="mt-3 text-xs text-gray-600">
                  <p><strong>Entreprise SARL</strong></p>
                  {editing.show_tax_id && <p>NINEA: 012345678</p>}
                  {editing.show_rccm && <p>RCCM: SN/DKR/2025/B/001</p>}
                </div>
                <div className="mt-3 text-xs text-right" style={{ color: editing.accent_color }}>
                  {editing.footer_text}
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setEditing(null)}>
                Annuler
              </Button>
              <Button onClick={handleSave} disabled={saving}>
                {saving ? 'Sauvegarde...' : 'Sauvegarder'}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Template list */}
      <div className="grid md:grid-cols-2 gap-4">
        {templates.map((template) => (
          <Card key={template.id} className={`relative ${template.is_default ? 'border-2 border-blue-500' : ''}`}>
            {template.is_default && (
              <div className="absolute -top-2 right-4">
                <Badge className="bg-blue-600 text-white text-xs">Par défaut</Badge>
              </div>
            )}
            <CardContent className="p-4">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="font-semibold text-gray-900">{template.name}</h3>
                  <div className="flex gap-1 mt-2">
                    <div className="w-6 h-6 rounded" style={{ backgroundColor: template.primary_color }} />
                    <div className="w-6 h-6 rounded" style={{ backgroundColor: template.accent_color }} />
                  </div>
                  <p className="text-xs text-gray-400 mt-2">
                    {template.footer_text || 'Pas de texte de pied'}
                  </p>
                </div>
                <div className="flex gap-1">
                  <Button variant="ghost" size="sm" onClick={() => setEditing(template)}>
                    Modifier
                  </Button>
                  {!template.is_default && (
                    <Button variant="ghost" size="sm" onClick={() => handleSetDefault(template.id)}>
                      Défaut
                    </Button>
                  )}
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDelete(template.id)}
                    className="text-red-600"
                  >
                    Supprimer
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}

        {templates.length === 0 && (
          <Card className="col-span-2">
            <CardContent className="py-12 text-center">
              <Palette className="h-12 w-12 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500 mb-4">Aucun template créé</p>
              <Button onClick={() => handleCreate()}>
                <Plus className="h-4 w-4 mr-1" />
                Créer un template
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
