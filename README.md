# 🎓 EPITA Smart Classroom — Audit Intelligent de Salle par Vision IA

> **Projet académique :** AI for Project Management — EPITA ING3 GITM  
> **Auteur :** Omar CORTY - EPITA GITM  
> **Déploiement public (Cloudflare) :** `https://epita-smart-classroom.pages.dev` *(ou URL Cloudflare Tunnel / Pages)*

---

## 📌 1. Description du Projet

**EPITA Smart Classroom** est une solution web d'audit automatisé et d'inventaire intelligent de salle de classe par vision artificielle exécutée directement dans le navigateur client (*Edge Computing*).

L'application analyse le flux vidéo en direct d'une webcam pour détecter, classifier et dénombrer le mobilier pédagogique et les équipements informatiques présents (chaises, tables, écrans/tableaux, ordinateurs portables, etc.). Elle confronte ensuite ces observations en temps réel à une **configuration théorique de référence modifiable** (ex: 10 tables, 20 chaises, 1 tableau, 5 PC), met à jour un **tableau de bord synthétique (KPIs)** et produit un **rapport d'audit officiel téléchargeable**.

### 🌟 Fonctionnalités Clés

* **Fonctionnalité A — Interface Utilisateur Moderne :**
  * Accueil présentant le projet et le cadre méthodologique.
  * Commandes ergonomiques de démarrage, arrêt et capture/gel du flux caméra.
  * Zone vidéo adaptative avec superposition dynamique d'un Canvas d'annotation.
  * Tableau de bord synthétique et zone de rapport d'audit intégrée.

* **Fonctionnalité B — Détection d'Objets par Vision Artificielle :**
  * Modèle de Deep Learning pré-entraîné **COCO-SSD** exécuté via **TensorFlow.js**.
  * Bounding boxes (cadres englobants) colorés par catégorie avec étiquette en français et indice de confiance en pourcentage.
  * Curseur interactif de **seuil de confiance** (de 15% à 95%) pour filtrer les détections en direct.
  * Pastilles d'inventaire montrant le décompte par catégorie en temps réel.

* **Fonctionnalité C — Audit de Salle Interactif :**
  * Configuration théorique initiale : **10 tables, 20 chaises, 1 tableau/écran, 5 ordinateurs portables**.
  * Quantités théoriques modifiables directement dans le tableau par l'utilisateur.
  * Possibilité d'ajouter des règles personnalisées (parmi les 80 classes COCO-SSD).
  * Comparatif automatique : *Quantité attendue*, *Quantité observée*, *Écart calculé*, *Taux d'atteinte*, *Statut de conformité* (Conforme, Déficit, Excédent).
  * **Rappel méthodologique :** Un équipement non détecté peut être masqué, hors champ ou mal éclairé ; il n'est donc pas systématiquement absent.

* **Fonctionnalité D — Tableau de Bord Synthétique (KPIs) :**
  * Total d'objets détectés à l'écran.
  * Nombre de catégories uniques reconnues.
  * Nombre de règles d'audit actives.
  * Nombre d'écarts observés (déficits / excédents).
  * Bannière de statut global dynamique (*Conforme*, *Non conforme*, *Excédent*, *En attente*).

* **Fonctionnalité E — Rapport d'Audit Professionnel :**
  * Génération instantanée d'un rapport textuel complet et structuré :
    * Contexte de l'inspection (date, heure, auditeur, système).
    * Synthèse globale et verdict.
    * Tableau comparatif complet Attendu vs Observé.
    * Détail des écarts constatés.
    * Objets tiers détectés hors référentiel (personnes, sacs, etc.).
    * Équipements de classe non pris en charge par le modèle.
    * Limites techniques de la vision artificielle (occlusion, champ visuel).
    * Recommandations opérationnelles pour le gestionnaire de parc.
  * Fonctions d'export : **Copie presse-papier**, **Téléchargement .txt**, **Impression / Export PDF** optimisé.

---

## 🛠️ 2. Technologies Utilisées

| Composant | Technologie | Description |
| :--- | :--- | :--- |
| **Interface & Structure** | HTML5 Sémantique | Structure accessible et responsive |
| **Design & UI** | CSS3 & Bootstrap 5.3 | Système de grille, cartes, variables CSS et styles `@media print` |
| **Icônes** | Bootstrap Icons 1.11 | Bibliothèque d'icônes vectorielles |
| **Logique Applicative** | JavaScript ES6+ (Vanilla) | Gestion de l'état, boucle d'animation, calculs d'écarts, export |
| **Moteur d'IA** | TensorFlow.js (v4.20) via CDN | Exécution GPU/WebGL du réseau de neurones dans le navigateur |
| **Modèle de Vision** | COCO-SSD (v2.2.3) via CDN | Détection d'objets (backbone MobileNet v2 Lite) |
| **Flux Vidéo** | HTML5 MediaDevices API (`getUserMedia`) | Capture webcam locale sans transfert externe |
| **Architecture** | **100% Client-Side (Edge AI)** | Aucune donnée ni flux vidéo n'est envoyé à un serveur tiers |

---

## 🔄 3. Correspondance des Classes COCO-SSD (Mapping FR)

Le modèle COCO-SSD détecte 80 classes génériques d'objets du quotidien. Pour l'audit d'une salle de classe EPITA, les équivalences suivantes sont appliquées :

* `dining table` ➔ **Table** (tables d'élèves / bureaux)
* `chair` ➔ **Chaise** (assises de cours)
* `tv` ➔ **Tableau / Écran** (tableaux interactifs, Smartboards, écrans de projection ou moniteurs)
* `laptop` ➔ **Ordinateur portable** (PC portables d'élèves ou enseignants)
* `book` ➔ **Livre / Manuel**
* `backpack` ➔ **Sac à dos**
* `person` ➔ **Personne** (élèves ou enseignant)
* `cell phone` ➔ **Téléphone portable**

*L'application intègre également un dictionnaire complet traduisant les 80 classes en français.*

---

## 🚀 4. Instructions de Lancement Local

L'application ne requiert aucun serveur backend (Node.js, Python ou base de données).  
Cependant, pour que les navigateurs modernes autorisent l'accès à la webcam via l'API `navigator.mediaDevices.getUserMedia`, la page doit être servie via le protocole `http://localhost` ou `https://` (et non via le protocole `file:///` qui restreint les permissions de caméra sur plusieurs navigateurs).

### Option A — Avec Python (recommandé, simple et rapide)
Ouvrez un terminal dans le répertoire du projet et lancez :
```bash
# Python 3
python -m http.server 8000
```
Ouvrez ensuite votre navigateur sur : [http://localhost:8000](http://localhost:8000)

### Option B — Avec Node.js (`npx serve` ou `http-server`)
```bash
npx serve .
# ou
npx http-server -p 8000
```
Puis accédez à [http://localhost:3000](http://localhost:3000) ou l'URL indiquée.

### Option C — Avec l'extension Visual Studio Code "Live Server"
1. Ouvrez le dossier `epita-smart-classroom` dans VS Code.
2. Cliquez avec le bouton droit sur `index.html`.
3. Sélectionnez **"Open with Live Server"**.

---

## ☁️ 5. Déploiement Public Cloudflare

L'application étant purement statique (HTML, CSS, JS), elle se déploie instantanément et gratuitement sur **Cloudflare Pages** :

1. Créer un dépôt Git (GitHub ou GitLab) contenant les 4 fichiers du projet.
2. Sur le tableau de bord Cloudflare, aller dans **Workers & Pages** > **Create application** > **Pages**.
3. Lier le dépôt Git.
4. Paramètres de build :
   * **Framework preset :** None
   * **Build command :** *(laisser vide)*
   * **Build output directory :** `.` *(racine)*
5. Cliquer sur **Deploy**.

> **URL Publique de démonstration :** `https://epita-smart-classroom.pages.dev`  
*(Ou via Cloudflare Tunnel avec la commande : `cloudflared tunnel --url http://localhost:8000`)*

---

## ⚠️ 6. Limites Connues & Considérations Méthodologiques

1. **Occlusion Géométrique :**  
   Dans une salle dense, les chaises rangées sous les tables ou cachées par d'autres élèves ne présentent pas de silhouette distinctive pour le réseau de neurones. Elles peuvent donc être manquées par la détection sans être absentes de la pièce.
2. **Champ de Vision (FOV) Limité :**  
   Une webcam classique fixe possède un angle d'ouverture de 70° à 90°. Elle ne peut pas visualiser simultanément le fond de la salle et le tableau. Un balayage panoramique ou l'usage de la fonction "Figer / Capturer" sur plusieurs angles est conseillé.
3. **Périmètre du Vocabulaire COCO-SSD :**  
   Le modèle ne possède pas de classe spécifique pour les vidéoprojecteurs montés au plafond, les tableaux blancs feutres sans cadre d'écran, ou les multiprises encastrées.
4. **Assimilation Sémantique :**  
   La classe `tv` est utilisée par défaut pour représenter les tableaux interactifs (Smartboards) et écrans muraux, ce qui constitue une approximation efficace pour une démonstration d'audit.
5. **Conditions d'Éclairage :**  
   Une forte luminosité directe (contre-jour des fenêtres) ou une pénombre réduit la confiance de détection du modèle MobileNet.

---

## 🔒 7. Respect de la Vie Privée (Privacy by Design)

* **Aucune transmission de données :** Le flux vidéo de la caméra est décodé et analysé en mémoire vive locale (RAM/GPU) par TensorFlow.js.
* **Aucune image ni métadonnée n'est envoyée vers un serveur externe.**
* Les calculs d'audit, la génération de rapport et le téléchargement `.txt` sont entièrement traités côté client (*in-browser*).

---

## 👨‍💻 8. Auteur

* **Omar CORTY** — EPITA GITM (Global IT Management)  
* **Cours :** AI for Project Management — EPITA ING3  
* Année académique : 2026-2027
