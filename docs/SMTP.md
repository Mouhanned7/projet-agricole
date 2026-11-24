# E-mails par SMTP (confirmation d'adresse et notifications)

VerdOlive envoie deux sortes d'e-mails, avec **les mêmes identifiants SMTP** :

| E-mail | Envoyé par | Où configurer le SMTP |
|---|---|---|
| Lien de confirmation d'adresse et de connexion, réinitialisation du mot de passe | Supabase Auth | Supabase > Authentication > **SMTP Settings** |
| Notifications (statut du dossier, réponse à un signalement) | Le site (Next.js) | `.env.local` et Vercel > Settings > Environment Variables |

## 1. Choisir un fournisseur SMTP

| Fournisseur | Offre gratuite | Hôte | Port |
|---|---|---|---|
| **Brevo** (recommandé) | 300 e-mails/jour | `smtp-relay.brevo.com` | 587 |
| Gmail / Google Workspace | ~500/jour, avec un « mot de passe d'application » | `smtp.gmail.com` | 465 |
| Zoho Mail | selon l'offre | `smtp.zoho.eu` | 465 |
| Amazon SES | 0,10 $ / 1 000 | `email-smtp.eu-west-3.amazonaws.com` | 587 |

Pour une bonne délivrabilité, vérifiez votre **nom de domaine** chez le fournisseur (enregistrements SPF et DKIM dans votre DNS) et envoyez depuis une adresse de ce domaine, par exemple `no-reply@verdolive.tn`.

## 2. Supabase : e-mails de confirmation

Supabase > **Authentication > Emails > SMTP Settings** > activer **Enable custom SMTP** :

- Sender email : `no-reply@votre-domaine.tn` ; Sender name : `VerdOlive`
- Host, Port, Username, Password : ceux du fournisseur
- **Rate limits** (Authentication > Rate Limits) : passer « Emails sent per hour » de 2 à 100 ou plus.

Le parcours reste celui de la décision D7 : l'utilisateur commence tout de suite, reçoit un lien « Confirmer et me connecter » (modèle **Magic Link**, voir `SUPABASE_SETUP.md`), et la confirmation est exigée avant le premier contact ou la soumission d'un terrain. Gardez **Confirm email** désactivé.

## 3. Le site : notifications

Dans `.env.local` (développement) **et** dans Vercel (production), avec les mêmes valeurs :

```bash
SMTP_HOST=smtp-relay.brevo.com
SMTP_PORT=587
SMTP_USER=<identifiant SMTP>
SMTP_PASS=<clé SMTP, secrète>
EMAIL_FROM="VerdOlive <no-reply@votre-domaine.tn>"
```

Vérifier la connexion (n'envoie aucun e-mail, n'affiche aucun mot de passe) :

```bash
npm run check:smtp
```

Sans SMTP, les notifications restent visibles dans l'application (cloche), sans e-mail.
