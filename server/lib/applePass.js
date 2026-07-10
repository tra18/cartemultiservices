import forge from 'node-forge'
import { PKPass } from 'passkit-generator'
import { getPassIconBuffers } from './walletAssets.js'
import { buildWalletPayQrUrl, getSiteUrl, maskCardNumber } from './walletCommon.js'

function decodeBase64Env(value) {
  const cleaned = String(value ?? '').replace(/\s+/g, '')
  if (!cleaned) return Buffer.alloc(0)
  const buffer = Buffer.from(cleaned, 'base64')
  if (!buffer.length) {
    throw new Error('Base64 invalide ou vide après décodage')
  }
  return buffer
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
  const wwdrDecoded = decodeBase64Env(process.env.APPLE_WWDR_CERT_BASE64)
  if (!wwdrDecoded.length) {
    throw new Error('APPLE_WWDR_CERT_BASE64 est vide')
  }

  const wwdr = toPemCertificate(wwdrDecoded)
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
    const p12Buffer = decodeBase64Env(process.env.APPLE_PASS_CERT_P12_BASE64)
    if (!p12Buffer.length) {
      throw new Error('APPLE_PASS_CERT_P12_BASE64 est vide')
    }

    const p12Asn1 = forge.asn1.fromDer(p12Buffer.toString('binary'))
    const p12 = forge.pkcs12.pkcs12FromAsn1(p12Asn1, passphrase)

    const certBags = p12.getBags({ bagType: forge.pki.oids.certBag })
    const cert = certBags[forge.pki.oids.certBag]?.[0]?.cert
    const key = extractPrivateKeyFromP12(p12)

    if (!cert || !key) {
      throw new Error(
        'P12 illisible sur le serveur (certificat ou clé manquants, ou mot de passe incorrect)'
      )
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

export async function createAppleWalletPass({ userId, fullName, cardNumber, email, walletPayToken }) {
  const certificates = loadAppleCertificates()
  const teamId = process.env.APPLE_TEAM_ID
  const passTypeId = process.env.APPLE_PASS_TYPE_ID
  const masked = maskCardNumber(cardNumber)
  const qrUrl = buildWalletPayQrUrl(walletPayToken)

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
    }
  )

  pass.type = 'generic'
  pass.primaryFields.push({
    key: 'holder',
    label: 'TITULAIRE',
    value: fullName,
  })
  pass.secondaryFields.push({
    key: 'card',
    label: 'CARTE',
    value: masked,
  })
  pass.auxiliaryFields.push({
    key: 'service',
    label: 'SERVICE',
    value: 'Carte multiservice',
  })
  pass.backFields.push(
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
        'Présentez ce QR code au commerçant pour payer. Il le scanne, vous confirmez avec votre code PIN dans l\'application.',
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
