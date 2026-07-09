import forge from 'node-forge'
import { PKPass } from 'passkit-generator'
import { getPassIconBuffers } from './walletAssets.js'
import { buildCardQrUrl, getSiteUrl, maskCardNumber } from './walletCommon.js'

function decodeBase64Env(value) {
  const cleaned = String(value ?? '').replace(/\s+/g, '')
  if (!cleaned) return Buffer.alloc(0)
  return Buffer.from(cleaned, 'base64')
}

function toPemCertificate(buffer) {
  const text = buffer.toString('utf-8')
  if (text.includes('BEGIN CERTIFICATE')) {
    return Buffer.from(text)
  }

  const der = forge.util.createBuffer(buffer.toString('binary'))
  const cert = forge.pki.certificateFromAsn1(forge.asn1.fromDer(der))
  return Buffer.from(forge.pki.certificateToPem(cert))
}

function toPemPrivateKey(buffer) {
  const text = buffer.toString('utf-8')
  if (text.includes('BEGIN') && text.includes('PRIVATE KEY')) {
    return Buffer.from(text)
  }

  const der = forge.util.createBuffer(buffer.toString('binary'))
  const privateKey = forge.pki.privateKeyFromAsn1(forge.asn1.fromDer(der))
  return Buffer.from(forge.pki.privateKeyToPem(privateKey))
}

function extractPrivateKeyFromP12(p12) {
  const shrouded = p12.getBags({ bagType: forge.pki.oids.pkcs8ShroudedKeyBag })
  const plain = p12.getBags({ bagType: forge.pki.oids.keyBag })

  return (
    shrouded[forge.pki.oids.pkcs8ShroudedKeyBag]?.[0]?.key ??
    plain[forge.pki.oids.keyBag]?.[0]?.key ??
    null
  )
}

function loadAppleCertificates() {
  const wwdr = toPemCertificate(decodeBase64Env(process.env.APPLE_WWDR_CERT_BASE64))
  const passphrase = process.env.APPLE_PASS_CERT_PASSWORD ?? ''

  if (process.env.APPLE_PASS_SIGNER_CERT_BASE64 && process.env.APPLE_PASS_SIGNER_KEY_BASE64) {
    return {
      wwdr,
      signerCert: toPemCertificate(decodeBase64Env(process.env.APPLE_PASS_SIGNER_CERT_BASE64)),
      signerKey: toPemPrivateKey(decodeBase64Env(process.env.APPLE_PASS_SIGNER_KEY_BASE64)),
      signerKeyPassphrase: passphrase,
    }
  }

  if (process.env.APPLE_PASS_CERT_P12_BASE64) {
    const p12Base64 = String(process.env.APPLE_PASS_CERT_P12_BASE64).replace(/\s+/g, '')
    const p12Der = forge.util.decode64(p12Base64)
    const p12Asn1 = forge.asn1.fromDer(p12Der)
    const p12 = forge.pkcs12.pkcs12FromAsn1(p12Asn1, passphrase)

    const certBags = p12.getBags({ bagType: forge.pki.oids.certBag })
    const cert = certBags[forge.pki.oids.certBag]?.[0]?.cert
    const key = extractPrivateKeyFromP12(p12)

    if (!cert || !key) {
      throw new Error('Certificat Apple P12 invalide ou mot de passe incorrect')
    }

    return {
      wwdr,
      signerCert: Buffer.from(forge.pki.certificateToPem(cert)),
      signerKey: Buffer.from(forge.pki.privateKeyToPem(key)),
      signerKeyPassphrase: passphrase,
    }
  }

  throw new Error('Certificats Apple Wallet non configurés')
}

export async function createAppleWalletPass({ userId, fullName, cardNumber, email }) {
  const certificates = loadAppleCertificates()
  const teamId = process.env.APPLE_TEAM_ID
  const passTypeId = process.env.APPLE_PASS_TYPE_ID
  const masked = maskCardNumber(cardNumber)
  const qrUrl = buildCardQrUrl(userId)

  const pass = new PKPass(
    getPassIconBuffers(),
    certificates,
    {
      formatVersion: 1,
      serialNumber: `gm-${userId}`,
      passTypeIdentifier: passTypeId,
      teamIdentifier: teamId,
      organizationName: 'Guinée Multiservices',
      description: 'Carte multiservice Guinée Multiservices',
      foregroundColor: 'rgb(255, 255, 255)',
      backgroundColor: 'rgb(15, 23, 42)',
      labelColor: 'rgb(148, 163, 184)',
      generic: {
        primaryFields: [
          {
            key: 'holder',
            label: 'TITULAIRE',
            value: fullName,
          },
        ],
        secondaryFields: [
          {
            key: 'card',
            label: 'CARTE',
            value: masked,
          },
        ],
        auxiliaryFields: [
          {
            key: 'service',
            label: 'SERVICE',
            value: 'Carte multiservice',
          },
        ],
        backFields: [
          {
            key: 'email',
            label: 'Email',
            value: email,
          },
          {
            key: 'site',
            label: 'Site web',
            value: getSiteUrl(),
          },
          {
            key: 'help',
            label: 'Support',
            value: 'support@mscarte.com',
          },
          {
            key: 'info',
            label: 'Information',
            value:
              'Présentez le QR code chez les commerçants partenaires ou ouvrez votre espace client pour payer.',
          },
        ],
      },
    }
  )

  pass.setBarcodes({
    format: 'PKBarcodeFormatQR',
    message: qrUrl,
    messageEncoding: 'iso-8859-1',
    altText: masked,
  })

  return pass.getAsBuffer()
}
