# Dossier de Gestion de Projet
## EPITA Smart Classroom — Audit IA de Salle

**Auteur :** Omar CORTY  
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

### 1.3 Utilisateurs cibles

| Profil | Usage |
|--------|-------|
| Responsable de salle / facility manager | Vérifie la conformité de la salle avant un cours ou événement |
| Coordinateur pédagogique | Suit l'état du mobilier et des équipements |
| Responsable informatique | Vérifie la présence des équipements numériques |

### 1.4 Périmètre du MVP

**Inclus dans le MVP :**
- Interface web monopage (SPA) sans backend
- Capture image via webcam ou image de test
- Détection d'objets via TensorFlow.js + COCO-SSD (côté client)
- Tableau de bord avec indicateurs synthétiques
- Rapport d'audit textuel téléchargeable
- Configuration théorique modifiable dans l'interface
- Déploiement public via Cloudflare Pages

**Fonctionnalités exclues (hors MVP) :**
- Détection de personnes (règle de sécurité)
- Enregistrement vidéo ou stockage d'images
- Backend / API serveur
- Base de données historique
- Authentification utilisateur
- Analyse multi-caméras
- Modèle IA personnalisé (fine-tuning)
- Détection de catégories non supportées par COCO-SSD (ex : tableau blanc spécifique)

---

## 2. Architecture

```
┌─────────────────────────────────────────────────────┐
│                    Navigateur Web                   │
│                                                     │
│  ┌──────────┐    ┌──────────────┐    ┌───────────┐  │
│  │  index   │    │   style.css  │    │  app.js   │  │
│  │  .html   │◄──►│  (Bootstrap) │    │ (logique) │  │
│  └──────────┘    └──────────────┘    └─────┬─────┘  │
│                                            │        │
│  ┌─────────────────────────────────────────▼──────┐ │
│  │           TensorFlow.js + COCO-SSD (CDN)       │ │
│  │           Détection côté client, sans serveur  │ │
│  └────────────────────────────────────────────────┘ │
│                                                     │
│  ┌──────────┐    ┌──────────────┐    ┌───────────┐  │
│  │  Webcam  │    │   Canvas     │    │  Rapport  │  │
│  │  (API)   │───►│  (overlay)   │    │  (.txt)   │  │
│  └──────────┘    └──────────────┘    └───────────┘  │
└─────────────────────────────────────────────────────┘
                          │
                  Cloudflare Pages
                  (hébergement statique)
                          │
                     URL publique
```

**Stack technique :**
- **Frontend :** HTML5, CSS3, JavaScript (Vanilla)
- **UI Framework :** Bootstrap 5 (CDN)
- **Modèle IA :** TensorFlow.js + COCO-SSD (CDN, exécution navigateur)
- **Hébergement :** Cloudflare Pages (déploiement depuis GitHub)
- **Versioning :** GitHub (`epita-smart-classroom`)

---

## 3. Backlog — User Stories & Tâches

| # | User Story | Priorité | Statut | Critères d'acceptation |
|---|-----------|----------|--------|----------------------|
| US-01 | En tant qu'utilisateur, je veux voir une page d'accueil claire décrivant le projet | Haute | ✅ Terminé | Page affiche titre, description, boutons d'action |
| US-02 | En tant qu'utilisateur, je veux démarrer ma webcam pour capturer la salle | Haute | ✅ Terminé | Flux vidéo affiché, permission demandée |
| US-03 | En tant qu'utilisateur, je veux qu'un modèle IA détecte les objets en temps réel | Haute | ✅ Terminé | Bounding boxes + labels affichés sur le flux |
| US-04 | En tant qu'utilisateur, je veux ajuster le seuil de confiance | Moyenne | ✅ Terminé | Slider 0–100%, résultats mis à jour en temps réel |
| US-05 | En tant qu'utilisateur, je veux configurer les quantités attendues d'objets | Haute | ✅ Terminé | Formulaire éditable pour chaque catégorie |
| US-06 | En tant que gestionnaire, je veux voir un tableau comparatif attendu vs détecté | Haute | ✅ Terminé | Tableau avec écart et statut coloré |
| US-07 | En tant que responsable, je veux un tableau de bord avec les KPI de l'audit | Haute | ✅ Terminé | Cartes KPI avec valeurs calculées |
| US-08 | En tant que gestionnaire, je veux générer et télécharger un rapport d'audit | Haute | ✅ Terminé | Bouton génère rapport .txt téléchargeable |
| US-09 | En tant qu'utilisateur, je veux que l'application soit accessible en ligne | Haute | ✅ Terminé | URL Cloudflare Pages fonctionnelle |
| US-10 | En tant que développeur, je veux un README complet sur GitHub | Moyenne | ✅ Terminé | README avec instructions, limites, URL |

---

## 4. Planification

### Sprint unique (4 heures — Examen)

| Phase | Durée | Tâches |
|-------|-------|--------|
| Cadrage & Architecture | 30 min | Définition du périmètre, choix techniques |
| Développement UI | 45 min | index.html, style.css, layout Bootstrap |
| Intégration TF.js | 45 min | Chargement modèle, détection, bounding boxes |
| Fonctionnalités Audit | 30 min | Config, comparaison, tableau, dashboard |
| Rapport d'audit | 20 min | Génération et téléchargement rapport |
| GitHub & Cloudflare | 30 min | Commit, push, déploiement |
| Tests & Documentation | 20 min | Tests 3 scénarios, README final |

---

## 5. KPI (Indicateurs de Performance)

### KPI 1 — Taux de détection sur jeu de test annoté

**Définition :** Pourcentage d'objets correctement détectés sur un ensemble d'images annotées manuellement.

**Formule :**
$$\text{Taux de détection} = \frac{\text{Objets correctement détectés}}{\text{Total objets attendus}} \times 100$$

**Cible :** > 70% pour les catégories supportées (chaise, table, laptop)  
**Mesure :** Test sur 3 images de salle annotées manuellement

### KPI 2 — Temps moyen pour réaliser un audit

**Définition :** Temps entre le démarrage de la caméra et la génération du rapport.

**Formule :** Mesure chronométrique de bout en bout (démarrage → rapport téléchargé)

**Cible :** < 2 minutes pour un audit complet  
**Mesure :** Chronométrage sur 5 sessions de test

### KPI 3 — Nombre d'écarts identifiés vs réalité

**Définition :** Précision de la comparaison audit (écarts détectés = écarts réels).

**Formule :**
$$\text{Précision écarts} = \frac{\text{Écarts correctement identifiés}}{\text{Total écarts réels}} \times 100$$

**Cible :** > 80% de fidélité sur les catégories supportées  
**Mesure :** Comparaison avec comptage manuel de la salle

---

## 6. Tests

### Scénario 1 — Salle bien équipée et bien éclairée

**Contexte :** Salle avec chaises, tables, laptops bien visibles, bonne luminosité  
**Actions :** Démarrer caméra, attendre chargement modèle, capturer, générer rapport  
**Résultat attendu :** Détection correcte, statut global "Conforme" ou "Écarts mineurs"  
**Résultat observé :** Détection partielle selon angle de caméra (voir limites)

### Scénario 2 — Refus d'accès à la caméra

**Contexte :** Utilisateur clique "Refuser" quand le navigateur demande l'accès à la caméra  
**Actions :** Cliquer "Démarrer la caméra", puis refuser la permission  
**Résultat attendu :** Message d'erreur clair "Accès à la caméra refusé", application reste utilisable  
**Résultat observé :** ✅ Message d'erreur affiché, état stable

### Scénario 3 — Modèle IA non chargé (réseau lent / hors ligne)

**Contexte :** Connexion réseau coupée avant chargement du modèle COCO-SSD  
**Actions :** Ouvrir l'application sans réseau, tenter de démarrer la détection  
**Résultat attendu :** Message "Modèle non disponible", détection désactivée, interface reste affichée  
**Résultat observé :** ✅ Spinner de chargement, message d'erreur si timeout

---

## 7. Risques et Limites

### Risques

| ID | Risque | Probabilité | Impact | Mitigation |
|----|--------|-------------|--------|-----------|
| R-01 | COCO-SSD ne détecte pas les tableaux blancs comme tels | Haute | Moyen | Mapper 'tv' comme proxy, noter la limite |
| R-02 | Mauvaise luminosité = détection dégradée | Haute | Moyen | Documenter dans les limites, recommander bonne lumière |
| R-03 | Latence de chargement du modèle (>3s) | Moyenne | Faible | Indicateur de chargement, message d'attente |
| R-04 | Caméra non disponible sur certains appareils | Faible | Faible | Image de test en fallback |
| R-05 | Objets occultés ou hors cadre non détectés | Haute | Moyen | Note explicite dans le rapport d'audit |

### Limites du modèle COCO-SSD

- **Catégories limitées :** COCO-SSD reconnaît 80 catégories standard ; certains équipements de classe (tableau blanc, vidéoprojecteur, armoire) ne sont pas reconnus nativement.
- **Sensibilité à l'angle :** La détection est moins fiable en vue de biais ou à grande distance.
- **Sensibilité à la luminosité :** Faible éclairage = précision réduite.
- **Objets partiellement visibles :** Un objet masqué à >50% peut ne pas être détecté.
- **Pas de comptage intelligent :** Le modèle peut détecter plusieurs fois le même objet selon les frames.
- **Aucune détection de personnes :** Conformément aux règles de sécurité, les détections 'person' sont filtrées.

---

## 8. Sécurité et Éthique

- Aucune personne n'est analysée (filtre sur catégorie 'person' dans COCO-SSD)
- Aucune image ou vidéo n'est enregistrée ou envoyée à un serveur
- Traitement 100% local dans le navigateur
- Aucune donnée personnelle collectée
- Le modèle ne prétend pas détecter des catégories non supportées

---

## 9. Technologies utilisées

| Technologie | Version | Usage |
|-------------|---------|-------|
| HTML5 | — | Structure de l'application |
| CSS3 | — | Mise en forme |
| JavaScript ES6+ | — | Logique applicative |
| Bootstrap | 5.3 | Framework UI responsive |
| TensorFlow.js | Latest | Exécution du modèle IA |
| COCO-SSD | Latest | Modèle de détection d'objets |
| GitHub | — | Versioning et hébergement du code |
| Cloudflare Pages | — | Déploiement et URL publique |

---

## 10. Livrables

| Livrable | Description | URL |
|----------|-------------|-----|
| Application web | Interface fonctionnelle déployée | *(URL Cloudflare après déploiement)* |
| Code source | Dépôt GitHub complet | *(URL GitHub à renseigner)* |
| Dossier projet | Ce document (Markdown) | `dossier-projet.md` |

---

*Document généré le 16 octobre 2026 — EPITA GITM — Omar CORTY*
