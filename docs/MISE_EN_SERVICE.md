# Mise en service : comptes, clés et scripts SQL

## Comptes à créer

| Service | Quand | Pour quoi | Coût |
|---|---|---|---|
| **Supabase** | Maintenant | Base de données, comptes, fichiers | Gratuit au départ, puis 25 $/mois (Pro, sauvegardes quotidiennes) |
| **Fournisseur d'e-mails** (Brevo ou Resend) | Avant l'ouverture au public | Envoi des liens de vérification et de connexion | Gratuit jusqu'à ~300 e-mails/jour (Brevo) |
| **Google Cloud** (OAuth) | Facultatif | Bouton « Continuer avec Google » | Gratuit |
| **GitHub** | Avant la mise en ligne | Héberger le code source | Gratuit |
| **Vercel** | Sprint 6 (mise en ligne) | Héberger le site | Gratuit, puis 20 $/mois (Pro, usage commercial) |
| **MapTiler** | Sprint 4 (carte) | Fond de carte de la Tunisie | Gratuit jusqu'à 100 000 affichages/mois |
| **Nom de domaine** (ex. verdolive.tn) | Avant la mise en ligne | Adresse du site et des e-mails | ~30 à 60 DT/an |

Sans compte ni clé : Open-Meteo (climat) et SoilGrids (sol), utilisés en phase 2.

## Supabase, étape par étape

1. Créer un compte sur supabase.com, puis **New project** :
   - Nom : `verdolive` ; région : **Central EU (Frankfurt)** ou **West EU (Paris)** (les plus proches de la Tunisie).
   - Conserver le **mot de passe de la base** dans un gestionnaire de mots de passe.
2. **SQL Editor > New query**, coller puis exécuter, dans l'ordre :
   1. `supabase/setup/1_schema_complet.sql` : tables, sécurité, stockage, gouvernorats (obligatoire).
   2. `supabase/setup/2_demo_facultatif.sql` : 7 terrains fictifs pour tester le catalogue (facultatif, **pas en production**).
3. Appliquer les réglages de [SUPABASE_SETUP.md](SUPABASE_SETUP.md) : « Confirm email » désactivé, URL du site, modèles d'e-mail.
4. Créer le fichier `.env.local` à la racine du projet (voir ci-dessous).
5. Vous inscrire sur le site, puis exécuter `supabase/setup/3_premier_admin.sql` avec votre adresse.

## Fichier `.env.local`

Valeurs dans Supabase > **Project Settings > API** :

```bash
NEXT_PUBLIC_SUPABASE_URL=https://<ref>.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<clé anon public>
SUPABASE_SERVICE_ROLE_KEY=<clé service_role, secrète>
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

La clé `service_role` donne un accès complet à la base : ne jamais la coller dans un chat, un e-mail ou un dépôt Git. Le fichier `.env.local` est ignoré par Git.

## Ce qui ne passe pas par le développeur

- Identifiants Google OAuth et SMTP : à saisir directement dans Supabase > Authentication.
- Mot de passe de la base de données : uniquement pour vous.
