import { diagnoseAppleWalletConfig, getAppleWalletErrorMessage } from '../lib/applePassDiagnostics.js'
import {
  diagnoseGoogleWalletConfig,
  getGoogleWalletErrorMessage,
  testGoogleWalletAuth,
} from '../lib/googleWalletDiagnostics.js'
import { createAppleWalletPass } from '../lib/applePass.js'
import { createGoogleWalletSaveUrl } from '../lib/googleWallet.js'
import { sendTypedEmail } from '../lib/mailer.js'
import {
  enforceWalletRateLimit,
  isAppleWalletConfigured,
  isGoogleWalletConfigured,
  markWalletAdded,
  parseWalletRequest,
} from '../lib/walletCommon.js'
import { getRedis } from '../lib/security.js'
import { getOrCreateWalletPayToken } from '../lib/walletPay.js'

function getPathname(req) {
  const raw = req.url ?? ''
  if (raw.startsWith('/')) return raw.split('?')[0]
  try {
    return new URL(raw, 'http://localhost').pathname
  } catch {
    return raw.split('?')[0]
  }
}

export default async function handler(req, res) {
  const path = getPathname(req)

  if (path.endsWith('/wallet-health')) {
    if (req.method !== 'GET') {
      res.setHeader('Allow', 'GET')
      return res.status(405).json({ error: 'Method not allowed' })
    }

    const apple = diagnoseAppleWalletConfig()
    const google = diagnoseGoogleWalletConfig()

    if (req.query?.test === 'google' && google.ok) {
      try {
        await testGoogleWalletAuth()
        google.steps.push({
          step: 'auth',
          ok: true,
          message: 'Authentification Google Wallet API OK',
        })
      } catch (error) {
        google.ok = false
        google.steps.push({
          step: 'auth',
          ok: false,
          message: error instanceof Error ? error.message : 'Échec authentification Google',
        })
      }
    }

    const ok = apple.ok || google.ok
    return res.status(ok ? 200 : 500).json({ ok, apple, google })
  }

  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST')
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const redis = getRedis()
  if (!redis) {
    return res.status(503).json({ error: 'Service wallet indisponible (Redis requis)' })
  }

  const allowed = await enforceWalletRateLimit(req)
  if (!allowed) {
    return res.status(429).json({ error: 'Trop de tentatives. Réessayez plus tard.' })
  }

  let payload
  try {
    payload = parseWalletRequest(req)
  } catch {
    return res.status(400).json({ error: 'Corps de requête invalide' })
  }

  if (payload.error) {
    return res.status(400).json({ error: payload.error })
  }

  const { platform, userId, email, fullName, cardNumber } = payload

  try {
    const walletPayToken = await getOrCreateWalletPayToken(redis, userId)
    const passInput = { userId, fullName, cardNumber, email, walletPayToken }

    if (platform === 'apple') {
      if (!isAppleWalletConfigured()) {
        return res.status(503).json({
          error: 'Apple Wallet non configuré sur le serveur. Voir les variables APPLE_* dans Vercel.',
        })
      }

      const buffer = await createAppleWalletPass(passInput)
      await markWalletAdded(userId, 'apple')
      await sendTypedEmail('wallet_added', { email, fullName, wallet: 'apple' })

      res.setHeader('Content-Type', 'application/vnd.apple.pkpass')
      res.setHeader('Content-Disposition', 'attachment; filename="guinee-multiservices.pkpass"')
      return res.status(200).send(buffer)
    }

    if (!isGoogleWalletConfigured()) {
      return res.status(503).json({
        error: 'Google Wallet non configuré sur le serveur. Voir les variables GOOGLE_WALLET_* dans Vercel.',
      })
    }

    const saveUrl = await createGoogleWalletSaveUrl(passInput)
    await markWalletAdded(userId, 'google')
    await sendTypedEmail('wallet_added', { email, fullName, wallet: 'google' })

    return res.status(200).json({ ok: true, saveUrl })
  } catch (error) {
    console.error('Wallet provisioning failed', error)
    const message =
      platform === 'google'
        ? getGoogleWalletErrorMessage(error)
        : getAppleWalletErrorMessage(error)
    return res.status(500).json({
      error: message,
    })
  }
}
