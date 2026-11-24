# Configuration Supabase (Sprint 1 : inscription)

À faire une fois, dans le tableau de bord Supabase du projet.

## 1. Clés

Dans `.env.local` (voir `.env.example`) :

- `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY` : Settings > API.
- `SUPABASE_SERVICE_ROLE_KEY` : Settings > API. **Serveur uniquement.** Sert à marquer l'e-mail comme vérifié et à recalculer le classement.
- `NEXT_PUBLIC_SITE_URL` : URL publique du site (ex. `https://verdolive.tn`), utilisée dans les liens envoyés par e-mail.

## 2. Authentication > Providers > Email

- **Enable Email provider** : activé.
- **Confirm email** : **désactivé**. L'utilisateur commence tout de suite (INS-05) ; la confirmation de l'adresse est suivie par VerdOlive dans `profiles.email_verified_at` et exigée avant le premier contact ou la première soumission (D7).
- **Minimum password length** : 8.

## 3. Authentication > URL Configuration

- **Site URL** : la même valeur que `NEXT_PUBLIC_SITE_URL`.
- **Redirect URLs** : ajouter `https://<votre-domaine>/auth/**` et `http://localhost:3000/auth/**`.

## 4. Authentication > Email Templates

Les liens pointent vers `/auth/confirm` avec un `token_hash`, ce qui fonctionne même si l'e-mail est ouvert sur un autre appareil.

**Magic Link** (sert à la fois à confirmer l'adresse et à se connecter sans mot de passe) :

- Sujet : `Votre lien VerdOlive`
- Corps :

```html
<h2>Bonjour,</h2>
<p>Cliquez sur ce lien pour confirmer votre adresse et vous connecter à VerdOlive :</p>
<p><a href="{{ .RedirectTo }}&token_hash={{ .TokenHash }}&type=magiclink">Confirmer et me connecter</a></p>
<p>Ce lien est valable une heure et ne sert qu'une fois. Si vous n'êtes pas à l'origine de cette demande, ignorez ce message.</p>
```

**Reset Password** :

- Sujet : `Réinitialisez votre mot de passe VerdOlive`
- Corps :

```html
<h2>Bonjour,</h2>
<p>Pour choisir un nouveau mot de passe, cliquez sur ce lien :</p>
<p><a href="{{ .RedirectTo }}&token_hash={{ .TokenHash }}&type=recovery">Choisir un nouveau mot de passe</a></p>
<p>Si vous n'êtes pas à l'origine de cette demande, ignorez ce message : votre mot de passe reste inchangé.</p>
```

## 5. Authentication > Providers > Google (facultatif, INS-04)

1. Google Cloud Console : créer un identifiant OAuth « Application Web ».
2. URI de redirection autorisée : `https://<ref>.supabase.co/auth/v1/callback`.
3. Coller le Client ID et le Client Secret dans Supabase.

Tant que Google n'est pas configuré, le bouton renvoie vers une page d'erreur explicite.

## 6. Envoi des e-mails

Le service d'e-mail intégré de Supabase est limité (quelques e-mails par heure) : suffisant pour tester, pas pour la production. Avant le lancement, configurer un SMTP (Authentication > SMTP Settings), par exemple Brevo, Resend ou Amazon SES.

## 7. Base de données

```bash
npx supabase link --project-ref <ref>
npx supabase db push
```

Créer le premier administrateur (SQL Editor), après son inscription :

```sql
update profiles set roles = array_append(roles, 'admin') where id = (select id from auth.users where email = 'admin@verdolive.tn');
```
