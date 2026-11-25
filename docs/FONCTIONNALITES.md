# VerdOlive : récapitulatif des fonctionnalités

État au 24 novembre 2026. Site : https://verdolive-kappa.vercel.app

Légende : ✅ fait · 🟡 fait partiellement · ⏳ à faire (phase suivante)

## 1. Comptes et connexion (cahier des charges §2)

| Fonction | État | Où |
|---|---|---|
| Inscription en 4 champs avec choix du profil (Investisseur / Porteur) | ✅ | `/inscription` |
| Connexion par mot de passe | ✅ | `/connexion` |
| Connexion sans mot de passe (lien envoyé par e-mail) | ✅ | `/connexion`, onglet « Lien par e-mail » |
| Connexion avec Google | ✅ (à activer dans Supabase) | bouton « Continuer avec Google » |
| Confirmation de l'adresse e-mail, non bloquante, exigée avant contact ou soumission | ✅ | bandeau en haut de page |
| Envoi des e-mails par SMTP (Brevo, Gmail…) | ✅ (identifiants à saisir) | `docs/SMTP.md` |
| Mot de passe oublié et réinitialisation | ✅ | `/mot-de-passe-oublie` |
| Profil complété progressivement (téléphone international, ville, pays, langue) | ✅ | `/compte` |
| Un même compte investisseur et porteur | ✅ | `/compte` > Mes profils |
| Consultation du catalogue sans compte | ✅ | `/catalogue` |

## 2. Porteur de terrain (§3, §4)

| Fonction | État | Où |
|---|---|---|
| Assistant « Ajouter mon terrain » en 7 étapes avec barre de progression | ✅ | `/espace-porteur/terrains/nouveau` |
| Titre foncier Oui / Non / Je ne sais pas, champs conditionnels, numéro obligatoire si Oui | ✅ | étape 2 |
| Eau Oui / Non, source, disponibilité, débit, salinité, eau partagée | ✅ | étape 2 |
| Indivision : accord de tous les indivisaires obligatoire (RES-02) | ✅ | étape 2 |
| Localisation (gouvernorat, délégation, « utiliser ma position »), superficie | ✅ | étape 3 |
| Arbres, constructions, cultures, description | ✅ | étape 4 |
| Photos et documents (privés), statut de chaque pièce | ✅ | étape 5 |
| Conditions selon l'objectif : vente, location, partenariat Mgharsa | ✅ | étape 6 |
| Récapitulatif, liste de ce qui manque, envoi | ✅ | étape 7 |
| Jauge de dossier en direct (À compléter / Vérification nécessaire / Prioritaire) | ✅ | colonne de droite |
| Brouillon enregistré automatiquement, repris sur tout appareil | ✅ | `/espace-porteur` |
| Historique des réponses modifiées | ✅ | base de données |
| Demandes de visite reçues | ✅ | `/espace-porteur/visites` |

## 3. Classement et catalogue (§5, §6)

| Fonction | État | Où |
|---|---|---|
| Statut automatique titre × eau, raison affichée en une phrase | ✅ | cartes et fiches |
| Badges « déclaré » / « vérifié » distincts | ✅ | partout |
| Tri « Recommandés » sur 6 critères, réglable par l'admin | ✅ | `/admin/reglages` |
| Terrains sans titre ni eau masqués par défaut | ✅ | filtre « Afficher aussi… » |
| Filtres rapides Titre et Eau toujours visibles | ✅ | `/catalogue` |
| 11 filtres avancés, règles ET / OU, pastilles, suggestion si aucun résultat | ✅ | `/catalogue` |
| 8 options de tri, recherche partageable par l'adresse | ✅ | `/catalogue` |
| Fiche terrain : rubriques juridique et eau en tête, indicateurs séparés | ✅ | `/terrains/[id]` |
| Carte interactive de la Tunisie avec les mêmes filtres | ✅ | `/carte` |
| Favoris | ✅ | `/compte/favoris` |
| Demande de visite après acceptation de la charte (RES-01) | ✅ | fiche terrain |
| Recherches enregistrées avec alerte | ⏳ | phase 3 |
| Comparateur de terrains | ⏳ | phase 3 |
| Messagerie entre utilisateurs | ⏳ | phase 3 |

## 4. Intelligence artificielle et diagnostic (§11, phase 2)

| Fonction | État | Détail |
|---|---|---|
| Collecte automatique du climat | ✅ | Open-Meteo (ERA5) : pluie, températures, gel, besoins en froid, ET0, rayonnement, vent, altitude |
| Collecte automatique du sol | ✅ | SoilGrids (ISRIC) : pH, argile, sable, azote, carbone organique |
| Aptitude par culture et score agricole | ✅ | olivier, amandier, palmier dattier, pistachier, grenadier, figuier, céréales ; forces et contraintes expliquées |
| Pression sur l'eau (RES-04) | ✅ | besoin de la culture comparé au débit : suffisant / limite / déficit, avec recommandation |
| Étude économique prévisionnelle | ✅ | investissement, recettes, marge, délai de retour, hypothèses affichées |
| Nature de chaque donnée (mesuré / estimé / déclaré) et source | ✅ | règle 8 |
| Diagnostic généré automatiquement à la soumission | ✅ | — |
| Relecture et validation par l'admin avant publication (D12) | ✅ | `/admin/terrains/[id]` |
| Rapport PDF par terrain | ✅ | bouton « Télécharger le rapport PDF » |
| Méthode : règles agronomiques explicables | 🟡 | pas d'apprentissage automatique ; seuils à faire valider par un agronome |
| Matching investisseur ↔ terrains (§7) | ⏳ | phase 3 |
| Analyse d'images satellites (NDVI, occupation du sol) | ⏳ | phase 5 |

## 5. Investissement responsable (§18)

| Exigence | État |
|---|---|
| RES-01 Charte avant le premier contact | ✅ (texte à faire valider par un juriste) |
| RES-02 Accord des indivisaires | ✅ |
| RES-03 Eau partagée | ✅ |
| RES-04 Pression sur l'eau | ✅ |
| RES-05 Pratiques durables déclarées | ⏳ |
| RES-06 Partage de la valeur et frais transparents | ✅ |
| RES-07 Emplois et services locaux | ⏳ |
| RES-08 Savoirs et cultures locales | ⏳ |
| RES-09 Signaler un problème | ✅ |
| RES-10 Tableau de bord d'impact | ⏳ |
| RES-11 Repère de prix par zone | ⏳ |
| RES-12 Rapport d'impact annuel | ⏳ |

## 6. Administration (§9, §10)

| Fonction | État | Où |
|---|---|---|
| Tableau de bord : statistiques, alertes, file triée par priorité | ✅ | `/admin` |
| Dossier complet avec numéro de titre et pièces privées | ✅ | `/admin/terrains/[id]` |
| Titre vérifié, eau documentée ou analysée, revue des pièces | ✅ | idem |
| Changements de statut avec note, journalisés et notifiés au porteur | ✅ | idem |
| Alerte de numéro de titre en doublon | ✅ | `/admin` |
| Signalements : réponse tracée, délai de 72 h suivi | ✅ | `/admin/signalements` |
| Réglages du catalogue et de l'ordre de tri | ✅ | `/admin/reglages` |
| Prestataires et demandes de devis | ⏳ | phase 4 |

## 7. Technique et sécurité

| Fonction | État |
|---|---|
| Règles d'accès par rôle dans la base (RLS), documents fonciers privés | ✅ |
| Journal des actions administratives | ✅ |
| Notifications dans l'application (cloche) et par e-mail SMTP | ✅ |
| En-têtes de sécurité, robots.txt, sitemap.xml, pages 404 et erreur | ✅ |
| Thème clair et photos haute qualité optimisées | ✅ |
| Arabe (droite à gauche), bouton « العربية » | ✅ (textes à faire relire) |
| Anglais | ⏳ |
| 78 tests automatiques et 35 vérifications de bout en bout | ✅ (`npm test`, `npm run test:live`) |

## Scripts utiles

```bash
npm run dev               # site en local
npm test                  # tests automatiques
npm run check:supabase    # vérifie les clés et la base
npm run check:smtp        # vérifie la connexion SMTP
npm run check:build       # compile sans arrêter le serveur de dev
```
