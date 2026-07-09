import { GoogleAuth } from 'google-auth-library'
import jwt from 'jsonwebtoken'
import { buildCardQrUrl, getSiteUrl, maskCardNumber } from './walletCommon.js'

function getCredentials() {
  const raw = process.env.GOOGLE_WALLET_SERVICE_ACCOUNT_JSON
  if (!raw) throw new Error('Google Wallet non configuré')
  return JSON.parse(raw)
}

function getClassId() {
  const issuerId = process.env.GOOGLE_WALLET_ISSUER_ID
  const suffix = process.env.GOOGLE_WALLET_CLASS_SUFFIX ?? 'guinee_multiservices_card'
  return `${issuerId}.${suffix}`
}

async function getAuthClient() {
  const credentials = getCredentials()
  return new GoogleAuth({
    credentials,
    scopes: ['https://www.googleapis.com/auth/wallet_object.issuer'],
  })
}

async function ensureGenericClass() {
  const auth = await getAuthClient()
  const client = await auth.getClient()
  const classId = getClassId()

  try {
    await client.request({
      url: `https://walletobjects.googleapis.com/walletobjects/v1/genericClass/${classId}`,
      method: 'GET',
    })
    return classId
  } catch (error) {
    const status = error?.response?.status
    if (status !== 404) throw error
  }

  await client.request({
    url: 'https://walletobjects.googleapis.com/walletobjects/v1/genericClass',
    method: 'POST',
    data: {
      id: classId,
      issuerName: 'Guinée Multiservices',
      reviewStatus: 'UNDER_REVIEW',
      cardTitle: {
        defaultValue: { language: 'fr', value: 'Guinée Multiservices' },
      },
      hexBackgroundColor: '#0f172a',
    },
  })

  return classId
}

export async function createGoogleWalletSaveUrl({ userId, fullName, cardNumber, email }) {
  const credentials = getCredentials()
  const issuerId = process.env.GOOGLE_WALLET_ISSUER_ID
  const classId = await ensureGenericClass()
  const objectId = `${issuerId}.gm_${userId.replace(/[^a-zA-Z0-9._-]/g, '_')}`
  const masked = maskCardNumber(cardNumber)
  const qrUrl = buildCardQrUrl(userId)
  const siteUrl = getSiteUrl()

  const claims = {
    iss: credentials.client_email,
    aud: 'google',
    origins: [siteUrl],
    typ: 'savetowallet',
    payload: {
      genericObjects: [
        {
          id: objectId,
          classId,
          state: 'ACTIVE',
          cardTitle: {
            defaultValue: { language: 'fr', value: 'Guinée Multiservices' },
          },
          header: {
            defaultValue: { language: 'fr', value: fullName },
          },
          subheader: {
            defaultValue: { language: 'fr', value: masked },
          },
          barcode: {
            type: 'QR_CODE',
            value: qrUrl,
            alternateText: masked,
          },
          hexBackgroundColor: '#0f172a',
          textModulesData: [
            {
              header: 'Email',
              body: email,
              id: 'email',
            },
            {
              header: 'Support',
              body: 'support@mscarte.com',
              id: 'support',
            },
          ],
        },
      ],
    },
  }

  const token = jwt.sign(claims, credentials.private_key, { algorithm: 'RS256' })
  return `https://pay.google.com/gp/v/save/${token}`
}
