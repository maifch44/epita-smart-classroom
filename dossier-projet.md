# Dossier de Gestion de Projet
## EPITA Smart Classroom — Audit IA de Salle

**Auteure :** Maïwenn FOUCHER  
**Spécialisation :** Data & IA Program Management  
**Programme :** GITM — EPITA  
**Date :** 16 octobre 2026  
**Examen :** IA for Managers — Examen Final

---

## 1. Cadrage

### 1.1 Problématique métier

Les responsables de salles de classe et d'établissements scolaires manquent d'un outil simple et rapide pour vérifier la conformité d'une salle par rapport à une configuration attendue. Le contrôle manuel est chronophage, subjectif et difficile à tracer. L'IA de vision permet d'automatiser partiellement cette vérification à partir d'une simple image de la salle.

### 1.2 Objectifs

- Permettre à un gestionnaire de salle de réaliser un audit visuel rapide via une interface web.
- Détecter automatiquement les objets présents dans la salle (chaises, tables, ordinateurs, tableau).
- Comparer les quantités détectées aux quantités attendues selon une configuration paramétrable.
- Générer un rapport d'audit structuré et téléchargeable.
- Stocker les preuves d'audit et les métadonnées dans une base relationnelle SQLite Cloudflare D1.

### 1.3 Utilisateurs cibles

| Profil | Usage |
|--------|-------|
| Responsable de salle / facility manager | Vérifie la conformité de la salle avant un cours ou événement |
| Coordinateur pédagogique | Suit l'état du mobilier et des équipements |
| Responsable informatique | Vérifie la présence des équipements numériques |

### 1.4 Périmètre du MVP

**Inclus dans le MVP :**
- Interface web monopage (SPA)
- Capture image via webcam ou import de photos/vidéos
- Détection d'objets via TensorFlow.js + COCO-SSD (côté client)
- Tableau de bord avec indicateurs synthétiques en temps réel
- Rapport d'audit textuel téléchargeable
- Configuration théorique modifiable dans l'interface
- Stockage persistant des captures et des audits sur SQLite Cloudflare D1 via Cloudflare Worker
- Déploiement public via Cloudflare

**Fonctionnalités exclues (hors MVP) :**
- Détection et identification de personnes (règle stricte de sécurité et conformité RGPD)
- Enregistrement continu de flux vidéo
- Authentification multi-rôles complexe
- Analyse multi-caméras simultanées

---

## 2. Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                    Navigateur Web (Client)                     │
│                                                                 │
│  ┌──────────┐    ┌──────────────┐    ┌───────────┐              │
│  │  index   │    │   style.css  │    │  app.js   │              │
│  │  .html   │◄──►│  (Bootstrap) │    │ (logique) │              │
│  └──────────┘    └──────────────┘    └─────┬─────┘              │
│                                            │                    │
│  ┌─────────────────────────────────────────▼──────────────────┐ │
│  │           TensorFlow.js + COCO-SSD (CDN)                   │ │
│  │           Inférence Edge dans le navigateur                │ │
│  └────────────────────────────────────────────────────────────┘ │
│                                            │                    │
│  ┌──────────┐    ┌──────────────┐    ┌─────▼─────┐              │
│  │  Webcam  │    │   Canvas     │    │ Import    │              │
│  │ / Fichier│───►│  (overlay)   │    │ Photo/Vid │              │
│  └──────────┘    └──────────────┘    └───────────┘              │
└────────────────────────────────────────────┬────────────────────┘
                                             │ POST /api/captures (Base64 + JSON)
                                             │ GET  /api/captures
                                             ▼
┌─────────────────────────────────────────────────────────────────┐
│                 Backend Cloudflare (Edge Serverless)            │
│                                                                 │
│                 ┌─────────────────────────────┐                 │
│                 │      Cloudflare Worker      │                 │
│                 │         (worker.js)         │                 │
│                 └──────────────┬──────────────┘                 │
│                                │                                │
│                 ┌──────────────▼──────────────┐                 │
│                 │    SQLite Cloudflare D1     │                 │
│                 │     (epita-classroom-db)    │                 │
│                 │   table: captures (JSON+IMG)│                 │
│                 └─────────────────────────────┘                 │
└─────────────────────────────────────────────────────────────────┘
```

**Stack technique :**
- **Frontend :** HTML5, CSS3, JavaScript ES6+ (Vanilla)
- **UI Framework :** Bootstrap 5.3 + Bootstrap Icons
- **Modèle Vision :** TensorFlow.js + COCO-SSD (client-side, 80 classes)
- **Backend Edge :** Cloudflare Workers
- **Base de données :** SQLite serverless (Cloudflare D1)
- **Hébergement & Déploiement :** Cloudflare Workers / Pages
- **Versioning :** GitHub (`epita-smart-classroom`)

---

## 3. Backlog — User Stories & Tâches

| # | User Story | Priorité | Statut | Critères d'acceptation |
|---|-----------|----------|--------|----------------------|
| US-01 | Présentation claire du projet | Haute | ✅ Terminé | Page d'accueil, contexte, auteur Maïwenn FOUCHER |
| US-02 | Démarrer / arrêter la webcam | Haute | ✅ Terminé | Flux vidéo HD, compatible Safari/Chrome/Firefox |
| US-03 | Détection d'objets en temps réel | Haute | ✅ Terminé | Bounding boxes + labels FR + score % |
| US-04 | Importer photos ou vidéos de test | Haute | ✅ Terminé | Analyse d'images fixes ou fichiers vidéo locaux |
| US-05 | Seuil de confiance paramétrable | Moyenne | ✅ Terminé | Slider 15% à 95% avec recalcul dynamique |
| US-06 | Configuration théorique modifiable | Haute | ✅ Terminé | Formulaire et tableau éditables pour chaque catégorie |
| US-07 | Tableau d'audit comparatif | Haute | ✅ Terminé | Attendu, Observé, Écart, Taux, Statut couleur |
| US-08 | Tableau de bord synthétique | Haute | ✅ Terminé | 4 KPIs en temps réel + bannière d'état global |
| US-09 | Rapport d'audit exportable | Haute | ✅ Terminé | Affichage formaté, copie, export .txt et impression |
| US-10 | Stockage SQLite Cloudflare D1 | Haute | ✅ Terminé | Sauvegarde en base D1 des photos, détections et audits |

---

## 4. KPI (Indicateurs de Performance)

### KPI 1 — Taux de détection sur jeu de test annoté
$$\text{Taux de détection} = \frac{\text{Objets correctement détectés}}{\text{Total objets réels visibles}} \times 100$$
- **Cible :** > 70% sur mobilier visible sans occlusion majeure.
- **Remarque technique chaises :** Les chaises partiellement masquées par des tables ou d'autres chaises ont un score plus faible sous COCO-SSD (modèle généraliste COCO). Ajuster le seuil à 30-40% augmente le rappel.

### KPI 2 — Temps moyen pour réaliser un audit
- **Cible :** < 2 minutes de l'initialisation à la génération du rapport sauvegardé.

### KPI 3 — Précision de la détection des écarts
- **Cible :** > 80% de corrélation entre les écarts détectés et les écarts réels observés sur le mobilier non occulté.

---

## 5. Tests de Validation

1. **Scénario 1 — Mobilier standard bien cadré :** Détection stable des tables, chaises et laptops.
2. **Scénario 2 — Chaises partiellement masquées (occlusion) :** Avec seuil à 50%, les chaises au second plan ou dont le dossier seul est visible ne sont pas toujours détectées. Abaissement du seuil à 35% pour récupérer les objets partiellement visibles.
3. **Scénario 3 — Refus caméra :** Message explicite affiché sans crash applicatif.
4. **Scénario 4 — Import d'une photo / vidéo locale :** Détection immédiate avec génération d'audit et possibilité d'enregistrement SQLite D1.
5. **Scénario 5 — Sauvegarde Cloudflare D1 :** Envoi des données base64 et JSON, insertion dans la table `captures`, visualisation dans la galerie.

---

## 6. Limites Reconnues du Modèle COCO-SSD

- **Occlusion et angles partiels :** COCO-SSD est entraîné sur des images d'objets complets. Une chaise masquée à plus de 50% par une table perd ses caractéristiques distinctives (pieds, assise), réduisant le score sous le seuil de confiance.
- **Règle métier d'audit :** Conformément au cahier des charges, un objet non détecté n'est pas automatiquement considéré comme manquant : il peut être occulté, hors champ ou sous un angle défavorable.
- **Catégories absentes du modèle de base :** Les tableaux blancs classiques ne disposent pas d'une classe dédiée dans COCO et sont assimilés aux écrans (`tv`) ou mentionnés en catégorie non couverte.
- **Protection de la vie privée :** Toute détection de personne (`person`) est strictement écartée de l'audit et ne fait l'objet d'aucun enregistrement biométrique.

---

*EPITA GITM — AI for Project Management — Maïwenn FOUCHER*
