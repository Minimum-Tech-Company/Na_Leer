function normalize(raw: string): string {
  return raw.toLowerCase().replace(/[_+]/g, ' ')
}

export function isSessionMissingError(raw: string): boolean {
  const key = normalize(raw)
  return (
    key.includes('session missing') ||
    key.includes('sessionnotfound') ||
    key.includes('session not found') ||
    key.includes('authsessionmissing') ||
    key.includes('session expired')
  )
}

export function mapAuthError(raw: string): string {
  const key = normalize(raw)
  if (key.includes('email not confirmed') || key.includes('emailnotconfirmed')) {
    return 'Veuillez confirmer votre email avant de vous connecter. Vérifiez votre boîte de réception (et vos spams).'
  }
  if (isSessionMissingError(raw)) {
    return 'Votre session a expiré. Veuillez vous reconnecter.'
  }
  if (
    key.includes('invalid login credentials') ||
    key.includes('invalid credentials') ||
    key.includes('invalid login')
  ) {
    return 'Email ou mot de passe incorrect.'
  }
  if (key.includes('already exists') || key.includes('already registered') || key.includes('already been registered')) {
    return 'Un compte existe déjà avec cet email. Connectez-vous ou réinitialisez votre mot de passe.'
  }
  if (key.includes('confirmation') || key.includes('otp') || key.includes('token')) {
    return 'Le lien de confirmation a expiré ou est invalide. Réessayez depuis votre email.'
  }
  if (key.includes('rate limit') || key.includes('too many') || key.includes('security purposes') || key.includes('request this after')) {
    return 'Trop de tentatives. Réessayez dans quelques minutes.'
  }
  if (key.includes('weak password') || key.includes('password should')) {
    return 'Le mot de passe est trop faible. Utilisez au moins 8 caractères avec des chiffres et des lettres.'
  }
  return raw || 'Une erreur est survenue. Réessayez.'
}
