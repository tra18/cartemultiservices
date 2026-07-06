# Carte Multiservice — Guinée

Application web pour recharger et utiliser une carte multiservice en **francs guinéens (GNF)**.

## Espaces

### Client (`/connexion`)
- Recharge (Orange Money, Mobile Money, Visa, Mastercard)
- Paiement manuel ou **par QR Code**
- Scanner le QR code d'un commerçant

### Commerçant (`/commercant/connexion`)
- Tableau de bord des ventes et du solde
- **Encaissement par QR Code** (génération du code pour le client)
- **Demandes de retrait** vers Orange Money, Mobile Money ou banque
- Historique des ventes

## Comptes démo

**Client**
- Email : `demo@carte.gn`
- Mot de passe : `demo123`

**Commerçants**
- Prodimar : `prodimar@carte.gn` / `demo123`
- Riviera Restaurant : `riviera@carte.gn` / `demo123`

## Tester un paiement QR

1. Ouvrez `/commercant/connexion` et connectez-vous (ex. Prodimar)
2. Allez dans **Encaisser** → saisissez un montant → générez le QR
3. Dans un autre onglet, connectez-vous en client (`demo@carte.gn`)
4. Allez dans **Scanner** ou ouvrez le lien du QR
5. Confirmez le paiement → le solde commerçant est crédité

## Démarrage

```bash
npm install
npm run dev
```

## Mise en ligne

Application **statique** (React/Vite). Hébergement gratuit possible sur Vercel ou Netlify (HTTPS inclus — requis pour le scan QR).

### Vercel (recommandé)

1. Créez un dépôt GitHub et poussez le projet
2. [vercel.com](https://vercel.com) → **Import Project** → sélectionnez le repo
3. Build : `npm run build` · Dossier : `dist` (détecté automatiquement)
4. Déployez → URL du type `https://carte-multiservice.vercel.app`

Ou en CLI :

```bash
npm i -g vercel
npm run build
vercel --prod
```

### Netlify

1. [netlify.com](https://netlify.com) → **Add new site** → Import Git
2. Le fichier `netlify.toml` configure build et redirections SPA

### Limites actuelles (démo)

- Données en **localStorage** (par navigateur, pas de vraie base)
- Pas d’emails/SMS réels ni paiement Orange Money en production
- Pour un lancement réel : backend + base de données + API paiement

## Technologies

- React + TypeScript + Vite + Tailwind CSS
- qrcode.react (génération QR)
- html5-qrcode (scan caméra)
