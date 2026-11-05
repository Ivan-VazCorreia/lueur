# Lueur

Un fil de bonnes nouvelles du monde entier, à faire défiler comme des reels, **mis à jour automatiquement chaque matin**.

- Chaque jour vers 6 h, GitHub lit les flux de plusieurs sites de bonnes nouvelles, trie les articles par thème (animaux, nature, océans, IA & science, santé, énergie, société) et met à jour `news.json`.
- L'appli affiche les infos du jour avec leur photo, puis 30 « essentiels » toujours disponibles.
- Tout est gratuit : hébergement GitHub Pages et automatisation GitHub Actions.

---

## Installation (15 minutes, sans rien installer sur ton ordinateur)

### 1. Créer un compte GitHub
Va sur https://github.com/signup et crée un compte gratuit.

### 2. Créer le dépôt
1. Clique sur **+** en haut à droite, puis **New repository**.
2. Nom : `lueur`. Choisis **Public** (obligatoire pour l'hébergement gratuit).
3. Clique sur **Create repository**.

### 3. Envoyer les fichiers
1. Sur la page du dépôt, clique sur le lien **uploading an existing file**.
2. Ouvre le dossier `lueur-app` sur ton ordinateur, sélectionne **tout son contenu** (y compris le dossier `.github`), et glisse-le dans la page.
3. En bas, clique sur **Commit changes**.

> Vérifie ensuite que le fichier `.github/workflows/update-news.yml` apparaît bien dans le dépôt. Sinon, crée-le à la main : **Add file → Create new file**, tape `.github/workflows/update-news.yml` comme nom, colle son contenu, puis **Commit changes**.

### 4. Autoriser la mise à jour automatique
1. **Settings** (onglet du dépôt) → **Actions** → **General**.
2. Tout en bas, dans **Workflow permissions**, choisis **Read and write permissions**.
3. Clique sur **Save**.

### 5. Mettre l'appli en ligne
1. **Settings** → **Pages**.
2. Dans **Branch**, choisis `main` et `/ (root)`, puis **Save**.
3. Après une ou deux minutes, l'adresse de ton appli s'affiche en haut de cette page :
   `https://TON-PSEUDO.github.io/lueur/`

### 6. Lancer une première mise à jour
1. Onglet **Actions** → **Mettre à jour les infos** → **Run workflow** → **Run workflow**.
2. Au bout d'une minute environ, une coche verte apparaît. Ensuite, la mise à jour se fera seule tous les matins.

### 7. L'installer sur ton téléphone
Ouvre l'adresse de l'étape 5 sur ton téléphone, puis :
- **iPhone (Safari)** : bouton Partager → **Sur l'écran d'accueil**.
- **Android (Chrome)** : menu **⋮** → **Installer l'application** (ou **Ajouter à l'écran d'accueil**).

L'appli s'ouvre alors en plein écran, comme une vraie appli, et fonctionne aussi hors connexion avec les dernières infos chargées.

---

## Option : traduire les articles en français

La plupart des sites de bonnes nouvelles sont en anglais. L'appli peut traduire automatiquement les titres et résumés avec **DeepL**, gratuitement jusqu'à 500 000 caractères par mois, ce qui couvre largement l'usage de Lueur (environ 15 000 caractères par jour).

1. Crée un compte **DeepL API Free** sur https://www.deepl.com/pro-api. DeepL demande une carte bancaire pour vérifier ton identité, mais l'offre gratuite n'est pas facturée.
2. Copie ta clé d'API depuis ton compte DeepL. Elle finit par `:fx`.
3. Sur GitHub : **Settings** → **Secrets and variables** → **Actions** → **New repository secret**.
4. Nom : `DEEPL_KEY`. Valeur : ta clé. Puis **Add secret**.
5. Relance l'étape 6. Les articles traduits portent la mention « Traduit ».

Sans cette clé, tout fonctionne quand même : les articles anglais restent simplement en anglais, avec la mention « EN ».

---

## Personnaliser

- **Ajouter ou retirer des sources** : modifie `feeds.json` (bouton crayon sur GitHub). Chaque source a un nom, une langue (`fr` ou `en`) et l'adresse de son flux RSS. `skipCategories` permet d'écarter certaines rubriques d'un site.
- **Changer l'heure de mise à jour** : dans `.github/workflows/update-news.yml`, la ligne `cron: "15 5 * * *"` signifie 5 h 15 en heure UTC.
- **Mots qui écartent un article** et **mots-clés de chaque thème** : en haut de `scripts/lib.mjs` (`BLOCK` et `THEMES`).

## À savoir

- Les photos et extraits appartiennent aux sites d'origine. L'appli affiche un court résumé et renvoie toujours vers l'article complet. Pour un usage personnel ou entre proches, cela ne pose pas de problème ; si tu veux la diffuser largement, vérifie les conditions d'utilisation de chaque source.
- Les infos sont triées par thème grâce à des mots-clés. Certaines peuvent donc arriver dans le mauvais thème ou dans « Société ».
- Si un site est en panne un matin, les articles de la veille sont conservés.
- GitHub met en pause les tâches automatiques d'un dépôt resté 60 jours sans activité. Les mises à jour quotidiennes comptent comme de l'activité, mais si les infos ne bougent plus, va dans **Actions** et réactive la tâche.

## Contenu du dossier

| Fichier | Rôle |
|---|---|
| `index.html`, `styles.css` | l'appli |
| `essentiels.js` | les 30 bonnes nouvelles de fond et les illustrations |
| `news.json` | les infos du jour (réécrit chaque matin) |
| `feeds.json` | la liste des sources |
| `scripts/fetch-news.mjs`, `scripts/lib.mjs` | le script qui récupère et trie les infos |
| `.github/workflows/update-news.yml` | la tâche automatique quotidienne |
| `manifest.webmanifest`, `sw.js`, `icon*.png`, `icon.svg` | installation sur téléphone et mode hors-ligne |
