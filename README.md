# 🎓 EPITA Smart Classroom — Audit Intelligent de Salle par Vision IA

> **Projet académique :** AI for Project Management — EPITA ING3 GITM  
> **Auteure :** Maïwenn FOUCHER - EPITA GITM  
> **Déploiement public (Cloudflare) :** `https://epita-smart-classroom.maiwenn-foucher.workers.dev`

---

## 📌 1. Description du Projet

**EPITA Smart Classroom** est une solution web d'audit automatisé et d'inventaire intelligent de salle de classe par vision artificielle exécutée directement dans le navigateur client (*Edge Computing*).

L'application analyse le flux vidéo en direct d'une webcam ou des fichiers multimédias importés (photos, vidéos) pour détecter, classifier et dénombrer le mobilier pédagogique et les équipements informatiques présents (chaises, tables, écrans/tableaux, ordinateurs portables, etc.). Elle confronte ensuite ces observations en temps réel à une **configuration théorique de référence modifiable** (ex: 10 tables, 20 chaises, 1 tableau, 5 PC), met à jour un **tableau de bord synthétique (KPIs)** et produit un **rapport d'audit officiel téléchargeable**. Les données d'audit et les clichés peuvent être persistés dans une base de données **SQLite Cloudflare D1**.

### 🌟 Fonctionnalités Clés

* **Fonctionnalité A — Interface Utilisateur Moderne :**
  * Accueil présentant le projet et le cadre méthodologique.
  * Commandes ergonomiques de démarrage, arrêt et capture/gel du flux caméra.
  * Zone vidéo adaptative avec superposition dynamique d'un Canvas d'annotation.
  * Importation de photos et vidéos de test pour l'analyse sans caméra active.
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
    * Équipements de classe non pris en charge par le modèle.
    * Limites techniques de la vision artificielle (occlusion des chaises, champ visuel).
    * Recommandations opérationnelles pour le gestionnaire de parc.
  * Fonctions d'export : **Copie presse-papier**, **Téléchargement .txt**, **Impression / Export PDF** optimisé.

* **Fonctionnalité F — Persistance SQLite Cloudflare D1 :**
  * Stockage persistant des clichés photos d'audit.
  * Sauvegarde des détections associées et de la synthèse d'audit au format JSON.
  * Galerie des audits récents avec prévisualisation et suppression.

---

## 🛠️ 2. Technologies Utilisées

| Composant | Technologie | Description |
| :--- | :--- | :--- |
| **Frontend** | HTML5 Sémantique | Structure modulaire en sections thématiques |
| **Styling** | Bootstrap 5.3 + CSS3 | Design responsive, charte EPITA, Canvas superposé |
| **Icônes** | Bootstrap Icons | Bibliothèque d'icônes SVG |
| **Moteur IA** | TensorFlow.js (v4.20) | Exécution WebAssembly / WebGL dans le navigateur |
| **Modèle Vision** | COCO-SSD (v2.2) | Détection d'objets (MobileNet Lite v2, 80 classes COCO) |
| **Backend Edge** | Cloudflare Workers | API serverless pour la gestion des audits |
| **Base de Données** | SQLite Cloudflare D1 | Base de données SQL serverless native |
| **Hébergement** | Cloudflare Pages / Workers | Hébergement statique et distribution globale CDN |

---

## 🚀 3. Lancement Local

Pour tester l'application en local (nécessite un serveur HTTP pour l'accès caméra `getUserMedia`) :

```bash
# Avec Python 3
cd epita-smart-classroom
python -m http.server 8080
```

Accédez ensuite à : `http://localhost:8080`

---

## 🔍 4. Pourquoi les chaises ne sont pas toutes détectées ?

Le modèle pré-entraîné **COCO-SSD** repose sur le jeu de données COCO. Pour détecter une chaise avec un score élevé (>50%), il s'appuie sur la présence simultanée de l'assise, du dossier et des pieds.

Dans une salle de classe :
1. **Phénomène d'occlusion :** Une chaise rangée sous une table voit ses pieds et son assise partiellement ou totalement masqués.
2. **Empilement de plans :** Les chaises alignées en rangées cachent les chaises situées derrière elles.
3. **Conseils d'utilisation :**
   - **Abaisser le seuil de confiance** à 30-40% via le curseur de l'interface pour capter les chaises partielles.
   - Varier l'angle de vue ou utiliser la fonction d'importation de clichés sous plusieurs angles.
   - Se référer à la règle du sujet : *"Un objet non détecté ne doit pas automatiquement être considéré comme absent : il peut être masqué, mal cadré ou non reconnu par le modèle."*

---

## 📄 5. Auteure et Licence

Projet développé dans le cadre du cursus ingénieur EPITA (MSc / ING3 GITM) :  
**Maïwenn FOUCHER** — Spécialisation Data & IA Program Management.
