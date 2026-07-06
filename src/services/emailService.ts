export interface SimulatedEmail {
  id: string
  to: string
  subject: string
  body: string
  sentAt: string
  type: 'activation_code' | 'card_shipped' | 'welcome_account' | 'password_reminder' | 'transaction_alert' | 'card_blocked' | 'wallet_added' | 'digital_card'
}

const EMAILS_KEY = 'carte-multiservice-emails'

function loadEmails(): SimulatedEmail[] {
  try {
    const stored = localStorage.getItem(EMAILS_KEY)
    if (stored) return JSON.parse(stored) as SimulatedEmail[]
  } catch {
    /* ignore */
  }
  return []
}

function saveEmails(emails: SimulatedEmail[]) {
  localStorage.setItem(EMAILS_KEY, JSON.stringify(emails))
}

function sendEmail(to: string, subject: string, body: string, type: SimulatedEmail['type']) {
  const email: SimulatedEmail = {
    id: crypto.randomUUID(),
    to,
    subject,
    body,
    sentAt: new Date().toISOString(),
    type,
  }
  const emails = loadEmails()
  saveEmails([email, ...emails])
  return email
}

export function sendActivationCodeEmail(
  to: string,
  fullName: string,
  activationCode: string
): SimulatedEmail {
  const subject = 'Votre code d\'activation — Guinée Multiservices'
  const body = `Bonjour ${fullName},

Merci pour votre commande de carte multiservice.

Votre code d'activation est :

  ${activationCode}

Ce code vous sera demandé lors de l'activation de votre carte dans l'application, une fois votre carte physique reçue.

⚠️ Ne partagez ce code avec personne.

Cordialement,
L'équipe Guinée Multiservices`

  return sendEmail(to, subject, body, 'activation_code')
}

export function sendWelcomeAccountEmail(to: string, fullName: string): SimulatedEmail {
  const subject = 'Bienvenue — Votre compte Carte Multiservice'
  const body = `Bonjour ${fullName},

Votre compte client a été créé avec succès lors de la commande de votre carte multiservice.

Vos identifiants de connexion :
  Email : ${to}

Ce compte vous permet de :
  • Suivre votre commande de carte
  • Vous connecter pour activer votre carte à réception
  • Recharger et payer une fois la carte activée

⚠️ Conservez précieusement le mot de passe que vous avez choisi lors de la commande.
Pour des raisons de sécurité, nous ne l'envoyons jamais par email.

Pour vous reconnecter : ouvrez l'application → Connexion → saisissez votre email et mot de passe.

Mot de passe oublié ? Utilisez « Mot de passe oublié » sur la page de connexion.

Cordialement,
L'équipe Guinée Multiservices`

  return sendEmail(to, subject, body, 'welcome_account')
}

export function sendPasswordReminderEmail(to: string, fullName: string): SimulatedEmail {
  const subject = 'Rappel — Connexion Carte Multiservice'
  const body = `Bonjour ${fullName},

Vous avez demandé un rappel pour vous connecter à Carte Multiservice.

Votre identifiant de connexion :
  Email : ${to}

Si vous avez commandé une carte, votre mot de passe est celui que vous avez défini lors de la commande sur /commander-carte.

Nous ne pouvons pas vous renvoyer votre mot de passe par email. Si vous l'avez oublié, contactez le support : support@carte.gn

Cordialement,
L'équipe Guinée Multiservices`

  return sendEmail(to, subject, body, 'password_reminder')
}

export function sendCardShippedEmail(to: string, fullName: string): SimulatedEmail {
  const subject = 'Votre carte est prête — Guinée Multiservices'
  const body = `Bonjour ${fullName},

Bonne nouvelle ! Votre carte multiservice est prête.

Récupérez votre carte selon le mode de livraison choisi, puis activez-la dans l'application avec le code d'activation reçu par email lors de votre commande.

Ouvrez l'application → Activer ma carte → saisissez votre code.

Cordialement,
L'équipe Guinée Multiservices`

  return sendEmail(to, subject, body, 'card_shipped')
}

export function sendTransactionAlertEmail(
  to: string,
  fullName: string,
  label: string,
  amount: number,
  newBalance: number,
  isCredit: boolean
): SimulatedEmail {
  const subject = isCredit
    ? `Recharge +${amount.toLocaleString('fr-GN')} GNF — Guinée Multiservices`
    : `Paiement -${amount.toLocaleString('fr-GN')} GNF — Guinée Multiservices`
  const body = `Bonjour ${fullName},

${isCredit ? 'Recharge effectuée' : 'Paiement effectué'} sur votre carte multiservice.

  Opération : ${label}
  Montant : ${isCredit ? '+' : '-'}${amount.toLocaleString('fr-GN')} GNF
  Nouveau solde : ${newBalance.toLocaleString('fr-GN')} GNF
  Date : ${new Date().toLocaleString('fr-GN')}

Si vous n'êtes pas à l'origine de cette opération, bloquez immédiatement votre carte dans l'application (Sécurité carte).

Cordialement,
L'équipe Guinée Multiservices`

  return sendEmail(to, subject, body, 'transaction_alert')
}

export function sendCardBlockedEmail(to: string, fullName: string): SimulatedEmail {
  const subject = 'Carte bloquée — Guinée Multiservices'
  const body = `Bonjour ${fullName},

Votre carte multiservice a été bloquée suite à votre demande (ou après trop de tentatives PIN incorrectes).

Aucun paiement ni recharge ne pourra être effectué tant que la carte n'est pas débloquée avec votre code PIN dans l'application.

Si vous n'êtes pas à l'origine de ce blocage, contactez immédiatement le support : support@carte.gn

Cordialement,
L'équipe Guinée Multiservices`

  return sendEmail(to, subject, body, 'card_blocked')
}

export function sendWalletAddedEmail(
  to: string,
  fullName: string,
  wallet: 'apple' | 'google'
): SimulatedEmail {
  const walletName = wallet === 'apple' ? 'Apple Wallet' : 'Google Wallet'
  const subject = `Carte ajoutée à ${walletName} — Guinée Multiservices`
  const body = `Bonjour ${fullName},

Votre carte multiservice a été ajoutée à ${walletName} avec succès.

Vous pouvez désormais payer sans contact avec votre téléphone chez les commerçants compatibles.

Si vous n'êtes pas à l'origine de cette action, bloquez immédiatement votre carte dans l'application (Sécurité carte).

Cordialement,
L'équipe Guinée Multiservices`

  return sendEmail(to, subject, body, 'wallet_added')
}

export function sendDigitalCardEmail(
  to: string,
  fullName: string,
  digitalCardNumber: string
): SimulatedEmail {
  const subject = 'Votre carte numérique est prête — Guinée Multiservices'
  const body = `Bonjour ${fullName},

Votre carte numérique multiservice est maintenant active.

  Numéro carte numérique : ${digitalCardNumber}

Vous pouvez dès maintenant :
  • Recharger votre solde
  • Payer chez les commerçants partenaires
  • Ajouter la carte à Apple Wallet ou Google Pay depuis votre profil

Votre carte physique est toujours en préparation. À réception, activez-la avec le QR code et le code email — vous conserverez le même PIN et le même solde.

Cordialement,
L'équipe Guinée Multiservices`

  return sendEmail(to, subject, body, 'digital_card')
}

export function getEmailsForAddress(email: string): SimulatedEmail[] {
  return loadEmails().filter((e) => e.to.toLowerCase() === email.toLowerCase())
}

export function getLatestActivationEmail(email: string): SimulatedEmail | undefined {
  return getEmailsForAddress(email).find((e) => e.type === 'activation_code')
}

export function getLatestWelcomeEmail(email: string): SimulatedEmail | undefined {
  return getEmailsForAddress(email).find((e) => e.type === 'welcome_account')
}
