# ðŸŽ“ EPITA Smart Classroom â€” Audit Intelligent de Salle par Vision IA

> **Projet acadÃ©mique :** AI for Project Management â€” EPITA ING3 GITM  
> **Auteure :** Maïwenn Foucher - EPITA GITM  
> **DÃ©ploiement public (Cloudflare) :** `https://epita-smart-classroom.maiwenn-foucher.workers.dev` *(ou URL Cloudflare Tunnel / Pages)*

---

## ðŸ“Œ 1. Description du Projet

**EPITA Smart Classroom** est une solution web d'audit automatisÃ© et d'inventaire intelligent de salle de classe par vision artificielle exÃ©cutÃ©e directement dans le navigateur client (*Edge Computing*).

L'application analyse le flux vidÃ©o en direct d'une webcam pour dÃ©tecter, classifier et dÃ©nombrer le mobilier pÃ©dagogique et les Ã©quipements informatiques prÃ©sents (chaises, tables, Ã©crans/tableaux, ordinateurs portables, etc.). Elle confronte ensuite ces observations en temps rÃ©el Ã  une **configuration thÃ©orique de rÃ©fÃ©rence modifiable** (ex: 10 tables, 20 chaises, 1 tableau, 5 PC), met Ã  jour un **tableau de bord synthÃ©tique (KPIs)** et produit un **rapport d'audit officiel tÃ©lÃ©chargeable**.

### ðŸŒŸ FonctionnalitÃ©s ClÃ©s

* **FonctionnalitÃ© A â€” Interface Utilisateur Moderne :**
  * Accueil prÃ©sentant le projet et le cadre mÃ©thodologique.
  * Commandes ergonomiques de dÃ©marrage, arrÃªt et capture/gel du flux camÃ©ra.
  * Zone vidÃ©o adaptative avec superposition dynamique d'un Canvas d'annotation.
  * Tableau de bord synthÃ©tique et zone de rapport d'audit intÃ©grÃ©e.

* **FonctionnalitÃ© B â€” DÃ©tection d'Objets par Vision Artificielle :**
  * ModÃ¨le de Deep Learning prÃ©-entraÃ®nÃ© **COCO-SSD** exÃ©cutÃ© via **TensorFlow.js**.
  * Bounding boxes (cadres englobants) colorÃ©s par catÃ©gorie avec Ã©tiquette en franÃ§ais et indice de confiance en pourcentage.
  * Curseur interactif de **seuil de confiance** (de 15% Ã  95%) pour filtrer les dÃ©tections en direct.
  * Pastilles d'inventaire montrant le dÃ©compte par catÃ©gorie en temps rÃ©el.

* **FonctionnalitÃ© C â€” Audit de Salle Interactif :**
  * Configuration thÃ©orique initiale : **10 tables, 20 chaises, 1 tableau/Ã©cran, 5 ordinateurs portables**.
  * QuantitÃ©s thÃ©oriques modifiables directement dans le tableau par l'utilisateur.
  * PossibilitÃ© d'ajouter des rÃ¨gles personnalisÃ©es (parmi les 80 classes COCO-SSD).
  * Comparatif automatique : *QuantitÃ© attendue*, *QuantitÃ© observÃ©e*, *Ã‰cart calculÃ©*, *Taux d'atteinte*, *Statut de conformitÃ©* (Conforme, DÃ©ficit, ExcÃ©dent).
  * **Rappel mÃ©thodologique :** Un Ã©quipement non dÃ©tectÃ© peut Ãªtre masquÃ©, hors champ ou mal Ã©clairÃ© ; il n'est donc pas systÃ©matiquement absent.

* **FonctionnalitÃ© D â€” Tableau de Bord SynthÃ©tique (KPIs) :**
  * Total d'objets dÃ©tectÃ©s Ã  l'Ã©cran.
  * Nombre de catÃ©gories uniques reconnues.
  * Nombre de rÃ¨gles d'audit actives.
  * Nombre d'Ã©carts observÃ©s (dÃ©ficits / excÃ©dents).
  * BanniÃ¨re de statut global dynamique (*Conforme*, *Non conforme*, *ExcÃ©dent*, *En attente*).

* **FonctionnalitÃ© E â€” Rapport d'Audit Professionnel :**
  * GÃ©nÃ©ration instantanÃ©e d'un rapport textuel complet et structurÃ© :
    * Contexte de l'inspection (date, heure, auditeur, systÃ¨me).
    * SynthÃ¨se globale et verdict.
    * Tableau comparatif complet Attendu vs ObservÃ©.
    * DÃ©tail des Ã©carts constatÃ©s.
    * Objets tiers dÃ©tectÃ©s hors rÃ©fÃ©rentiel (personnes, sacs, etc.).
    * Ã‰quipements de classe non pris en charge par le modÃ¨le.
    * Limites techniques de la vision artificielle (occlusion, champ visuel).
    * Recommandations opÃ©rationnelles pour le gestionnaire de parc.
  * Fonctions d'export : **Copie presse-papier**, **TÃ©lÃ©chargement .txt**, **Impression / Export PDF** optimisÃ©.

---

## ðŸ› ï¸ 2. Technologies UtilisÃ©es

| Composant | Technologie | Description |
| :--- | :--- | :--- |
| **Interface & Structure** | HTML5 SÃ©mantique | Structure accessible et responsive |
| **Design & UI** | CSS3 & Bootstrap 5.3 | SystÃ¨me de grille, cartes, variables CSS et styles `@media print` |
| **IcÃ´nes** | Bootstrap Icons 1.11 | BibliothÃ¨que d'icÃ´nes vectorielles |
| **Logique Applicative** | JavaScript ES6+ (Vanilla) | Gestion de l'Ã©tat, boucle d'animation, calculs d'Ã©carts, export |
| **Moteur d'IA** | TensorFlow.js (v4.20) via CDN | ExÃ©cution GPU/WebGL du rÃ©seau de neurones dans le navigateur |
| **ModÃ¨le de Vision** | COCO-SSD (v2.2.3) via CDN | DÃ©tection d'objets (backbone MobileNet v2 Lite) |
| **Flux VidÃ©o** | HTML5 MediaDevices API (`getUserMedia`) | Capture webcam locale sans transfert externe |
| **Architecture** | **100% Client-Side (Edge AI)** | Aucune donnÃ©e ni flux vidÃ©o n'est envoyÃ© Ã  un serveur tiers |

---

## ðŸ”„ 3. Correspondance des Classes COCO-SSD (Mapping FR)

Le modÃ¨le COCO-SSD dÃ©tecte 80 classes gÃ©nÃ©riques d'objets du quotidien. Pour l'audit d'une salle de classe EPITA, les Ã©quivalences suivantes sont appliquÃ©es :

* `dining table` âž” **Table** (tables d'Ã©lÃ¨ves / bureaux)
* `chair` âž” **Chaise** (assises de cours)
* `tv` âž” **Tableau / Ã‰cran** (tableaux interactifs, Smartboards, Ã©crans de projection ou moniteurs)
* `laptop` âž” **Ordinateur portable** (PC portables d'Ã©lÃ¨ves ou enseignants)
* `book` âž” **Livre / Manuel**
* `backpack` âž” **Sac Ã  dos**
* `person` âž” **Personne** (Ã©lÃ¨ves ou enseignant)
* `cell phone` âž” **TÃ©lÃ©phone portable**

*L'application intÃ¨gre Ã©galement un dictionnaire complet traduisant les 80 classes en franÃ§ais.*

---

## ðŸš€ 4. Instructions de Lancement Local

L'application ne requiert aucun serveur backend (Node.js, Python ou base de donnÃ©es).  
Cependant, pour que les navigateurs modernes autorisent l'accÃ¨s Ã  la webcam via l'API `navigator.mediaDevices.getUserMedia`, la page doit Ãªtre servie via le protocole `http://localhost` ou `https://` (et non via le protocole `file:///` qui restreint les permissions de camÃ©ra sur plusieurs navigateurs).

### Option A â€” Avec Python (recommandÃ©, simple et rapide)
Ouvrez un terminal dans le rÃ©pertoire du projet et lancez :
```bash
# Python 3
python -m http.server 8000
```
Ouvrez ensuite votre navigateur sur : [http://localhost:8000](http://localhost:8000)

### Option B â€” Avec Node.js (`npx serve` ou `http-server`)
```bash
npx serve .
# ou
npx http-server -p 8000
```
Puis accÃ©dez Ã  [http://localhost:3000](http://localhost:3000) ou l'URL indiquÃ©e.

### Option C â€” Avec l'extension Visual Studio Code "Live Server"
1. Ouvrez le dossier `epita-smart-classroom` dans VS Code.
2. Cliquez avec le bouton droit sur `index.html`.
3. SÃ©lectionnez **"Open with Live Server"**.

---

## â˜ï¸ 5. DÃ©ploiement Public Cloudflare

L'application Ã©tant purement statique (HTML, CSS, JS), elle se dÃ©ploie instantanÃ©ment et gratuitement sur **Cloudflare Pages** :

1. CrÃ©er un dÃ©pÃ´t Git (GitHub ou GitLab) contenant les 4 fichiers du projet.
2. Sur le tableau de bord Cloudflare, aller dans **Workers & Pages** > **Create application** > **Pages**.
3. Lier le dÃ©pÃ´t Git.
4. ParamÃ¨tres de build :
   * **Framework preset :** None
   * **Build command :** *(laisser vide)*
   * **Build output directory :** `.` *(racine)*
5. Cliquer sur **Deploy**.

> **URL Publique de dÃ©monstration :** `https://epita-smart-classroom.pages.dev`  
*(Ou via Cloudflare Tunnel avec la commande : `cloudflared tunnel --url http://localhost:8000`)*

---

## âš ï¸ 6. Limites Connues & ConsidÃ©rations MÃ©thodologiques

1. **Occlusion GÃ©omÃ©trique :**  
   Dans une salle dense, les chaises rangÃ©es sous les tables ou cachÃ©es par d'autres Ã©lÃ¨ves ne prÃ©sentent pas de silhouette distinctive pour le rÃ©seau de neurones. Elles peuvent donc Ãªtre manquÃ©es par la dÃ©tection sans Ãªtre absentes de la piÃ¨ce.
2. **Champ de Vision (FOV) LimitÃ© :**  
   Une webcam classique fixe possÃ¨de un angle d'ouverture de 70Â° Ã  90Â°. Elle ne peut pas visualiser simultanÃ©ment le fond de la salle et le tableau. Un balayage panoramique ou l'usage de la fonction "Figer / Capturer" sur plusieurs angles est conseillÃ©.
3. **PÃ©rimÃ¨tre du Vocabulaire COCO-SSD :**  
   Le modÃ¨le ne possÃ¨de pas de classe spÃ©cifique pour les vidÃ©oprojecteurs montÃ©s au plafond, les tableaux blancs feutres sans cadre d'Ã©cran, ou les multiprises encastrÃ©es.
4. **Assimilation SÃ©mantique :**  
   La classe `tv` est utilisÃ©e par dÃ©faut pour reprÃ©senter les tableaux interactifs (Smartboards) et Ã©crans muraux, ce qui constitue une approximation efficace pour une dÃ©monstration d'audit.
5. **Conditions d'Ã‰clairage :**  
   Une forte luminositÃ© directe (contre-jour des fenÃªtres) ou une pÃ©nombre rÃ©duit la confiance de dÃ©tection du modÃ¨le MobileNet.

---

## ðŸ”’ 7. Respect de la Vie PrivÃ©e (Privacy by Design)

* **Aucune transmission de donnÃ©es :** Le flux vidÃ©o de la camÃ©ra est dÃ©codÃ© et analysÃ© en mÃ©moire vive locale (RAM/GPU) par TensorFlow.js.
* **Aucune image ni mÃ©tadonnÃ©e n'est envoyÃ©e vers un serveur externe.**
* Les calculs d'audit, la gÃ©nÃ©ration de rapport et le tÃ©lÃ©chargement `.txt` sont entiÃ¨rement traitÃ©s cÃ´tÃ© client (*in-browser*).

---

## ðŸ‘¨â€ðŸ’» 8. Auteur

* **Maïwenn Foucher** â€” EPITA GITM (Global IT Management)  
* **Cours :** AI for Project Management â€” EPITA ING3  
* AnnÃ©e acadÃ©mique : 2026-2027

