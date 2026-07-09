import { getRedis, parseBody, rateLimit, verifyAdminSession, getClientIp } from "../security.js"
import {
  addTreasuryEntry,
  getFinanceSnapshot,
  processMerchantWithdrawalInFinance,
  recordQrSaleInFinance,
  requestAdminWithdrawalInFinance,
  requestMerchantWithdrawalInFinance,
  upsertFinanceMerchant,
} from "../financeStore.js"

export default async function handler(req, res) {
  const redis = getRedis()
  if (!redis) {
    return res.status(503).json({ error: "Finance storage not configured" })
  }

  try {
    if (req.method === "GET") {
      const session = await verifyAdminSession(req, redis)
      if (!session) return res.status(401).json({ error: "Unauthorized" })
      return res.status(200).json(await getFinanceSnapshot(redis))
    }

    if (req.method !== "POST") {
      res.setHeader("Allow", "GET, POST")
      return res.status(405).json({ error: "Method not allowed" })
    }

    const ip = getClientIp(req)
    const allowed = await rateLimit(redis, `rate:finance:${ip}`, 60, 3600)
    if (!allowed) {
      return res.status(429).json({ error: "Too many requests" })
    }

    const body = parseBody(req)
    const action = typeof body.action === "string" ? body.action : ""

    if (action === "record_entry") {
      const { type, amount, label, referenceId } = body
      if (typeof type !== "string" || typeof amount !== "number" || typeof label !== "string") {
        return res.status(400).json({ error: "Invalid treasury payload" })
      }
      const entry = await addTreasuryEntry(redis, type, amount, label, typeof referenceId === "string" ? referenceId : undefined)
      return res.status(200).json({ ok: true, entry })
    }

    if (action === "upsert_merchant") {
      if (!body.merchant || typeof body.merchant !== "object") {
        return res.status(400).json({ error: "Invalid merchant payload" })
      }
      const merchant = await upsertFinanceMerchant(redis, body.merchant)
      return res.status(200).json({ ok: true, merchant })
    }

    if (action === "get_merchant") {
      const merchantId = typeof body.merchantId === "string" ? body.merchantId : ""
      const snapshot = await getFinanceSnapshot(redis)
      const merchant = snapshot.merchants.find((item) => item.id === merchantId) ?? null
      if (!merchant) return res.status(404).json({ error: "Commerçant introuvable" })
      return res.status(200).json({ merchant })
    }

    if (action === "merchant_withdrawal_request") {
      const { merchantId, amount, method, accountNumber } = body
      if (typeof merchantId !== "string" || typeof amount !== "number" || typeof method !== "string") {
        return res.status(400).json({ error: "Invalid withdrawal payload" })
      }
      const result = await requestMerchantWithdrawalInFinance(redis, merchantId, amount, method, accountNumber ?? "")
      if (!result.success) return res.status(400).json(result)
      return res.status(200).json(result)
    }

    if (action === "record_qr_sale") {
      const { merchantId, paymentRequestId, amount, customerName } = body
      if (
        typeof merchantId !== "string" ||
        typeof paymentRequestId !== "string" ||
        typeof amount !== "number" ||
        typeof customerName !== "string"
      ) {
        return res.status(400).json({ error: "Invalid QR sale payload" })
      }
      const result = await recordQrSaleInFinance(redis, {
        merchantId,
        paymentRequestId,
        amount,
        customerName,
      })
      if (!result.success) return res.status(400).json(result)
      return res.status(200).json(result)
    }

    const session = await verifyAdminSession(req, redis)
    if (!session) return res.status(401).json({ error: "Unauthorized" })

    if (action === "admin_withdrawal") {
      const result = await requestAdminWithdrawalInFinance(redis, Number(body.amount), body.method, body.accountNumber ?? "")
      if (!result.success) return res.status(400).json(result)
      return res.status(200).json(result)
    }

    if (action === "merchant_withdrawal_process") {
      const result = await processMerchantWithdrawalInFinance(redis, body.merchantId, body.withdrawalId, body.decision)
      if (!result.success) return res.status(400).json(result)
      return res.status(200).json(result)
    }

    return res.status(400).json({ error: "Unknown finance action" })
  } catch (error) {
    console.error("finance api error", error)
    return res.status(500).json({ error: "Server error" })
  }
}
