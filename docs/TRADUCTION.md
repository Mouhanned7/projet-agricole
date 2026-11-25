# Arabe (العربية)

Le bouton « العربية » en haut du site affiche toutes les pages en arabe, de droite à gauche.
Le choix est mémorisé un an (cookie `lang`).

## Fonctionnement

Les textes restent écrits en français dans le code et sont traduits à l'affichage :

| Fichier | Rôle |
|---|---|
| `src/lib/i18n/ar.json` | Dictionnaire « texte français → texte arabe » |
| `src/lib/i18n/translate.ts` | Phrases contenant des valeurs (nombres, dates, noms) |
| `src/components/i18n/arabic-translator.tsx` | Traduit la page et chaque changement |

**Corriger une traduction :** modifier la valeur arabe dans `ar.json`.
**Après avoir ajouté ou changé un texte français :** ajouter la même phrase comme clé dans `ar.json`, sinon elle reste en français.

## Restent en français

- Ce que saisissent les utilisateurs (nom du terrain, descriptions, messages).
- Les e-mails et le rapport PDF.
- La version anglaise n'est pas faite.
- Les moteurs de recherche voient la version française.

Les textes arabes doivent être relus par une personne arabophone, en particulier les termes juridiques
(رسم عقاري، رسم عدلي، على الشياع) et le texte de la charte.
