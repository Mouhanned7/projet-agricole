# VerdOlive

Plateforme qui met en relation investisseurs et porteurs de terrains agricoles en Tunisie.
Référence fonctionnelle : cahier des charges v2 (16/11/2026). Décisions : [docs/DECISIONS.md](docs/DECISIONS.md).

## Stack

Next.js 15 (App Router, TypeScript) · Tailwind CSS 4 · Supabase (PostgreSQL, Auth par e-mail, Storage, RLS) · Vitest.

## Démarrer

```bash
npm install
cp .env.example .env.local   # renseigner les clés Supabase (facultatif pour l'instant)
npm run dev                  # http://localhost:3000
npm test                     # moteur de classement + schéma SQL (Postgres embarqué)
```

Tant que Supabase n'est pas branché, la page d'accueil affiche des terrains de démonstration fictifs.

## Organisation

| Chemin | Contenu |
|---|---|
| `src/lib/domain/ranking.ts` | Moteur de classement (§5) : statut, raisons, preuves, scores, tri « Recommandés ». Source unique, utilisée par le serveur et par la jauge du formulaire. |
| `src/lib/data/` | Référentiel des gouvernorats/délégations et terrains de démonstration. |
| `supabase/migrations/` | Schéma, déclencheurs (preuves réservées à l'admin, doublons de titre, historique des statuts), règles RLS, stockage. |
| `supabase/seed.sql` | Généré par `npm run seed:generate`. |
| `supabase/tests/` | Tests du schéma et de la sécurité (scénarios 11, 18, 19 du §17…). |

## Brancher Supabase

1. Créer un projet sur supabase.com, puis renseigner `.env.local`.
2. `npx supabase link --project-ref <ref>` puis `npx supabase db push`.
3. En local uniquement : charger `supabase/seed.sql`.

Réglages d'authentification (e-mails, Google) : [docs/SUPABASE_SETUP.md](docs/SUPABASE_SETUP.md).
