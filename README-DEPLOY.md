# Guide de Déploiement — Cloudflare Workers & D1 (EPITA Smart Classroom)

Ce guide détaille la mise en service du backend Cloudflare Workers associé à la base de données relationnelle D1 (SQLite serverless) pour la persistance des photos d'audit et détections IA de l'application **EPITA Smart Classroom**.

---

## Architecture

- **Frontend** : HTML5, Bootstrap 5, JavaScript Vanilla, TensorFlow.js & COCO-SSD (inférence Edge 100% navigateur).
- **Backend Edge** : Cloudflare Worker (`worker.js`) avec gestion CORS, API REST et hébergement des fichiers statiques.
- **Base de données** : Cloudflare D1 (`schema.sql`) pour le stockage des captures en base64, boîtes englobantes et résumés d'audit.

---

## Étapes de Déploiement

### 1. Installer la CLI Wrangler
Assurez-vous que Node.js (version 18+) et npm sont installés sur votre poste, puis installez globalement Wrangler :
```bash
npm install -g wrangler
```
*Vérification :* `wrangler --version`

### 2. S'authentifier auprès de Cloudflare
Connectez votre compte Cloudflare via votre navigateur :
```bash
wrangler login
```
Une fenêtre de navigateur s'ouvre pour valider l'autorisation.

### 3. Créer la base de données D1
Exécutez la commande suivante pour instancier la base SQLite serverless :
```bash
wrangler d1 create epita-classroom-db
```
Dans le terminal, Cloudflare affichera un bloc de configuration semblable à :
```toml
[[d1_databases]]
binding = "DB"
database_name = "epita-classroom-db"
database_id = "xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
```

### 4. Configurer `wrangler.toml`
Ouvrez le fichier `wrangler.toml` à la racine du projet et remplacez la valeur placeholder par votre `database_id` généré :
```toml
name = "epita-smart-classroom"
main = "worker.js"
compatibility_date = "2024-01-01"

[[d1_databases]]
binding = "DB"
database_name = "epita-classroom-db"
database_id = "xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx" # <-- Remplacez ici

[site]
bucket = "./"
```

### 5. Appliquer le schéma SQL
Exécutez le fichier de migration `schema.sql` pour créer la table `captures` :
- **En production (Cloudflare D1 distant) :**
  ```bash
  wrangler d1 execute epita-classroom-db --file=schema.sql --remote
  ```
- **En test local (D1 local émulé) :**
  ```bash
  wrangler d1 execute epita-classroom-db --file=schema.sql --local
  ```

### 6. Tester localement (Optionnel)
Vous pouvez démarrer l'environnement d'émulation local :
```bash
wrangler dev
```

### 7. Déployer sur le réseau Cloudflare Edge
Déployez le Worker et le frontend statique :
```bash
wrangler deploy
```
*Note alternative pour Cloudflare Pages :*
```bash
wrangler pages deploy . --project-name epita-smart-classroom
```

### 8. Mettre à jour l'URL du Worker dans `app.js`
À la fin du déploiement, Wrangler affiche l'URL publique de votre Worker (ex. `https://epita-smart-classroom.<votre-sous-domaine>.workers.dev`).
1. Ouvrez `app.js`.
2. Modifiez la constante `WORKER_URL` au tout début du fichier :
   ```js
   const WORKER_URL = 'https://epita-smart-classroom.votre-identifiant.workers.dev';
   ```
3. Si vous hébergez le frontend séparément ou redéployez, relancez `wrangler deploy` pour publier la mise à jour.

---

## Vérification de l'Installation

1. **Test de santé de l'API :**
   Accédez à `https://<votre-worker>.workers.dev/api/health` dans votre navigateur ou via curl :
   ```bash
   curl https://<votre-worker>.workers.dev/api/health
   ```
   *Réponse attendue :* `{"status":"ok","db":"connected"}`

2. **Test dans l'application :**
   - Activez la caméra ou importez une photo/vidéo de salle.
   - Cliquez sur le bouton **"Sauvegarder dans D1"**. Une notification verte confirme l'enregistrement avec l'ID attribué.
   - Consultez la section **"Galerie des Captures (Cloudflare D1)"** et cliquez sur **"Actualiser"** pour visualiser la vignette, la date et le détail de l'audit.
