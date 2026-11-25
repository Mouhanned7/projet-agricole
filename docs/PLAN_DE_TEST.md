# VerdOlive : plan de test manuel

Site : https://verdolive-kappa.vercel.app · Durée : environ 45 minutes
Liste détaillée des fonctions : [FONCTIONNALITES.md](FONCTIONNALITES.md) · Test automatique : `npm run test:live`

Cochez chaque ligne. Si le résultat diffère, notez le numéro, la page et ce que vous voyez.

## Préparation

- [ ] Trois adresses e-mail (avec Gmail, `votreadresse+porteur@gmail.com` et `votreadresse+invest@gmail.com` arrivent dans la même boîte).
- [ ] Votre compte principal administrateur : exécuter `supabase/setup/3_premier_admin.sql` avec votre adresse.
- [ ] Trois navigateurs ou fenêtres privées : porteur, investisseur, admin.
- [ ] Une photo de terrain et un PDF (ou une photo) pour le « titre foncier ».

Donnez à vos terrains d'essai un nom commençant par `[ESSAI]` pour les supprimer ensuite.

## A. Comptes (porteur)

| N° | Action | Résultat attendu | OK |
|---|---|---|---|
| A1 | `/inscription`, cliquer « Créer mon compte » sans rien remplir | Messages en français sous chaque champ | ☐ |
| A2 | S'inscrire en « Porteur de terrain » | Moins d'une minute, arrivée sur l'espace porteur, bandeau « Confirmez votre adresse » | ☐ |
| A3 | Ouvrir l'e-mail reçu (dernier) | E-mail en français, bouton vert, le lien ouvre le site (pas localhost) | ☐ |
| A4 | Cliquer le bouton | « Votre adresse e-mail est confirmée », le bandeau disparaît | ☐ |
| A5 | Se déconnecter, « Mot de passe oublié » | E-mail reçu, nouveau mot de passe accepté | ☐ |
| A6 | Connexion avec « Lien par e-mail » | Connecté sans mot de passe | ☐ |
| A7 | `/compte` : ajouter téléphone (+216) et ville | « Profil enregistré » | ☐ |

## B. Assistant « Ajouter mon terrain » (porteur, de préférence sur téléphone)

| N° | Action | Résultat attendu | OK |
|---|---|---|---|
| B1 | Choisir « Vendre », nom `[ESSAI] Oliveraie` | Passage à l'étape 2, brouillon enregistré | ☐ |
| B2 | Titre = Oui, laisser le numéro vide | Numéro demandé et obligatoire | ☐ |
| B3 | Titre = Non puis revenir à Oui | « Autre document » apparaît puis disparaît | ☐ |
| B4 | Nature = Indivision | Case « tous les indivisaires sont d'accord » obligatoire | ☐ |
| B5 | Eau = Oui, puits, toute l'année, débit 4 l/s, partagée = Oui | Précisions de partage demandées ; la jauge change en direct | ☐ |
| B6 | Étape 3 : gouvernorat, délégation, **latitude 36.58, longitude 10.86**, 20 ha | Accepté | ☐ |
| B7 | Étape 4, puis fermer l'onglet. Revenir dans « Mon espace » | « Reprendre à l'étape 4 », réponses conservées | ☐ |
| B8 | Étape 5 : 1 photo et le document de titre | Miniature affichée, document « Reçu » | ☐ |
| B9 | Étape 6 : prix 500000, négociable | Formulaire de vente | ☐ |
| B10 | Étape 7 : envoyer | « Dossier envoyé », statut « Soumis » | ☐ |
| B11 | Créer un 2e terrain « Partenariat » (Mgharsa, 40 %), titre Oui, eau Non | Formulaire partenariat ; barre de répartition | ☐ |
| B12 | Créer un 3e terrain avec le **même numéro de titre** | (voir C2) | ☐ |

## C. Administration (admin, `/admin`)

| N° | Action | Résultat attendu | OK |
|---|---|---|---|
| C1 | Ouvrir le tableau de bord | File des dossiers, ceux avec titre et eau en premier | ☐ |
| C2 | Alertes | « Numéro de titre déjà utilisé » | ☐ |
| C3 | Ouvrir un dossier, « Demander des informations » avec une note | Statut changé, historique ; le porteur voit la notification et reçoit un e-mail | ☐ |
| C4 | Accepter le document, « Marquer Titre vérifié » | Badge « Titre vérifié » | ☐ |
| C5 | « Eau documentée » | Badge mis à jour | ☐ |
| C6 | Diagnostic : « Générer » (si absent) puis « Valider » | Score agricole, cultures, eau, économie | ☐ |
| C7 | Saisir les frais VerdOlive, puis « Publier » les deux terrains | Visibles dans le catalogue | ☐ |
| C8 | `/admin/reglages` : cocher « afficher sans titre ni eau », puis décocher | Le catalogue change | ☐ |

## D. Investisseur

| N° | Action | Résultat attendu | OK |
|---|---|---|---|
| D1 | Sans compte : `/catalogue` et une fiche | Cartes et aperçu ; « Créer un compte » pour la fiche complète | ☐ |
| D2 | S'inscrire en « Investisseur », confirmer l'e-mail | Arrivée sur le catalogue | ☐ |
| D3 | Filtres « Avec titre » + « Avec eau » | Compteur exact, pastilles supprimables | ☐ |
| D4 | Filtres avancés (surface, budget, source), tris | Résultats cohérents ; l'adresse de la page garde les filtres | ☐ |
| D5 | « Voir sur la carte » | Marqueurs, bulle, noms arabes corrects | ☐ |
| D6 | Fiche : indicateurs, conditions, diagnostic | 4 scores séparés ; données « mesuré / estimé / déclaré » ; tableau Mgharsa et frais | ☐ |
| D7 | « Télécharger le rapport PDF » | PDF de 2 pages | ☐ |
| D8 | « Enregistrer », puis `/compte/favoris` | Terrain présent | ☐ |
| D9 | « Demander une visite » | La charte s'affiche ; envoi après acceptation | ☐ |
| D10 | « Signaler un problème » | Numéro de ticket | ☐ |

## E. Retour porteur et admin

| N° | Action | Résultat attendu | OK |
|---|---|---|---|
| E1 | Porteur : cloche et `/espace-porteur/visites` | Demande visible, nom de l'investisseur ; « Visite planifiée » | ☐ |
| E2 | Investisseur : `/compte/visites` | Statut mis à jour | ☐ |
| E3 | Admin : `/admin/signalements`, répondre « Résolu » | Réponse enregistrée, e-mail envoyé au déclarant | ☐ |

## F. Sécurité

| N° | Action | Résultat attendu | OK |
|---|---|---|---|
| F1 | Connecté en investisseur, ouvrir `/admin` | « Page introuvable » | ☐ |
| F2 | Déconnecté, ouvrir `/espace-porteur` | Renvoi vers la connexion | ☐ |
| F3 | Fiche publique | Le numéro de titre n'apparaît jamais | ☐ |

## Nettoyage

Dans Supabase > SQL Editor :

```sql
delete from lands where title like '[ESSAI]%';
```

Puis supprimer les comptes d'essai dans Authentication > Users.

## Pas encore disponibles (phases suivantes)

Matching, recherches enregistrées, comparateur, messagerie, prestataires, tableau de bord d'impact,
arabe et anglais, analyse d'images satellites.
