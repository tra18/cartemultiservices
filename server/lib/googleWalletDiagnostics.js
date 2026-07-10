import { GoogleAuth } from 'google-auth-library'
import { getGoogleWalletCredentials, getGoogleWalletClassId } from './googleWallet.js'
import { isGoogleWalletConfigured } from './walletCommon.js'

export function diagnoseGoogleWalletConfig() {
  const issuerId = String(process.env.GOOGLE_WALLET_ISSUER_ID ?? '').trim()
  const classSuffix = process.env.GOOGLE_WALLET_CLASS_SUFFIX ?? 'guinee_multiservices_card'
  const jsonLength = String(process.env.GOOGLE_WALLET_SERVICE_ACCOUNT_JSON ?? '').length
  const base64Length = String(process.env.GOOGLE_WALLET_SERVICE_ACCOUNT_JSON_BASE64 ?? '').replace(
    /\s+/g,
    ''
  ).length
  const siteUrl = (process.env.SITE_URL ?? '').replace(/\/$/, '')

  const report = {
    configured: isGoogleWalletConfigured(),
    issuerId,
    classId: issuerId ? `${issuerId}.${classSuffix}` : '',
    siteUrl,
    jsonLength,
    base64Length,
    steps: [],
    ok: false,
  }

  if (!report.configured) {
    report.steps.push({
      step: 'env',
      ok: false,
      message:
        'Variables incomplètes : GOOGLE_WALLET_ISSUER_ID + GOOGLE_WALLET_SERVICE_ACCOUNT_JSON (ou _BASE64)',
    })
    return report
  }

  report.steps.push({ step: 'env', ok: true, message: 'Variables présentes' })

  if (!/^\d+$/.test(issuerId)) {
    report.steps.push({
      step: 'issuerId',
      ok: false,
      message: 'GOOGLE_WALLET_ISSUER_ID doit être numérique (Issuer ID Google Pay)',
    })
    return report
  }
  report.steps.push({ step: 'issuerId', ok: true, message: 'Issuer ID format OK' })

  if (!siteUrl.startsWith('https://')) {
    report.steps.push({
      step: 'siteUrl',
      ok: false,
      message: 'SITE_URL doit être une URL HTTPS publique (origine Google Wallet)',
    })
    return report
  }
  report.steps.push({ step: 'siteUrl', ok: true, message: 'SITE_URL HTTPS OK' })

  let credentials
  try {
    credentials = getGoogleWalletCredentials()
    report.steps.push({ step: 'credentials', ok: true, message: 'JSON compte de service lisible' })
  } catch (error) {
    report.steps.push({
      step: 'credentials',
      ok: false,
      message: error instanceof Error ? error.message : 'JSON compte de service invalide',
    })
    return report
  }

  if (!credentials.client_email || !credentials.private_key) {
    report.steps.push({
      step: 'credentialsFields',
      ok: false,
      message: 'Le JSON doit contenir client_email et private_key',
    })
    return report
  }
  report.steps.push({
    step: 'credentialsFields',
    ok: true,
    message: `Compte de service : ${credentials.client_email}`,
  })

  try {
    getGoogleWalletClassId()
    report.steps.push({ step: 'classId', ok: true, message: `Class ID : ${report.classId}` })
  } catch (error) {
    report.steps.push({
      step: 'classId',
      ok: false,
      message: error instanceof Error ? error.message : 'Class ID invalide',
    })
    return report
  }

  report.ok = true
  return report
}

export async function testGoogleWalletAuth() {
  const credentials = getGoogleWalletCredentials()
  const auth = new GoogleAuth({
    credentials,
    scopes: ['https://www.googleapis.com/auth/wallet_object.issuer'],
  })
  const client = await auth.getClient()
  const token = await client.getAccessToken()
  if (!token) {
    throw new Error('Impossible d’obtenir un jeton Google Wallet API')
  }
  return true
}

export function getGoogleWalletErrorMessage(error) {
  const message = error instanceof Error ? error.message : String(error ?? '')

  if (message.includes('Google Wallet non configuré')) {
    return 'Google Wallet non configuré. Ajoutez GOOGLE_WALLET_ISSUER_ID et le JSON du compte de service dans Vercel.'
  }
  if (message.includes('JSON') || message.includes('Unexpected token')) {
    return 'GOOGLE_WALLET_SERVICE_ACCOUNT_JSON invalide. Utilisez le JSON minifié sur une ligne ou la version BASE64.'
  }
  if (message.includes('wallet_object.issuer') || message.includes('permission')) {
    return 'Le compte de service n’a pas accès à l’API Google Wallet. Vérifiez les rôles dans Google Cloud.'
  }

  return message || 'Impossible de générer le lien Google Wallet.'
}
