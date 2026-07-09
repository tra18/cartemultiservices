import forge from 'node-forge'
import { PKPass } from 'passkit-generator'
import { getPassIconBuffers } from './walletAssets.js'
import { isAppleWalletConfigured } from './walletCommon.js'

function decodeBase64Env(value) {
  const cleaned = String(value ?? '').replace(/\s+/g, '')
  if (!cleaned) return { buffer: Buffer.alloc(0), cleanedLength: 0 }
  return { buffer: Buffer.from(cleaned, 'base64'), cleanedLength: cleaned.length }
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

function extractPrivateKeyFromP12(p12) {
  const shrouded = p12.getBags({ bagType: forge.pki.oids.pkcs8ShroudedKeyBag })
  const plain = p12.getBags({ bagType: forge.pki.oids.keyBag })

  return (
    shrouded[forge.pki.oids.pkcs8ShroudedKeyBag]?.[0]?.key ??
    plain[forge.pki.oids.keyBag]?.[0]?.key ??
    null
  )
}

function loadCertificatesForDiagnostics() {
  const wwdrDecoded = decodeBase64Env(process.env.APPLE_WWDR_CERT_BASE64)
  if (!wwdrDecoded.cleanedLength) {
    throw new Error('APPLE_WWDR_CERT_BASE64 est vide')
  }

  const wwdr = toPemCertificate(wwdrDecoded.buffer)
  const passphrase = process.env.APPLE_PASS_CERT_PASSWORD ?? ''

  if (process.env.APPLE_PASS_SIGNER_CERT_BASE64 && process.env.APPLE_PASS_SIGNER_KEY_BASE64) {
    return {
      wwdr,
      signerCert: toPemCertificate(decodeBase64Env(process.env.APPLE_PASS_SIGNER_CERT_BASE64).buffer),
      signerKey: decodeBase64Env(process.env.APPLE_PASS_SIGNER_KEY_BASE64).buffer,
      signerKeyPassphrase: passphrase,
    }
  }

  const p12Decoded = decodeBase64Env(process.env.APPLE_PASS_CERT_P12_BASE64)
  if (!p12Decoded.cleanedLength) {
    throw new Error('APPLE_PASS_CERT_P12_BASE64 est vide')
  }

  const p12Der = p12Decoded.buffer.toString('binary')
  const p12Asn1 = forge.asn1.fromDer(p12Der)
  const p12 = forge.pkcs12.pkcs12FromAsn1(p12Asn1, passphrase)

  const certBags = p12.getBags({ bagType: forge.pki.oids.certBag })
  const cert = certBags[forge.pki.oids.certBag]?.[0]?.cert
  const key = extractPrivateKeyFromP12(p12)

  if (!cert || !key) {
    throw new Error('P12 illisible sur le serveur (certificat ou clé manquants, ou mot de passe incorrect)')
  }

  return {
    wwdr,
    signerCert: Buffer.from(forge.pki.certificateToPem(cert)),
    signerKey: Buffer.from(forge.pki.privateKeyToPem(key)),
    signerKeyPassphrase: passphrase,
  }
}

export function diagnoseAppleWalletConfig() {
  const report = {
    configured: isAppleWalletConfigured(),
    teamIdLength: String(process.env.APPLE_TEAM_ID ?? '').length,
    passTypeId: process.env.APPLE_PASS_TYPE_ID ?? '',
    p12Base64Length: String(process.env.APPLE_PASS_CERT_P12_BASE64 ?? '').replace(/\s+/g, '').length,
    wwdrBase64Length: String(process.env.APPLE_WWDR_CERT_BASE64 ?? '').replace(/\s+/g, '').length,
    steps: [],
    ok: false,
  }

  if (!report.configured) {
    report.steps.push({ step: 'env', ok: false, message: 'Variables Apple incomplètes' })
    return report
  }

  report.steps.push({ step: 'env', ok: true, message: 'Variables présentes' })

  if (report.teamIdLength !== 10) {
    report.steps.push({
      step: 'teamId',
      ok: false,
      message: `APPLE_TEAM_ID doit faire 10 caractères (actuel: ${report.teamIdLength})`,
    })
    return report
  }
  report.steps.push({ step: 'teamId', ok: true, message: 'Team ID longueur OK' })

  if (!report.passTypeId.startsWith('pass.')) {
    report.steps.push({
      step: 'passTypeId',
      ok: false,
      message: 'APPLE_PASS_TYPE_ID doit commencer par pass.',
    })
    return report
  }
  report.steps.push({ step: 'passTypeId', ok: true, message: 'Pass Type ID format OK' })

  if (report.p12Base64Length < 500) {
    report.steps.push({
      step: 'p12',
      ok: false,
      message: `P12 base64 trop court (${report.p12Base64Length} car.) — probablement tronqué dans Vercel`,
    })
    return report
  }

  if (report.wwdrBase64Length < 500) {
    report.steps.push({
      step: 'wwdr',
      ok: false,
      message: `WWDR base64 trop court (${report.wwdrBase64Length} car.) — fichier AppleWWDRCAG4.cer manquant ou mal encodé`,
    })
    return report
  }

  let certificates
  try {
    certificates = loadCertificatesForDiagnostics()
    report.steps.push({ step: 'certificates', ok: true, message: 'Certificats P12 et WWDR lisibles' })
  } catch (error) {
    report.steps.push({
      step: 'certificates',
      ok: false,
      message: error instanceof Error ? error.message : 'Erreur lecture certificats',
    })
    return report
  }

  try {
    const pass = new PKPass(
      getPassIconBuffers(),
      certificates,
      {
        formatVersion: 1,
        serialNumber: 'diag-test',
        passTypeIdentifier: process.env.APPLE_PASS_TYPE_ID,
        teamIdentifier: process.env.APPLE_TEAM_ID,
        organizationName: 'Guinée Multiservices',
        description: 'Diagnostic',
      }
    )
    pass.type = 'generic'
    pass.primaryFields.push({ key: 'test', label: 'TEST', value: 'OK' })
    const buffer = pass.getAsBuffer()
    report.steps.push({
      step: 'pass',
      ok: true,
      message: `Pass généré (${buffer.length} octets)`,
    })
    report.ok = true
  } catch (error) {
    report.steps.push({
      step: 'pass',
      ok: false,
      message: error instanceof Error ? error.message : 'Échec génération pass',
    })
  }

  return report
}

export function getAppleWalletErrorMessage(error) {
  const message = error instanceof Error ? error.message : String(error ?? '')

  if (message.includes('P12 illisible') || message.includes('mot de passe incorrect')) {
    return message
  }
  if (message.includes('APPLE_WWDR_CERT_BASE64') || message.includes('WWDR')) {
    return 'Certificat WWDR invalide. Téléchargez AppleWWDRCAG4.cer et réencodez-le en base64.'
  }
  if (message.includes('APPLE_PASS_CERT_P12_BASE64')) {
    return 'Certificat P12 invalide ou tronqué dans Vercel. Réencodez le fichier .p12 complet.'
  }
  if (message.includes('Invalid PEM') || message.includes('certificateFromPem')) {
    return 'Format de certificat invalide (PEM/DER). Vérifiez WWDR et P12.'
  }
  if (message.includes('passTypeIdentifier') || message.includes('teamIdentifier')) {
    return 'APPLE_TEAM_ID ou APPLE_PASS_TYPE_ID incorrect.'
  }

  return message || 'Impossible de générer le pass wallet. Vérifiez la configuration des certificats.'
}
