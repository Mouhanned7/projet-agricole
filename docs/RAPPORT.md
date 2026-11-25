# VerdOlive : rapport des fonctions et guide de test

Site : https://verdolive-kappa.vercel.app · Date : 25/11/2026

**État** : ✅ fait et vérifié (test automatique ou navigateur) · 🟦 fait, **à tester à la main** · ⏳ non fait

## Préparer les tests

1. Scripts SQL 7, 8 et 9 exécutés dans Supabase (`supabase/setup/`).
2. Trois comptes : **porteur**, **investisseur**, **admin** (`3_premier_admin.sql` avec votre adresse). Utiliser trois fenêtres (dont des fenêtres privées).
3. Données de démonstration : `npm run seed:db` (retrait : `npm run seed:db -- --remove`).
4. Test automatique des fonctions principales : `npm run test:live` (35 vérifications, comptes temporaires supprimés).

## 1. Comptes

| Fonction | État | Comment tester → résultat attendu |
|---|---|---|
| Inscription en 4 champs avec profil | ✅ | `/inscription` → arrivée sur le catalogue ou l'espace porteur |
| Confirmation d'e-mail | ✅ | Ouvrir le dernier e-mail → adresse confirmée |
| Connexion mot de passe / lien e-mail | ✅ | `/connexion` → connecté |
| Mot de passe oublié | ✅ | `/mot-de-passe-oublie` → nouveau mot de passe |
| Double profil | ✅ | `/compte` → ajouter l'autre profil |
| Profil (téléphone international, ville) | 🟦 | `/compte` → « Profil enregistré » |
| Connexion Google | ⏳ | À configurer dans Google Cloud et Supabase |

## 2. Porteur de terrain

| Fonction | État | Comment tester → résultat attendu |
|---|---|---|
| Assistant en 7 étapes, brouillon automatique | ✅ | « Ajouter mon terrain », fermer, revenir → même étape |
| Titre foncier et eau, champs conditionnels | ✅ | Titre Oui sans numéro → envoi bloqué |
| Indivision, eau partagée | ✅ | Confirmation et précisions exigées |
| Jauge de dossier | ✅ | Change en direct |
| Carte de position, vue satellite | 🟦 | Étape 3 : toucher la carte → coordonnées remplies |
| Sol, équipements, valeurs, pratiques, savoir-faire, emplois | 🟦 | Étape 4 → visibles sur la fiche |
| Photos (compressées) et documents privés | 🟦 | Ajouter une grande photo et un document |
| Conditions vente / location / Mgharsa | ✅ | Étape 6 selon l'objectif |
| Modifier un terrain publié | 🟦 | Ouvrir le terrain → « Modifier mon terrain » → retiré puis revalidé |
| Rappel des brouillons (14 et 30 jours) | 🟦 | Vercel > Settings > Cron Jobs : tâche présente |

## 3. Catalogue et investisseur

| Fonction | État | Comment tester → résultat attendu |
|---|---|---|
| Classement titre × eau, badges déclaré / vérifié | ✅ | Cartes du catalogue |
| Filtres rapides et avancés, tris, adresse partageable | ✅ | `/catalogue` |
| Filtres sol, équipements, vérification en cours | 🟦 | Filtres avancés |
| Fiche terrain | ✅ | Titre et eau en tête, numéro de titre masqué |
| Présentation du propriétaire, carte sur la fiche | 🟦 | Fiche, connecté |
| Repère de prix par zone | 🟦 | Fiche d'un terrain en vente (3 ventes comparables au moins) |
| Carte des terrains (noms arabes) | ✅ | `/carte` |
| Favoris, demande de visite avec charte | ✅ | Fiche → visite → `/compte/visites` |
| Signaler un problème | ✅ | Fiche → numéro de ticket |
| Recherches enregistrées et alerte | 🟦 | Filtrer → « Enregistrer cette recherche » ; l'admin publie un terrain correspondant → notification |
| Matching | 🟦 | `/projet` → pourcentage et critères |
| Comparateur | 🟦 | `/comparer` → tableau de 2 ou 3 terrains |
| Messagerie | 🟦 | Fiche → « Écrire au propriétaire » → `/compte/messages` des deux côtés (terrain d'un vrai compte porteur) |
| Prestataires et devis | 🟦 | `/prestataires` → demander un devis |

## 4. Diagnostic (« IA ») et rapports

| Fonction | État | Comment tester → résultat attendu |
|---|---|---|
| Climat et sol par coordonnées | ✅ | Admin → dossier → « Générer le diagnostic » |
| Aptitude de 7 cultures, score agricole | ✅ | Même carte |
| Pression sur l'eau, étude économique | ✅ | Même carte |
| Végétation par satellite (12 mois) | 🟦 | « Régénérer » → ligne NDVI |
| Validation avant publication | ✅ | « Valider » → visible de l'investisseur |
| Rapport PDF | ✅ | Fiche, connecté → « Télécharger le rapport PDF » |
| Impact et rapport annuel | 🟦 | Ajouter une transaction signée → `/impact` (PDF : Cmd+P) |

Le diagnostic utilise des règles agronomiques explicables, pas un modèle entraîné.

## 5. Administration (`/admin`)

| Fonction | État | Comment tester → résultat attendu |
|---|---|---|
| Tableau de bord, file prioritaire, alertes | ✅ | `/admin` |
| Titre vérifié, preuve de l'eau, pièces | ✅ | Dossier |
| Statuts avec note, notification | ✅ | Porteur : cloche |
| Doublon de numéro de titre | ✅ | Deux terrains avec le même numéro → alerte |
| Corriger un dossier | 🟦 | Dossier → « Corriger le dossier » |
| Signalements | ✅ | `/admin/signalements` |
| Réglages du tri, terrains sans titre ni eau | ✅ | `/admin/reglages` |
| Pondérations des scores | 🟦 | Même page → « Enregistrer et recalculer » |
| Comptes | 🟦 | `/admin/comptes` |
| Transactions et commissions | 🟦 | `/admin/transactions` |
| Prestataires | 🟦 | `/admin/prestataires` |
| Statistiques | 🟦 | `/admin/statistiques` |

## 6. Transversal

| Fonction | État | Comment tester → résultat attendu |
|---|---|---|
| Sécurité par rôle, documents privés | ✅ | Investisseur sur `/admin` → page introuvable |
| E-mails (confirmation, notifications) | ✅ envoi | Vérifier la réception et le texte arabe (modèles à recoller dans Supabase) |
| Arabe de droite à gauche | ✅ principaux écrans | Bouton « العربية » ; relire les nouveaux écrans |
| Téléphone | ✅ | Refaire l'assistant et les filtres sur mobile |
| Anglais | ⏳ | Facultatif dans le cahier des charges (phase 5) |
| PDF en arabe | ⏳ | Non demandé explicitement |

## 7. Avant l'ouverture au public

- [ ] Textes légaux et charte validés par un juriste
- [ ] Liste complète des délégations
- [ ] Relecture de l'arabe
- [ ] Seuils agricoles et prix validés par un agronome
- [ ] Frais VerdOlive définis
- [ ] Nom de domaine, service d'e-mail professionnel, sauvegardes
- [ ] Données de démonstration retirées
