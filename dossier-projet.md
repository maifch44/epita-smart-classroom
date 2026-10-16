# Dossier de Gestion de Projet
## EPITA Smart Classroom â€” Audit IA de Salle

**Auteure :** MaÃ¯wenn Foucher
**SpÃ©cialisation :** Data & IA Program Management  
**Programme :** GITM â€” EPITA  
**Date :** 16 octobre 2026  
**Examen :** IA for Managers â€” Examen Final

---

## 1. Cadrage

### 1.1 ProblÃ©matique mÃ©tier

Les responsables de salles de classe et d'Ã©tablissements scolaires manquent d'un outil simple et rapide pour vÃ©rifier la conformitÃ© d'une salle par rapport Ã  une configuration attendue. Le contrÃ´le manuel est chronophage, subjectif et difficile Ã  tracer. L'IA de vision permet d'automatiser partiellement cette vÃ©rification Ã  partir d'une simple image de la salle.

### 1.2 Objectifs

- Permettre Ã  un gestionnaire de salle de rÃ©aliser un audit visuel rapide via une interface web.
- DÃ©tecter automatiquement les objets prÃ©sents dans la salle (chaises, tables, ordinateurs, tableau).
- Comparer les quantitÃ©s dÃ©tectÃ©es aux quantitÃ©s attendues selon une configuration paramÃ©trable.
- GÃ©nÃ©rer un rapport d'audit structurÃ© et tÃ©lÃ©chargeable.

### 1.3 Utilisateurs cibles

| Profil | Usage |
|--------|-------|
| Responsable de salle / facility manager | VÃ©rifie la conformitÃ© de la salle avant un cours ou Ã©vÃ©nement |
| Coordinateur pÃ©dagogique | Suit l'Ã©tat du mobilier et des Ã©quipements |
| Responsable informatique | VÃ©rifie la prÃ©sence des Ã©quipements numÃ©riques |

### 1.4 PÃ©rimÃ¨tre du MVP

**Inclus dans le MVP :**
- Interface web monopage (SPA) sans backend
- Capture image via webcam ou image de test
- DÃ©tection d'objets via TensorFlow.js + COCO-SSD (cÃ´tÃ© client)
- Tableau de bord avec indicateurs synthÃ©tiques
- Rapport d'audit textuel tÃ©lÃ©chargeable
- Configuration thÃ©orique modifiable dans l'interface
- DÃ©ploiement public via Cloudflare Pages

**FonctionnalitÃ©s exclues (hors MVP) :**
- DÃ©tection de personnes (rÃ¨gle de sÃ©curitÃ©)
- Enregistrement vidÃ©o ou stockage d'images
- Backend / API serveur
- Base de donnÃ©es historique
- Authentification utilisateur
- Analyse multi-camÃ©ras
- ModÃ¨le IA personnalisÃ© (fine-tuning)
- DÃ©tection de catÃ©gories non supportÃ©es par COCO-SSD (ex : tableau blanc spÃ©cifique)

---

## 2. Architecture

```
â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”
â”‚                    Navigateur Web                   â”‚
â”‚                                                     â”‚
â”‚  â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”    â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”    â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”  â”‚
â”‚  â”‚  index   â”‚    â”‚   style.css  â”‚    â”‚  app.js   â”‚  â”‚
â”‚  â”‚  .html   â”‚â—„â”€â”€â–ºâ”‚  (Bootstrap) â”‚    â”‚ (logique) â”‚  â”‚
â”‚  â””â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”˜    â””â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”˜    â””â”€â”€â”€â”€â”€â”¬â”€â”€â”€â”€â”€â”˜  â”‚
â”‚                                            â”‚        â”‚
â”‚  â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â–¼â”€â”€â”€â”€â”€â”€â” â”‚
â”‚  â”‚           TensorFlow.js + COCO-SSD (CDN)       â”‚ â”‚
â”‚  â”‚           DÃ©tection cÃ´tÃ© client, sans serveur  â”‚ â”‚
â”‚  â””â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”˜ â”‚
â”‚                                                     â”‚
â”‚  â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”    â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”    â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”  â”‚
â”‚  â”‚  Webcam  â”‚    â”‚   Canvas     â”‚    â”‚  Rapport  â”‚  â”‚
â”‚  â”‚  (API)   â”‚â”€â”€â”€â–ºâ”‚  (overlay)   â”‚    â”‚  (.txt)   â”‚  â”‚
â”‚  â””â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”˜    â””â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”˜    â””â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”˜  â”‚
â””â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”˜
                          â”‚
                  Cloudflare Pages
                  (hÃ©bergement statique)
                          â”‚
                     URL publique
```

**Stack technique :**
- **Frontend :** HTML5, CSS3, JavaScript (Vanilla)
- **UI Framework :** Bootstrap 5 (CDN)
- **ModÃ¨le IA :** TensorFlow.js + COCO-SSD (CDN, exÃ©cution navigateur)
- **HÃ©bergement :** Cloudflare Pages (dÃ©ploiement depuis GitHub)
- **Versioning :** GitHub (`epita-smart-classroom`)

---

## 3. Backlog â€” User Stories & TÃ¢ches

| # | User Story | PrioritÃ© | Statut | CritÃ¨res d'acceptation |
|---|-----------|----------|--------|----------------------|
| US-01 | En tant qu'utilisateur, je veux voir une page d'accueil claire dÃ©crivant le projet | Haute | âœ… TerminÃ© | Page affiche titre, description, boutons d'action |
| US-02 | En tant qu'utilisateur, je veux dÃ©marrer ma webcam pour capturer la salle | Haute | âœ… TerminÃ© | Flux vidÃ©o affichÃ©, permission demandÃ©e |
| US-03 | En tant qu'utilisateur, je veux qu'un modÃ¨le IA dÃ©tecte les objets en temps rÃ©el | Haute | âœ… TerminÃ© | Bounding boxes + labels affichÃ©s sur le flux |
| US-04 | En tant qu'utilisateur, je veux ajuster le seuil de confiance | Moyenne | âœ… TerminÃ© | Slider 0â€“100%, rÃ©sultats mis Ã  jour en temps rÃ©el |
| US-05 | En tant qu'utilisateur, je veux configurer les quantitÃ©s attendues d'objets | Haute | âœ… TerminÃ© | Formulaire Ã©ditable pour chaque catÃ©gorie |
| US-06 | En tant que gestionnaire, je veux voir un tableau comparatif attendu vs dÃ©tectÃ© | Haute | âœ… TerminÃ© | Tableau avec Ã©cart et statut colorÃ© |
| US-07 | En tant que responsable, je veux un tableau de bord avec les KPI de l'audit | Haute | âœ… TerminÃ© | Cartes KPI avec valeurs calculÃ©es |
| US-08 | En tant que gestionnaire, je veux gÃ©nÃ©rer et tÃ©lÃ©charger un rapport d'audit | Haute | âœ… TerminÃ© | Bouton gÃ©nÃ¨re rapport .txt tÃ©lÃ©chargeable |
| US-09 | En tant qu'utilisateur, je veux que l'application soit accessible en ligne | Haute | âœ… TerminÃ© | URL Cloudflare Pages fonctionnelle |
| US-10 | En tant que dÃ©veloppeur, je veux un README complet sur GitHub | Moyenne | âœ… TerminÃ© | README avec instructions, limites, URL |

---

## 4. Planification

### Sprint unique (4 heures â€” Examen)

| Phase | DurÃ©e | TÃ¢ches |
|-------|-------|--------|
| Cadrage & Architecture | 30 min | DÃ©finition du pÃ©rimÃ¨tre, choix techniques |
| DÃ©veloppement UI | 45 min | index.html, style.css, layout Bootstrap |
| IntÃ©gration TF.js | 45 min | Chargement modÃ¨le, dÃ©tection, bounding boxes |
| FonctionnalitÃ©s Audit | 30 min | Config, comparaison, tableau, dashboard |
| Rapport d'audit | 20 min | GÃ©nÃ©ration et tÃ©lÃ©chargement rapport |
| GitHub & Cloudflare | 30 min | Commit, push, dÃ©ploiement |
| Tests & Documentation | 20 min | Tests 3 scÃ©narios, README final |

---

## 5. KPI (Indicateurs de Performance)

### KPI 1 â€” Taux de dÃ©tection sur jeu de test annotÃ©

**DÃ©finition :** Pourcentage d'objets correctement dÃ©tectÃ©s sur un ensemble d'images annotÃ©es manuellement.

**Formule :**
$$\text{Taux de dÃ©tection} = \frac{\text{Objets correctement dÃ©tectÃ©s}}{\text{Total objets attendus}} \times 100$$

**Cible :** > 70% pour les catÃ©gories supportÃ©es (chaise, table, laptop)  
**Mesure :** Test sur 3 images de salle annotÃ©es manuellement

### KPI 2 â€” Temps moyen pour rÃ©aliser un audit

**DÃ©finition :** Temps entre le dÃ©marrage de la camÃ©ra et la gÃ©nÃ©ration du rapport.

**Formule :** Mesure chronomÃ©trique de bout en bout (dÃ©marrage â†’ rapport tÃ©lÃ©chargÃ©)

**Cible :** < 2 minutes pour un audit complet  
**Mesure :** ChronomÃ©trage sur 5 sessions de test

### KPI 3 â€” Nombre d'Ã©carts identifiÃ©s vs rÃ©alitÃ©

**DÃ©finition :** PrÃ©cision de la comparaison audit (Ã©carts dÃ©tectÃ©s = Ã©carts rÃ©els).

**Formule :**
$$\text{PrÃ©cision Ã©carts} = \frac{\text{Ã‰carts correctement identifiÃ©s}}{\text{Total Ã©carts rÃ©els}} \times 100$$

**Cible :** > 80% de fidÃ©litÃ© sur les catÃ©gories supportÃ©es  
**Mesure :** Comparaison avec comptage manuel de la salle

---

## 6. Tests

### ScÃ©nario 1 â€” Salle bien Ã©quipÃ©e et bien Ã©clairÃ©e

**Contexte :** Salle avec chaises, tables, laptops bien visibles, bonne luminositÃ©  
**Actions :** DÃ©marrer camÃ©ra, attendre chargement modÃ¨le, capturer, gÃ©nÃ©rer rapport  
**RÃ©sultat attendu :** DÃ©tection correcte, statut global "Conforme" ou "Ã‰carts mineurs"  
**RÃ©sultat observÃ© :** DÃ©tection partielle selon angle de camÃ©ra (voir limites)

### ScÃ©nario 2 â€” Refus d'accÃ¨s Ã  la camÃ©ra

**Contexte :** Utilisateur clique "Refuser" quand le navigateur demande l'accÃ¨s Ã  la camÃ©ra  
**Actions :** Cliquer "DÃ©marrer la camÃ©ra", puis refuser la permission  
**RÃ©sultat attendu :** Message d'erreur clair "AccÃ¨s Ã  la camÃ©ra refusÃ©", application reste utilisable  
**RÃ©sultat observÃ© :** âœ… Message d'erreur affichÃ©, Ã©tat stable

### ScÃ©nario 3 â€” ModÃ¨le IA non chargÃ© (rÃ©seau lent / hors ligne)

**Contexte :** Connexion rÃ©seau coupÃ©e avant chargement du modÃ¨le COCO-SSD  
**Actions :** Ouvrir l'application sans rÃ©seau, tenter de dÃ©marrer la dÃ©tection  
**RÃ©sultat attendu :** Message "ModÃ¨le non disponible", dÃ©tection dÃ©sactivÃ©e, interface reste affichÃ©e  
**RÃ©sultat observÃ© :** âœ… Spinner de chargement, message d'erreur si timeout

---

## 7. Risques et Limites

### Risques

| ID | Risque | ProbabilitÃ© | Impact | Mitigation |
|----|--------|-------------|--------|-----------|
| R-01 | COCO-SSD ne dÃ©tecte pas les tableaux blancs comme tels | Haute | Moyen | Mapper 'tv' comme proxy, noter la limite |
| R-02 | Mauvaise luminositÃ© = dÃ©tection dÃ©gradÃ©e | Haute | Moyen | Documenter dans les limites, recommander bonne lumiÃ¨re |
| R-03 | Latence de chargement du modÃ¨le (>3s) | Moyenne | Faible | Indicateur de chargement, message d'attente |
| R-04 | CamÃ©ra non disponible sur certains appareils | Faible | Faible | Image de test en fallback |
| R-05 | Objets occultÃ©s ou hors cadre non dÃ©tectÃ©s | Haute | Moyen | Note explicite dans le rapport d'audit |

### Limites du modÃ¨le COCO-SSD

- **CatÃ©gories limitÃ©es :** COCO-SSD reconnaÃ®t 80 catÃ©gories standard ; certains Ã©quipements de classe (tableau blanc, vidÃ©oprojecteur, armoire) ne sont pas reconnus nativement.
- **SensibilitÃ© Ã  l'angle :** La dÃ©tection est moins fiable en vue de biais ou Ã  grande distance.
- **SensibilitÃ© Ã  la luminositÃ© :** Faible Ã©clairage = prÃ©cision rÃ©duite.
- **Objets partiellement visibles :** Un objet masquÃ© Ã  >50% peut ne pas Ãªtre dÃ©tectÃ©.
- **Pas de comptage intelligent :** Le modÃ¨le peut dÃ©tecter plusieurs fois le mÃªme objet selon les frames.
- **Aucune dÃ©tection de personnes :** ConformÃ©ment aux rÃ¨gles de sÃ©curitÃ©, les dÃ©tections 'person' sont filtrÃ©es.

---

## 8. SÃ©curitÃ© et Ã‰thique

- Aucune personne n'est analysÃ©e (filtre sur catÃ©gorie 'person' dans COCO-SSD)
- Aucune image ou vidÃ©o n'est enregistrÃ©e ou envoyÃ©e Ã  un serveur
- Traitement 100% local dans le navigateur
- Aucune donnÃ©e personnelle collectÃ©e
- Le modÃ¨le ne prÃ©tend pas dÃ©tecter des catÃ©gories non supportÃ©es

---

## 9. Technologies utilisÃ©es

| Technologie | Version | Usage |
|-------------|---------|-------|
| HTML5 | â€” | Structure de l'application |
| CSS3 | â€” | Mise en forme |
| JavaScript ES6+ | â€” | Logique applicative |
| Bootstrap | 5.3 | Framework UI responsive |
| TensorFlow.js | Latest | ExÃ©cution du modÃ¨le IA |
| COCO-SSD | Latest | ModÃ¨le de dÃ©tection d'objets |
| GitHub | â€” | Versioning et hÃ©bergement du code |
| Cloudflare Pages | â€” | DÃ©ploiement et URL publique |

---

## 10. Livrables

| Livrable | Description | URL |
|----------|-------------|-----|
| Application web | Interface fonctionnelle dÃ©ployÃ©e | https://epita-smart-classroom.maiwenn-foucher.workers.dev |
| Code source | DÃ©pÃ´t GitHub complet | https://github.com/maifch44/epita-smart-classroom |
| Dossier projet | Ce document (Markdown) | `dossier-projet.md` |

---

*Document gÃ©nÃ©rÃ© le 16 octobre 2026 â€” EPITA GITM â€” Maïwenn Foucher*

