import { createClient } from '@/lib/supabase/client'

export type EntityType = 'invoice' | 'client' | 'payment' | 'subscription' | 'team' | 'settings'

export type ActionType =
  | 'created'
  | 'updated'
  | 'deleted'
  | 'sent'
  | 'paid'
  | 'cancelled'
  | 'invited'
  | 'removed'
  | 'status_changed'

const ACTION_LABELS: Record<ActionType, string> = {
  created: 'a créé',
  updated: 'a modifié',
  deleted: 'a supprimé',
  sent: 'a envoyé',
  paid: 'a marqué payé',
  cancelled: 'a annulé',
  invited: 'a invité',
  removed: 'a retiré',
  status_changed: 'a changé le statut de',
}

const ENTITY_LABELS: Record<EntityType, string> = {
  invoice: 'facture',
  client: 'client',
  payment: 'paiement',
  subscription: 'abonnement',
  team: 'membre d\'équipe',
  settings: 'paramètres',
}

export function getActionLabel(action: ActionType): string {
  return ACTION_LABELS[action] || action
}

export function getEntityLabel(entity: EntityType): string {
  return ENTITY_LABELS[entity] || entity
}

export async function logActivity(
  action: ActionType,
  entityType: EntityType,
  entityId?: string,
  entityName?: string,
  details?: Record<string, any>
) {
  try {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    await supabase.from('activity_logs').insert({
      user_id: user.id,
      action,
      entity_type: entityType,
      entity_id: entityId || null,
      entity_name: entityName || null,
      details: details || null,
    })
  } catch {
    // Silent fail - activity logging should not block the main action
  }
}
