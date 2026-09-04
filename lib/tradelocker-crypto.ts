import { createCipheriv, createDecipheriv, createHash, randomBytes } from 'node:crypto'

const algorithm = 'aes-256-gcm'

function getKey() {
  const secret = process.env.TRADELOCKER_ENCRYPTION_KEY
  if (!secret) throw new Error('TRADELOCKER_ENCRYPTION_KEY is not configured')
  return createHash('sha256').update(secret).digest()
}

export function encryptTradeLockerToken(value: string) {
  const iv = randomBytes(12)
  const cipher = createCipheriv(algorithm, getKey(), iv)
  const encrypted = Buffer.concat([cipher.update(value, 'utf8'), cipher.final()])
  const tag = cipher.getAuthTag()
  return [iv, tag, encrypted].map((part) => part.toString('base64url')).join('.')
}

export function decryptTradeLockerToken(payload: string) {
  const [ivValue, tagValue, encryptedValue] = payload.split('.')
  if (!ivValue || !tagValue || !encryptedValue) throw new Error('Invalid encrypted TradeLocker token')
  const decipher = createDecipheriv(algorithm, getKey(), Buffer.from(ivValue, 'base64url'))
  decipher.setAuthTag(Buffer.from(tagValue, 'base64url'))
  return Buffer.concat([
    decipher.update(Buffer.from(encryptedValue, 'base64url')),
    decipher.final(),
  ]).toString('utf8')
}
