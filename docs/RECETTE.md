# Recette : critères de réception (cahier des charges §17)

Chaque scénario est couvert par un test automatique (`npm test`) et/ou une vérification manuelle sur le site.
Légende : ✅ automatisé · 👤 à vérifier à la main avec Supabase configuré.

| N° | Scénario | Couverture | Où |
|---|---|---|---|
| 1 | Compte investisseur en moins d'une minute, 4 champs, arrivée sur le catalogue | ✅ validation et redirection · 👤 parcours réel | `src/lib/validation/auth.test.ts` |
| 2 | Compte porteur, assistant, formulaire d'étape 6 selon l'objectif | ✅ redirection · 👤 parcours réel | `auth.test.ts`, `/espace-porteur/terrains/nouveau` |
| 3 | Titre = Oui : numéro obligatoire, soumission bloquée s'il est vide | ✅ | `src/lib/domain/ranking.test.ts` |
| 4 | Titre = Non : « autre document » demandé, pas de numéro | ✅ | `ranking.test.ts` |
| 5 | Eau = Oui : source et disponibilité obligatoires, débit facultatif | ✅ | `ranking.test.ts` |
| 6 | Eau = Non : « source à proximité ? » demandée | ✅ | `ranking.test.ts` |
| 7 | Quitter à l'étape 4 et reprendre avec toutes les réponses | ✅ enregistrement/relecture SQL · 👤 sur un 2e appareil | `supabase/tests/schema.test.ts`, `src/lib/lands/draft.test.ts` |
| 8 | Ordre « Recommandés » : titre+eau, puis un seul, puis aucun (masqué) | ✅ | `ranking.test.ts`, `src/lib/catalog/filters.test.ts` |
| 9 | Filtres « Avec titre » ET « Avec eau » : compteur exact | ✅ | `filters.test.ts` |
| 10 | Numéro saisi sans contrôle → « Titre déclaré », jamais « vérifié » | ✅ (code + base de données) | `ranking.test.ts`, `schema.test.ts` |
| 11 | Même numéro de titre sur deux terrains → alerte admin | ✅ | `schema.test.ts` |
| 12 | L'admin vérifie, valide ou refuse : statut changé, journalisé, porteur notifié | ✅ base · 👤 écran admin | `schema.test.ts`, `/admin/terrains/[id]` |
| 13 | Terrain publié retrouvé par les filtres | ✅ logique · 👤 après publication réelle | `filters.test.ts` |
| 14 | Fiche, favori, demande de visite visible par le porteur et l'admin | ✅ base · 👤 écran | `schema.test.ts`, `/terrains/[id]`, `/espace-porteur/visites` |
| 15 | Scores juridique, hydrique, agricole et complétude affichés séparément | 👤 | fiche, rubrique « Indicateurs » |
| 16 | Diagnostic : mesuré, estimé, vérifié distingués | ⏳ phase 2 (GeoAI). Aujourd'hui : débit « mesuré / estimé », salinité « déclarée » | fiche, rubrique Eau |
| 17 | Rapport PDF | ⏳ phase 2 | — |
| 18 | Document foncier d'un autre propriétaire : accès refusé | ✅ | `schema.test.ts` |
| 19 | Visite sans charte : la charte s'affiche, envoi après acceptation | ✅ base · 👤 écran | `schema.test.ts`, fenêtre « Demander une visite » |
| 20 | Indivision : case « tous les indivisaires sont d'accord » obligatoire | ✅ | `ranking.test.ts` |
| 21 | Eau partagée : précisions demandées, mention sur la fiche (rubrique C) | ✅ | `ranking.test.ts`, `schema.test.ts` |
| 22 | « Signaler un problème » : ticket, accusé de réception, file admin | ✅ base · 👤 écran | `schema.test.ts`, `/admin/signalements` |
| 23 | Partenariat Mgharsa : contributions, répartition, frais VerdOlive | 👤 | fiche, rubrique « Conditions proposées » |

## Parcours manuel conseillé (30 minutes)

1. Créer un compte **porteur**, confirmer l'e-mail, remplir l'assistant (titre Oui, eau Oui, une photo), quitter à l'étape 4 puis reprendre.
2. Soumettre. Avec le compte **admin** : `/admin`, ouvrir le dossier, accepter la pièce, « Marquer Titre vérifié », « Publier ».
3. Vérifier la notification du porteur (cloche en haut à droite).
4. Créer un compte **investisseur** : catalogue, filtres « Avec titre » + « Avec eau », fiche, favori, demande de visite (charte).
5. Côté porteur : `/espace-porteur/visites`. Signaler un problème sur la fiche, puis répondre dans `/admin/signalements`.
6. Sur téléphone : refaire l'étape 1 et ouvrir les filtres avancés.

## Avant l'ouverture au public

- [ ] Exécuter `supabase/setup/5_retirer_demo.sql`.
- [ ] Textes juridiques et charte validés par un juriste (`/conditions`, `/confidentialite`, `/charte`).
- [ ] SMTP configuré dans Supabase et variables `SMTP_*` dans Vercel (voir docs/SMTP.md).
- [ ] Nom de domaine relié à Vercel, `NEXT_PUBLIC_SITE_URL` et URLs Supabase mis à jour.
- [ ] Sauvegardes quotidiennes (offre Supabase Pro).

## Recette de bout en bout sur le site en ligne (25/11/2026)

Commande : `npm run test:live` (crée 4 comptes de test `@verdolive.test` et 4 terrains « [TEST] » dans la vraie base, joue les scénarios contre la base et https://verdolive-kappa.vercel.app, puis supprime tout).

Résultat : **22/22 vérifications réussies**, base revenue à zéro après nettoyage.

| Scénarios | Vérifié en ligne |
|---|---|
| 1, 2 | Profil et rôle créés à l'inscription ; rôle admin refusé |
| 3 à 6, 20 | Titre / eau / indivision obligatoires avant soumission |
| 7 | Brouillon enregistré à l'étape 4 et relu à l'identique |
| D7 | Soumission refusée tant que l'e-mail n'est pas confirmé ; un porteur ne peut pas publier |
| 8, 9, 13 | Publication, ordre « Recommandés », cas D masqué, filtres et compteur sur le site |
| 10 | « Titre déclaré » à la saisie, « Titre vérifié » seulement par l'admin, raison mise à jour |
| 11 | Alerte admin sur numéro de titre en doublon |
| 12 | Statut changé par l'admin, note journalisée, porteur notifié |
| 14, 19 | Favori ; visite refusée sans charte puis acceptée ; visible du porteur et de l'admin ; notification |
| 15, 16 | Diagnostic GeoAI réel (Open-Meteo), natures des données, visible du public seulement après validation |
| 17 | Rapport PDF réservé aux comptes (génération testée par `npm test`) |
| 18 | Titre foncier illisible par un autre porteur et par un investisseur, lisible par l'admin |
| 21, 23 | Eau partagée, indivision, répartition Mgharsa et frais sur la fiche publique |
| 22 | Signalement avec numéro de ticket et alerte admin |

Reste à vérifier à la main (navigateur, avec un vrai compte) : réception des e-mails (confirmation, notifications), parcours de l'assistant au doigt sur téléphone, affichage de la fiche complète une fois connecté.

## Recette étendue (35 vérifications)

Ajouts : inscription publique, liens e-mail de confirmation et de réinitialisation, ajout d'un second profil,
photo sur la fiche, pages connectées des trois rôles, PDF téléchargé, 27 combinaisons de filtres et tris,
réglages admin, écritures interdites, pages publiques.

- Site en ligne avant correction : 32/35. Un vrai défaut : les pages `/admin` n'étaient protégées que par la
  mise en page, leur contenu (limité aux droits de l'utilisateur) était renvoyé à un non-administrateur.
  Les deux autres échecs venaient du script.
- Serveur local avec correction : **35/35**.
