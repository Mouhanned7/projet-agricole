# VerdOlive : décisions métier et techniques

Référence : cahier des charges v2 (16/11/2026), §16 « Décisions métier à valider ».
Date des décisions : 24/11/2026.

## Décisions validées par VerdOlive

| # | Question | Décision |
|---|---|---|
| D1 | Méthode de vérification à l'inscription | **E-mail uniquement** (lien ou code de vérification par e-mail). **Pas de SMS.** |
| D2 | Consultation du catalogue sans compte | **Oui.** Le catalogue et les cartes sont consultables sans compte. |
| D3 | Qui vérifie les titres fonciers | **L'administration VerdOlive** (rôle `admin`). Seul ce rôle peut passer un titre de « déclaré » à « vérifié ». |

## Décisions par défaut (choix recommandés)

| # | Question | Décision | Raison |
|---|---|---|---|
| D4 | Terrains sans titre ni eau (cas D) | **Masqués par défaut**, affichables avec le filtre « Afficher aussi les terrains sans titre ni eau ». Réglable par l'admin. | Met en avant les terrains sûrs sans exclure définitivement les autres. |
| D5 | Option « Je ne sais pas » pour le titre | **Conservée**, traitée comme « non confirmé » : au mieux « Vérification nécessaire », avec une aide « Où trouver mon numéro de titre ? ». | Évite l'abandon du formulaire et les fausses réponses. |
| D6 | Champs d'inscription | Profil, nom complet, **e-mail**, mot de passe et acceptation des conditions. Le téléphone (avec indicatif international) est demandé plus tard dans le profil, sans vérification par SMS. Connexion Google proposée en option. | Conforme à INS-02, sans coût de SMS. |
| D7 | Vérification de l'e-mail | Non bloquante pour naviguer. Exigée avant le premier contact, la première demande de visite ou la première soumission d'un terrain (INS-05). | Inscription en moins d'une minute. |
| D8 | Ce qui reste réservé aux comptes | Fiche détaillée complète, contact, demande de visite, favoris. Sans compte, on voit les cartes, les filtres, la carte interactive et un aperçu de la fiche (titre, eau, superficie, prix, photos). | Le catalogue reste attractif et l'inscription a un intérêt. |
| D9 | Taille des fichiers | 10 Mo par fichier, formats PDF, JPG, PNG et HEIC (photos de téléphone), compression automatique des images. | |
| D10 | Alerte « dossier incomplet » | Après **14 jours** sans modification d'un brouillon : rappel par e-mail au porteur. Après **30 jours** : alerte admin. | |
| D11 | Délai de réponse aux signalements (RES-09) | Accusé de réception immédiat, réponse cible sous **72 h ouvrées**. | |
| D12 | Diagnostic GeoAI | Généré automatiquement, puis **relu par l'admin avant publication**. Statut « automatique » ou « validé » affiché. | |
| D13 | Données géospatiales | Sources gratuites d'abord : Open-Meteo (climat), SoilGrids (sol), données d'altitude publiques. | Aucun coût d'API en phase 2. |
| D14 | Langues | Français au lancement ; arabe (droite à gauche) et anglais préparés dans le code, traduits en phase 5. | |
| D15 | Hébergement | Vercel (application) + Supabase (base PostgreSQL/PostGIS, auth, stockage), sauvegardes quotidiennes. Code source propriété de VerdOlive. | |
| D16 | Frais VerdOlive | Toujours affichés sur la fiche avant tout engagement (RES-06). Montant à définir par VerdOlive. | Transparence. |

## Restant à fournir par VerdOlive (sans bloquer le développement)

- Texte de la charte de l'investissement responsable (RES-01), à valider par un juriste.
- Montant des frais et commissions VerdOlive.
- Textes légaux : conditions d'utilisation et politique de confidentialité.

## Décisions prises pendant le développement

| # | Question | Décision | Raison |
|---|---|---|---|
| D17 | Champs exigés pour envoyer un dossier | Titre et eau (règle 4), objectif, **gouvernorat et superficie**. Les autres champs restent facultatifs et améliorent le classement. | Sans localisation ni superficie, l'administration ne peut pas traiter le dossier. |
| D18 | Carte à l'étape 3 | Bouton « Utiliser ma position » et coordonnées en Sprint 2 ; la carte interactive arrive avec le Sprint 4 (MapTiler). | Éviter deux intégrations de carte. |
