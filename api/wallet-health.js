import { diagnoseAppleWalletConfig } from './_lib/applePassDiagnostics.js'

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET')
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const report = diagnoseAppleWalletConfig()
  return res.status(report.ok ? 200 : 500).json(report)
}
