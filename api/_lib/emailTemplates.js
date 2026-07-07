const ADMIN_EMAIL = process.env.ADMIN_EMAIL ?? 'admin@mscarte.com'
const SUPPORT_EMAIL = process.env.EMAIL_REPLY_TO ?? 'support@mscarte.com'

function formatGnf(amount) {
  const value = Number(amount)
  if (!Number.isFinite(value)) return '0 GNF'
  return `${value.toLocaleString('fr-GN')} GNF`
}

function sanitize(value, max = 120) {
  if (typeof value !== 'string') return ''
  return value.replace(/[<>"'`]/g, '').trim().slice(0, max)
}

export function buildEmail(type, data = {}) {
  switch (type) {
    case 'activation_code':
      return {
        to: sanitize(data.email, 80),
        subject: "Votre code d'activation — Guinée Multiservices",
        text: `Bonjour ${sanitize(data.fullName)},

Merci pour votre commande de carte multiservice.

Votre code d'activation est :

  ${sanitize(data.activationCode, 32)}

Ce code vous sera demandé lors de l'activation de votre carte dans l'application, une fois votre carte physique reçue.

⚠️ Ne partagez ce code avec personne.

Cordialement,
L'équipe Guinée Multiservices`,
      }

    case 'welcome_account':
      return {
        to: sanitize(data.email, 80),
        subject: 'Bienvenue — Votre compte Carte Multiservice',
        text: `Bonjour ${sanitize(data.fullName)},

Votre compte client a été créé avec succès lors de la commande de votre carte multiservice.

Vos identifiants de connexion :
  Email : ${sanitize(data.email, 80)}

Cordialement,
L'équipe Guinée Multiservices`,
      }

    case 'password_reminder':
      return {
        to: sanitize(data.email, 80),
        subject: 'Rappel — Connexion Carte Multiservice',
        text: `Bonjour ${sanitize(data.fullName)},

Votre identifiant de connexion :
  Email : ${sanitize(data.email, 80)}

Si vous avez commandé une carte, votre mot de passe est celui défini lors de la commande.

Contactez le support : ${SUPPORT_EMAIL}

Cordialement,
L'équipe Guinée Multiservices`,
      }

    case 'card_shipped':
      return {
        to: sanitize(data.email, 80),
        subject: 'Votre carte est prête — Guinée Multiservices',
        text: `Bonjour ${sanitize(data.fullName)},

Votre carte multiservice est prête. Activez-la dans l'application avec le code reçu par email.

Cordialement,
L'équipe Guinée Multiservices`,
      }

    case 'transaction_alert':
      return {
        to: sanitize(data.email, 80),
        subject: data.isCredit
          ? `Recharge +${formatGnf(data.amount)} — Guinée Multiservices`
          : `Paiement -${formatGnf(data.amount)} — Guinée Multiservices`,
        text: `Bonjour ${sanitize(data.fullName)},

${data.isCredit ? 'Recharge effectuée' : 'Paiement effectué'}.

  Opération : ${sanitize(data.label)}
  Montant : ${data.isCredit ? '+' : '-'}${formatGnf(data.amount)}
  Nouveau solde : ${formatGnf(data.newBalance)}

Cordialement,
L'équipe Guinée Multiservices`,
      }

    case 'card_blocked':
      return {
        to: sanitize(data.email, 80),
        subject: 'Carte bloquée — Guinée Multiservices',
        text: `Bonjour ${sanitize(data.fullName)},

Votre carte a été bloquée. Contactez le support : ${SUPPORT_EMAIL}

Cordialement,
L'équipe Guinée Multiservices`,
      }

    case 'wallet_added': {
      const walletName = data.wallet === 'apple' ? 'Apple Wallet' : 'Google Wallet'
      return {
        to: sanitize(data.email, 80),
        subject: `Carte ajoutée à ${walletName} — Guinée Multiservices`,
        text: `Bonjour ${sanitize(data.fullName)},

Votre carte a été ajoutée à ${walletName}.

Cordialement,
L'équipe Guinée Multiservices`,
      }
    }

    case 'digital_card':
      return {
        to: sanitize(data.email, 80),
        subject: 'Votre carte numérique est prête — Guinée Multiservices',
        text: `Bonjour ${sanitize(data.fullName)},

Votre carte numérique est active : ${sanitize(data.digitalCardNumber, 32)}

Cordialement,
L'équipe Guinée Multiservices`,
      }

    case 'card_activated':
      return {
        to: sanitize(data.email, 80),
        subject: 'Votre carte est activée — Guinée Multiservices',
        text: `Bonjour ${sanitize(data.fullName)},

Votre carte est activée : ${sanitize(data.cardNumber, 32)}

Cordialement,
L'équipe Guinée Multiservices`,
      }

    case 'merchant_welcome':
      return {
        to: sanitize(data.email, 80),
        subject: 'Bienvenue sur l’espace commerçant — Guinée Multiservices',
        text: `Bonjour ${sanitize(data.businessName)},

Votre compte commerçant a été créé.

Cordialement,
L'équipe Guinée Multiservices`,
      }

    case 'merchant_category_added':
      return {
        to: sanitize(data.email, 80),
        subject: 'Nouvelle catégorie activée — Guinée Multiservices',
        text: `Bonjour ${sanitize(data.businessName)},

Catégorie : ${sanitize(data.categoryLabel)}
Montant : ${formatGnf(data.amount)}

Cordialement,
L'équipe Guinée Multiservices`,
      }

    case 'merchant_sale':
      return {
        to: sanitize(data.email, 80),
        subject: `Paiement reçu +${formatGnf(data.amount)} — Guinée Multiservices`,
        text: `Bonjour ${sanitize(data.businessName)},

Client : ${sanitize(data.customerName)}
Montant : +${formatGnf(data.amount)}
Nouveau solde : ${formatGnf(data.newBalance)}

Cordialement,
L'équipe Guinée Multiservices`,
      }

    case 'merchant_withdrawal_requested':
      return {
        to: sanitize(data.email, 80),
        subject: 'Demande de retrait enregistrée — Guinée Multiservices',
        text: `Bonjour ${sanitize(data.businessName)},

Montant : ${formatGnf(data.amount)}
Méthode : ${sanitize(data.methodLabel)}
Destination : ${sanitize(data.accountNumber, 40)}

Cordialement,
L'équipe Guinée Multiservices`,
      }

    case 'merchant_withdrawal_processed': {
      const approved = data.status === 'completed'
      return {
        to: sanitize(data.email, 80),
        subject: approved
          ? 'Retrait commerçant validé — Guinée Multiservices'
          : 'Retrait commerçant refusé — Guinée Multiservices',
        text: `Bonjour ${sanitize(data.businessName)},

Montant : ${formatGnf(data.amount)}
Statut : ${approved ? 'versé' : 'refusé'}

Cordialement,
L'équipe Guinée Multiservices`,
      }
    }

    case 'admin_order_notification':
      return {
        to: ADMIN_EMAIL,
        subject: 'Nouvelle commande client — Guinée Multiservices',
        text: `Bonjour Admin,

Nouvelle commande enregistrée.

  Client : ${sanitize(data.customerName)}
  Email : ${sanitize(data.customerEmail, 80)}
  Montant : ${formatGnf(data.amount)}
  Livraison : ${sanitize(data.deliveryMethod)}

Cordialement,
Système Guinée Multiservices`,
      }

    case 'admin_merchant_notification':
      return {
        to: ADMIN_EMAIL,
        subject: sanitize(data.subject, 120) || 'Notification commerçant',
        text: sanitize(data.body, 4000),
      }

    case 'admin_withdrawal_notification':
      return {
        to: ADMIN_EMAIL,
        subject: sanitize(data.subject, 120) || 'Notification retrait',
        text: sanitize(data.body, 4000),
      }

    default:
      return null
  }
}

export const ALLOWED_EMAIL_TYPES = new Set([
  'activation_code',
  'welcome_account',
  'password_reminder',
  'card_shipped',
  'transaction_alert',
  'card_blocked',
  'wallet_added',
  'digital_card',
  'card_activated',
  'merchant_welcome',
  'merchant_category_added',
  'merchant_sale',
  'merchant_withdrawal_requested',
  'merchant_withdrawal_processed',
  'admin_order_notification',
  'admin_merchant_notification',
  'admin_withdrawal_notification',
])
