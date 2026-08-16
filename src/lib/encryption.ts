import { createHash, randomBytes, createCipheriv, createDecipheriv } from 'crypto'

const ALGORITHM = 'aes-256-gcm'

function getEncryptionKey(): Buffer {
  const key = process.env.FEDAPAY_ENCRYPTION_KEY
  if (!key) {
    throw new Error('FEDAPAY_ENCRYPTION_KEY not configured')
  }
  return createHash('sha256').update(key).digest()
}

export function encrypt(text: string): string {
  const key = getEncryptionKey()
  const iv = randomBytes(16)
  const cipher = createCipheriv(ALGORITHM, key, iv)
  let encrypted = cipher.update(text, 'utf8', 'hex')
  encrypted += cipher.final('hex')
  const tag = cipher.getAuthTag().toString('hex')
  return `${iv.toString('hex')}:${tag}:${encrypted}`
}

export function decrypt(encryptedText: string): string {
  try {
    const key = getEncryptionKey()
    const [ivHex, tagHex, encrypted] = encryptedText.split(':')
    if (!ivHex || !tagHex || !encrypted) {
      return encryptedText
    }
    const iv = Buffer.from(ivHex, 'hex')
    const tag = Buffer.from(tagHex, 'hex')
    const decipher = createDecipheriv(ALGORITHM, key, iv)
    decipher.setAuthTag(tag)
    let decrypted = decipher.update(encrypted, 'hex', 'utf8')
    decrypted += decipher.final('utf8')
    return decrypted
  } catch {
    return encryptedText
  }
}
