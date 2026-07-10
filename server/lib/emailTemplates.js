const ADMIN_EMAIL = process.env.ADMIN_EMAIL ?? 'admin@mscarte.com'
const SUPPORT_EMAIL = process.env.EMAIL_REPLY_TO ?? 'support@mscarte.com'

export function getAdminNotificationEmails() {
  const raw =
    process.env.ADMIN_NOTIFICATION_EMAILS ??
    process.env.ADMIN_NOTIFICATION_EMAIL ??
    ADMIN_EMAIL
  const emails = raw
    .split(',')
    .map((value) => value.trim().toLowerCase())
    .filter(Boolean)
  return [...new Set(emails)]
}

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

    case 'pin_reset_code':
      return {
        to: sanitize(data.email, 80),
        subject: 'Réinitialisation de votre code PIN carte',
        text: `Bonjour ${sanitize(data.fullName)},

Vous avez demandé à réinitialiser le code PIN de votre carte multiservice.

Votre code de vérification (valable 15 minutes) :

  ${sanitize(data.resetCode, 8)}

Saisissez ce code dans l'application, section Sécurité carte → PIN oublié.

Si vous n'êtes pas à l'origine de cette demande, ignorez cet email et contactez le support : ${SUPPORT_EMAIL}

Cordialement,
L'équipe Guinée Multiservices`,
      }

    case 'pin_reset_confirmation':
      return {
        to: sanitize(data.email, 80),
        subject: 'Votre code PIN carte a été modifié',
        text: `Bonjour ${sanitize(data.fullName)},

Votre code PIN carte a été réinitialisé avec succès.

Si vous n'êtes pas à l'origine de ce changement, contactez immédiatement le support : ${SUPPORT_EMAIL}

Cordialement,
L'équipe Guinée Multiservices`,
      }

    case 'card_replacement_ordered':
      return {
        to: sanitize(data.email, 80),
        subject: 'Commande de carte de remplacement confirmée',
        text: `Bonjour ${sanitize(data.fullName)},

Votre commande de carte de remplacement a bien été enregistrée.

Montant payé : ${formatGnf(data.amount)} (tarif perte/vol — 50 % du prix initial)

Votre solde reste disponible sur votre compte. Vous recevrez un code d'activation par email pour activer la nouvelle carte à réception.

Cordialement,
L'équipe Guinée Multiservices`,
      }

    case 'order_approved':
      return {
        to: sanitize(data.email, 80),
        subject: 'Commande validée — Guinée Multiservices',
        text: `Bonjour ${sanitize(data.fullName)},

Bonne nouvelle : votre commande de carte a été validée par notre équipe.
Nous préparons votre carte. Vous serez notifié dès qu'elle sera prête.

Cordialement,
L'équipe Guinée Multiservices`,
      }

    case 'order_rejected':
      return {
        to: sanitize(data.email, 80),
        subject: 'Commande refusée — Guinée Multiservices',
        text: `Bonjour ${sanitize(data.fullName)},

Votre commande de carte n'a pas pu être validée.

Motif : ${sanitize(data.reason, 300)}

Pour toute question : ${SUPPORT_EMAIL}

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

    case 'client_login_alert':
      return {
        to: sanitize(data.email, 80),
        subject: 'Nouvelle connexion — Guinée Multiservices',
        text: `Bonjour ${sanitize(data.fullName)},

Une connexion à votre compte a été détectée.

Appareil : ${sanitize(data.userAgent, 120)}
Adresse IP : ${sanitize(data.ip, 45)}
Date : ${sanitize(data.date, 40)}

Si ce n'était pas vous, contactez ${SUPPORT_EMAIL} immédiatement.

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
        to: getAdminNotificationEmails(),
        subject:
          data.orderType === 'replacement'
            ? 'Remplacement carte (perte/vol) — Guinée Multiservices'
            : 'Nouvelle commande client — Guinée Multiservices',
        text: `Bonjour Admin,

${data.orderType === 'replacement' ? 'Commande de remplacement (perte/vol déclarée).' : 'Nouvelle commande enregistrée.'}

  Client : ${sanitize(data.customerName)}
  Email : ${sanitize(data.customerEmail, 80)}
  Montant : ${formatGnf(data.amount)}
  Livraison : ${sanitize(data.deliveryMethod)}
  Référence : ${sanitize(data.orderId, 40)}

Connectez-vous au portail admin pour valider la commande.

Cordialement,
Système Guinée Multiservices`,
      }

    case 'admin_merchant_notification':
      return {
        to: getAdminNotificationEmails(),
        subject: sanitize(data.subject, 120) || 'Notification commerçant',
        text: sanitize(data.body, 4000),
      }

    case 'admin_withdrawal_notification':
      return {
        to: getAdminNotificationEmails(),
        subject: sanitize(data.subject, 120) || 'Notification retrait',
        text: sanitize(data.body, 4000),
      }

    case 'application_received':
      return {
        to: sanitize(data.email, 80),
        subject: 'Candidature reçue — Guinée Multiservices',
        text: `Bonjour ${sanitize(data.fullName)},

Nous avons bien reçu votre candidature pour le poste :
  ${sanitize(data.jobTitle, 120)}

Notre équipe RH examinera votre profil et vous contactera si votre candidature est retenue.

Cordialement,
L'équipe Guinée Multiservices`,
      }

    case 'admin_application_notification':
      return {
        to: getAdminNotificationEmails(),
        subject: 'Nouvelle candidature — Guinée Multiservices',
        text: `Bonjour Admin,

Une nouvelle candidature a été reçue.

  Poste : ${sanitize(data.jobTitle, 120)}
  Candidat : ${sanitize(data.candidateName)}
  Email : ${sanitize(data.candidateEmail, 80)}
  Référence : ${sanitize(data.applicationId, 40)}

Connectez-vous au portail admin pour consulter la candidature.

Cordialement,
Système Guinée Multiservices`,
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
  'client_login_alert',
  'wallet_added',
  'digital_card',
  'card_activated',
  'merchant_welcome',
  'merchant_category_added',
  'merchant_sale',
  'merchant_withdrawal_requested',
  'merchant_withdrawal_processed',
  'admin_order_notification',
  'order_approved',
  'order_rejected',
  'admin_merchant_notification',
  'admin_withdrawal_notification',
])
