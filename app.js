/**
 * ============================================================================
 * EPITA Smart Classroom — Application Logic
 * Auteure : Maïwenn Foucher - EPITA GITM
 * Module : AI for Project Management (ING3)
 * Vision IA : TensorFlow.js & COCO-SSD
 * ============================================================================
 */

'use strict';

// URL du Worker Cloudflare — mettre à jour après déploiement
const WORKER_URL = 'https://epita-smart-classroom.maiwenn-foucher.workers.dev';

// ============================================================================
// 1. DICTIONNAIRE DE TRADUCTION COCO-SSD (80 CLASSES ANGLAIS -> FRANÇAIS)
// ============================================================================
const COCO_TRANSLATIONS_FR = {
    'person': 'Personne',
    'bicycle': 'Vélo',
    'car': 'Voiture',
    'motorcycle': 'Moto',
    'airplane': 'Avion',
    'bus': 'Bus',
    'train': 'Train',
    'truck': 'Camion',
    'boat': 'Bateau',
    'traffic light': 'Feu tricolore',
    'fire hydrant': 'Borne incendie',
    'stop sign': 'Panneau Stop',
    'parking meter': 'Horodateur',
    'bench': 'Banc',
    'bird': 'Oiseau',
    'cat': 'Chat',
    'dog': 'Chien',
    'horse': 'Cheval',
    'sheep': 'Mouton',
    'cow': 'Vache',
    'elephant': 'Éléphant',
    'bear': 'Ours',
    'zebra': 'Zèbre',
    'giraffe': 'Girafe',
    'backpack': 'Sac à dos',
    'umbrella': 'Parapluie',
    'handbag': 'Sac à main',
    'tie': 'Cravate',
    'suitcase': 'Valise',
    'frisbee': 'Frisbee',
    'skis': 'Skis',
    'snowboard': 'Snowboard',
    'sports ball': 'Ballon de sport',
    'kite': 'Cerf-volant',
    'baseball bat': 'Batte de baseball',
    'baseball glove': 'Gant de baseball',
    'skateboard': 'Skateboard',
    'surfboard': 'Planche de surf',
    'tennis racket': 'Raquette de tennis',
    'bottle': 'Bouteille',
    'wine glass': 'Verre à vin',
    'cup': 'Tasse / Gobelet',
    'fork': 'Fourchette',
    'knife': 'Couteau',
    'spoon': 'Cuillère',
    'bowl': 'Bol',
    'banana': 'Banane',
    'apple': 'Pomme',
    'sandwich': 'Sandwich',
    'orange': 'Orange',
    'broccoli': 'Brocoli',
    'carrot': 'Carotte',
    'hot dog': 'Hot dog',
    'pizza': 'Pizza',
    'donut': 'Donut',
    'cake': 'Gâteau',
    'chair': 'Chaise',
    'couch': 'Canapé / Fauteuil',
    'potted plant': 'Plante en pot',
    'bed': 'Lit',
    'dining table': 'Table',
    'toilet': 'Toilettes',
    'tv': 'Tableau / Écran',
    'laptop': 'Ordinateur portable',
    'mouse': 'Souris d\'ordinateur',
    'remote': 'Télécommande',
    'keyboard': 'Clavier',
    'cell phone': 'Téléphone portable',
    'microwave': 'Micro-ondes',
    'oven': 'Four',
    'toaster': 'Grille-pain',
    'sink': 'Évier / Lavabo',
    'refrigerator': 'Réfrigérateur',
    'book': 'Livre / Manuel',
    'clock': 'Horloge',
    'vase': 'Vase',
    'scissors': 'Ciseaux',
    'teddy bear': 'Ours en peluche',
    'hair drier': 'Sèche-cheveux',
    'toothbrush': 'Brosse à dents'
};

// Palette de couleurs pour les boîtes de détection par catégorie
const CATEGORY_COLORS = {
    'chair': '#3b82f6',        // Bleu
    'dining table': '#10b981', // Vert émeraude
    'tv': '#8b5cf6',          // Violet
    'laptop': '#f59e0b',      // Ambre / Orange
    'book': '#ec4899',        // Rose
    'person': '#06b6d4',      // Cyan
    'backpack': '#6366f1',    // Indigo
    'cell phone': '#14b8a6',  // Sarcelle
    'bottle': '#84cc16',      // Citron vert
    'cup': '#a855f7',         // Violet doux
    'mouse': '#eab308',       // Jaune
    'keyboard': '#64748b',    // Ardoise
    'default': '#0284c7'      // Bleu ciel par défaut
};

// ============================================================================
// 2. CONFIGURATION INITIALE DE L'AUDIT DE SALLE DE CLASSE
// Configuration théorique par défaut : 10 tables, 20 chaises, 1 tableau, 5 PC
// ============================================================================
const DEFAULT_AUDIT_RULES = [
    { key: 'dining table', labelFr: 'Tables', expected: 10, icon: 'bi-table', note: 'Mobilier de travail principal' },
    { key: 'chair', labelFr: 'Chaises', expected: 20, icon: 'bi-chair', note: 'Assises élèves' },
    { key: 'tv', labelFr: 'Tableaux / Écrans', expected: 1, icon: 'bi-display', note: 'Assimilé au tableau interactif / moniteur' },
    { key: 'laptop', labelFr: 'Ordinateurs portables', expected: 5, icon: 'bi-laptop', note: 'Postes informatiques portables' }
];

// État actif de l'application
const AppState = {
    model: null,
    isModelLoading: true,
    isStreaming: false,
    isFrozen: false,
    mediaStream: null,
    animationFrameId: null,
    confidenceThreshold: 0.35, // Seuil par défaut à 35% (recommandé pour mobilier de classe avec occlusions)
    
    // Règles d'audit actives (clonées au démarrage)
    auditRules: JSON.parse(JSON.stringify(DEFAULT_AUDIT_RULES)),
    
    // Dernières prédictions filtrées
    latestPredictions: [],
    
    // Dictionnaire des comptages d'objets actuellement détectés : { 'chair': 12, 'tv': 1, ... }
    currentDetectedCounts: {},
    
    // Métriques de performance
    fps: 0,
    frameCount: 0,
    lastFpsUpdateTime: performance.now(),
    inferenceLatencyMs: 0,

    // Mode Chaises Renforcé (fusionne bancs et fauteuils, seuil tolérant)
    enhancedChairMode: true,
    rawPredictionsCache: [],

    // Historique des médias importés dans la session
    importedMediaHistory: [],
    activeImportedMedia: null
};

// ============================================================================
// 3. ÉLÉMENTS DU DOM
// ============================================================================
const DOM = {
    webcam: document.getElementById('webcam'),
    canvas: document.getElementById('canvasOverlay'),
    canvasCtx: document.getElementById('canvasOverlay').getContext('2d'),
    cameraStandbyScreen: document.getElementById('cameraStandbyScreen'),
    btnStartCameraOverlay: document.getElementById('btnStartCameraOverlay'),
    overlayBtnSpinner: document.getElementById('overlayBtnSpinner'),
    liveFeedTag: document.getElementById('liveFeedTag'),
    freezeIndicator: document.getElementById('freezeIndicator'),
    
    // Boutons de contrôle
    btnStartCamera: document.getElementById('btnStartCamera'),
    btnStopCamera: document.getElementById('btnStopCamera'),
    btnFreezeFrame: document.getElementById('btnFreezeFrame'),
    freezeBtnText: document.getElementById('freezeBtnText'),
    btnSaveCapture: document.getElementById('btnSaveCapture'),
    cameraSelect: document.getElementById('cameraSelect'),
    confidenceRange: document.getElementById('confidenceRange'),
    confidenceValueDisplay: document.getElementById('confidenceValueDisplay'),
    
    // Badges statut supérieur
    modelStatusBadge: document.getElementById('modelStatusBadge'),
    modelStatusText: document.getElementById('modelStatusText'),
    cameraStatusBadge: document.getElementById('cameraStatusBadge'),
    cameraStatusText: document.getElementById('cameraStatusText'),
    
    // Compteurs FPS & Latence
    fpsCounter: document.getElementById('fpsCounter'),
    latencyCounter: document.getElementById('latencyCounter'),
    
    // KPIs du tableau de bord
    kpiTotalDetected: document.getElementById('kpiTotalDetected'),
    kpiCategoriesCount: document.getElementById('kpiCategoriesCount'),
    kpiRulesCount: document.getElementById('kpiRulesCount'),
    kpiDiscrepanciesCount: document.getElementById('kpiDiscrepanciesCount'),
    kpiDiscrepanciesIcon: document.getElementById('kpiDiscrepanciesIcon'),
    globalStatusBanner: document.getElementById('globalStatusBanner'),
    globalStatusTitle: document.getElementById('globalStatusTitle'),
    globalStatusDesc: document.getElementById('globalStatusDesc'),
    globalStatusIcon: document.getElementById('globalStatusIcon'),
    detectedItemsPills: document.getElementById('detectedItemsPills'),
    detectedBadgeCount: document.getElementById('detectedBadgeCount'),
    
    // Tableau d'audit
    auditTableBody: document.getElementById('auditTableBody'),
    btnResetConfig: document.getElementById('btnResetConfig'),
    btnOpenAddRuleModal: document.getElementById('btnOpenAddRuleModal'),
    
    // Modal ajout de règle
    newRuleCategorySelect: document.getElementById('newRuleCategorySelect'),
    newRuleQuantityInput: document.getElementById('newRuleQuantityInput'),
    btnAddRuleConfirm: document.getElementById('btnAddRuleConfirm'),
    
    // Rapport d'audit
    reportContentArea: document.getElementById('reportContentArea'),
    btnGenerateReport: document.getElementById('btnGenerateReport'),
    btnCopyReport: document.getElementById('btnCopyReport'),
    btnDownloadReport: document.getElementById('btnDownloadReport'),
    btnPrintReport: document.getElementById('btnPrintReport'),
    
    // Importation fichier (photo / vidéo)
    fileImportInput: document.getElementById('fileImportInput'),
    btnImportFile: document.getElementById('btnImportFile'),
    btnClearImport: document.getElementById('btnClearImport'),
    importedImage: document.getElementById('importedImage'),

    // Carte d'aperçu du média importé
    importedMediaPreviewCard: document.getElementById('importedMediaPreviewCard'),
    importedMediaBadge: document.getElementById('importedMediaBadge'),
    importedMediaThumbImg: document.getElementById('importedMediaThumbImg'),
    importedMediaThumbVideo: document.getElementById('importedMediaThumbVideo'),
    importedMediaName: document.getElementById('importedMediaName'),
    importedMediaDimensions: document.getElementById('importedMediaDimensions'),
    importedMediaSize: document.getElementById('importedMediaSize'),
    importedMediaCount: document.getElementById('importedMediaCount'),
    btnReanalyzeMedia: document.getElementById('btnReanalyzeMedia'),
    importedMediaHistoryStrip: document.getElementById('importedMediaHistoryStrip'),
    importedMediaHistoryList: document.getElementById('importedMediaHistoryList'),
    importedMediaDetectionsList: document.getElementById('importedMediaDetectionsList'),
    importedMediaCategorySummary: document.getElementById('importedMediaCategorySummary'),

    // Liste détaillée des détections temps réel caméra
    liveDetectionsDetailList: document.getElementById('liveDetectionsDetailList'),
    liveDetectionObjectsCount: document.getElementById('liveDetectionObjectsCount'),

    // Mode chaises renforcé
    enhancedChairMode: document.getElementById('enhancedChairMode'),

    // Alertes
    alertContainer: document.getElementById('alertContainer')
};

// ============================================================================
// 4. INITIALISATION DE L'APPLICATION
// ============================================================================
document.addEventListener('DOMContentLoaded', async () => {
    setupEventListeners();
    populateCategoryModalSelect();
    renderAuditTable();
    updateDashboard();
    generateReportPreview();
    await loadCocoSsdModel();
    await populateCameraDevices();
});

/**
 * Configure les écouteurs d'événements de l'interface
 */
function setupEventListeners() {
    // Boutons de contrôle de la caméra
    DOM.btnStartCamera.addEventListener('click', startCamera);
    DOM.btnStartCameraOverlay.addEventListener('click', startCamera);
    DOM.btnStopCamera.addEventListener('click', stopCamera);
    DOM.btnFreezeFrame.addEventListener('click', toggleFreezeFrame);
    if (DOM.btnSaveCapture) {
        DOM.btnSaveCapture.addEventListener('click', saveCaptureToDB);
    }
    
    // Sélecteur de périphérique caméra
    DOM.cameraSelect.addEventListener('change', async () => {
        if (AppState.isStreaming) {
            stopCamera();
            await startCamera();
        }
    });

    // Slider de seuil de confiance
    DOM.confidenceRange.addEventListener('input', (e) => {
        const val = parseInt(e.target.value, 10);
        AppState.confidenceThreshold = val / 100;
        DOM.confidenceValueDisplay.textContent = `${val}%`;
        
        // Si l'image est figée ou un média importé actif, redessiner immédiatement
        if (AppState.rawPredictionsCache && AppState.rawPredictionsCache.length > 0) {
            const filtered = filterAndMapPredictions(AppState.rawPredictionsCache);
            AppState.latestPredictions = filtered;
            processAndRenderPredictions(filtered);
            if (AppState.activeImportedMedia) {
                updateImportedMediaPreviewCard(AppState.activeImportedMedia, filtered.length);
            }
        }
    });

    // Option : Mode Chaises Renforcé
    if (DOM.enhancedChairMode) {
        DOM.enhancedChairMode.addEventListener('change', (e) => {
            AppState.enhancedChairMode = e.target.checked;
            showAlert(
                AppState.enhancedChairMode 
                    ? 'Mode Chaises Renforcé activé (bancs & fauteuils inclus comme assises).'
                    : 'Mode Chaises Standard (détection stricte de la classe chair uniquement).',
                'info',
                2500
            );
            if (AppState.rawPredictionsCache && AppState.rawPredictionsCache.length > 0) {
                const filtered = filterAndMapPredictions(AppState.rawPredictionsCache);
                AppState.latestPredictions = filtered;
                processAndRenderPredictions(filtered);
                if (AppState.activeImportedMedia) {
                    updateImportedMediaPreviewCard(AppState.activeImportedMedia, filtered.length);
                }
            }
        });
    }

    // Bouton réanalyser le média importé
    if (DOM.btnReanalyzeMedia) {
        DOM.btnReanalyzeMedia.addEventListener('click', reanalyzeActiveMedia);
    }

    // Bouton de réinitialisation de la configuration théorique
    DOM.btnResetConfig.addEventListener('click', () => {
        AppState.auditRules = JSON.parse(JSON.stringify(DEFAULT_AUDIT_RULES));
        renderAuditTable();
        updateDashboard();
        showAlert('Configuration réinitialisée aux valeurs de référence (10 tables, 20 chaises, 1 tableau, 5 PC).', 'info', 3000);
    });

    // Modal d'ajout de règle personnalisée
    DOM.btnAddRuleConfirm.addEventListener('click', handleAddNewRule);

    // Boutons du rapport d'audit
    DOM.btnGenerateReport.addEventListener('click', () => {
        generateReportPreview();
        showAlert('Rapport d\'audit actualisé avec succès avec les métriques courantes.', 'success', 2500);
    });

    DOM.btnCopyReport.addEventListener('click', copyReportToClipboard);
    DOM.btnDownloadReport.addEventListener('click', downloadReportFile);
    DOM.btnPrintReport.addEventListener('click', () => window.print());

    // Bouton import photo / vidéo
    DOM.btnImportFile.addEventListener('click', () => DOM.fileImportInput.click());
    DOM.fileImportInput.addEventListener('change', handleFileImport);
    DOM.btnClearImport.addEventListener('click', clearImportedMedia);

    // Ajustement dynamique du canvas lors du redimensionnement de la fenêtre
    window.addEventListener('resize', syncCanvasDimensions);
}

// ============================================================================
// 5. CHARGEMENT DU MODÈLE TENSORFLOW.JS COCO-SSD
// ============================================================================
async function loadCocoSsdModel() {
    try {
        updateModelStatus('loading', 'Chargement du modèle COCO-SSD...');
        
        // Chargement du modèle coco-ssd officiel (lite_mobilenet_v2 supporté officiellement)
        AppState.model = await cocoSsd.load({
            base: 'lite_mobilenet_v2'
        });
        
        AppState.isModelLoading = false;
        updateModelStatus('ready', 'Modèle COCO-SSD prêt');
        
        // Activer les boutons de démarrage et d'import
        DOM.btnStartCamera.disabled = false;
        DOM.btnStartCameraOverlay.disabled = false;
        DOM.overlayBtnSpinner.classList.add('d-none');
        DOM.btnImportFile.disabled = false;

        // Si une image importée est déjà présente à l'écran, lancer l'analyse maintenant
        if (AppState.activeImportedMedia) {
            reanalyzeActiveMedia();
        }
        
    } catch (error) {
        console.error('Erreur lors du chargement de COCO-SSD :', error);
        AppState.isModelLoading = false;
        updateModelStatus('error', 'Échec du chargement IA');
        showAlert(
            `<strong>Erreur d'initialisation du modèle IA :</strong> Impossible de charger COCO-SSD depuis le CDN.<br>Détail : ${error.message}. Vérifiez votre connexion Internet et rechargez la page.`,
            'danger'
        );
    }
}

/**
 * Met à jour le badge de statut du modèle dans la barre supérieure
 */
function updateModelStatus(status, text) {
    DOM.modelStatusText.textContent = text;
    DOM.modelStatusBadge.className = 'badge d-flex align-items-center gap-1 px-3 py-2';

    if (status === 'loading') {
        DOM.modelStatusBadge.classList.add('bg-warning-subtle', 'text-warning', 'border', 'border-warning-subtle');
        DOM.modelStatusBadge.innerHTML = `<span class="spinner-border spinner-border-sm" role="status"></span> <span>${text}</span>`;
    } else if (status === 'ready') {
        DOM.modelStatusBadge.classList.add('bg-success-subtle', 'text-success', 'border', 'border-success-subtle');
        DOM.modelStatusBadge.innerHTML = `<i class="bi bi-check-circle-fill"></i> <span>${text}</span>`;
    } else {
        DOM.modelStatusBadge.classList.add('bg-danger-subtle', 'text-danger', 'border', 'border-danger-subtle');
        DOM.modelStatusBadge.innerHTML = `<i class="bi bi-exclamation-triangle-fill"></i> <span>${text}</span>`;
    }
}

// ============================================================================
// 6. GESTION DU FLUX CAMÉRA (WEBCAM API)
// ============================================================================

/**
 * Récupère les périphériques vidéo disponibles et remplit le sélecteur
 */
async function populateCameraDevices() {
    if (!navigator.mediaDevices || !navigator.mediaDevices.enumerateDevices) return;
    
    try {
        const devices = await navigator.mediaDevices.enumerateDevices();
        const videoDevices = devices.filter(d => d.kind === 'videoinput');
        
        if (videoDevices.length > 0) {
            DOM.cameraSelect.innerHTML = '';
            videoDevices.forEach((device, index) => {
                const opt = document.createElement('option');
                opt.value = device.deviceId;
                opt.textContent = device.label || `Caméra ${index + 1}`;
                DOM.cameraSelect.appendChild(opt);
            });
            DOM.cameraSelect.disabled = false;
        }
    } catch (err) {
        console.warn('Impossible de lister les caméras :', err);
    }
}

/**
 * Affiche l'écran de veille avec certitude (override Bootstrap)
 */
function showStandbyScreen() {
    if (!DOM.cameraStandbyScreen) return;
    DOM.cameraStandbyScreen.classList.remove('d-none');
    DOM.cameraStandbyScreen.style.setProperty('display', 'flex', 'important');
}

/**
 * Masque l'écran de veille avec certitude (override Bootstrap)
 */
function hideStandbyScreen() {
    if (!DOM.cameraStandbyScreen) return;
    DOM.cameraStandbyScreen.classList.add('d-none');
    DOM.cameraStandbyScreen.style.setProperty('display', 'none', 'important');
}

/**
 * Démarre la capture de la webcam et la boucle d'inférence
 */
async function startCamera() {
    if (AppState.isModelLoading || !AppState.model) {
        showAlert('Veuillez patienter pendant le chargement du modèle COCO-SSD.', 'warning', 3000);
        return;
    }

    try {
        // Contraintes média : résolution HD recommandée
        const selectedDeviceId = DOM.cameraSelect.value;
        const constraints = {
            video: {
                width: { ideal: 1280 },
                height: { ideal: 720 },
                facingMode: selectedDeviceId ? undefined : { ideal: 'environment' },
                deviceId: selectedDeviceId ? { exact: selectedDeviceId } : undefined
            },
            audio: false
        };

        const stream = await navigator.mediaDevices.getUserMedia(constraints);
        AppState.mediaStream = stream;

        // Safari: set srcObject then force play after loadeddata (not loadedmetadata)
        DOM.webcam.srcObject = stream;
        DOM.webcam.setAttribute('playsinline', '');
        DOM.webcam.setAttribute('webkit-playsinline', '');
        DOM.webcam.muted = true;

        // Attendre que la vidéo ait ses vraies dimensions (loadeddata plus fiable que loadedmetadata sur Safari)
        await new Promise((resolve, reject) => {
            const timeout = setTimeout(() => reject(new Error('Timeout vidéo')), 10000);
            DOM.webcam.onloadeddata = async () => {
                clearTimeout(timeout);
                try { await DOM.webcam.play(); } catch(e) { /* autoplay policy */ }
                resolve();
            };
            DOM.webcam.onerror = () => { clearTimeout(timeout); reject(new Error('Erreur flux vidéo')); };
        });

        // Forcer la visibilité de la vidéo (Safari ne redimensionne pas automatiquement)
        DOM.webcam.style.display = 'block';
        DOM.webcam.style.width = '100%';
        DOM.webcam.style.height = 'auto';

        AppState.isStreaming = true;
        AppState.isFrozen = false;

        // Synchroniser le canvas après un court délai pour que Safari ait bien les dimensions
        await new Promise(r => setTimeout(r, 150));
        syncCanvasDimensions();

        // Mettre à jour l'interface
        hideStandbyScreen();
        DOM.liveFeedTag.classList.remove('d-none');
        DOM.liveFeedTag.classList.add('d-flex');
        DOM.freezeIndicator.classList.add('d-none');
        DOM.freezeBtnText.textContent = 'Figer / Capturer';

        DOM.btnStartCamera.disabled = true;
        DOM.btnStopCamera.disabled = false;
        DOM.btnFreezeFrame.disabled = false;
        if (DOM.btnSaveCapture) DOM.btnSaveCapture.disabled = false;
        
        DOM.cameraStatusBadge.className = 'badge bg-success-subtle text-success border border-success-subtle d-flex align-items-center gap-1 px-3 py-2';
        DOM.cameraStatusBadge.innerHTML = `<i class="bi bi-camera-video-fill"></i> <span>Caméra active</span>`;

        // Rafraîchir les labels des périphériques si c'était la première autorisation
        await populateCameraDevices();

        // Lancer la boucle de détection
        AppState.lastFpsUpdateTime = performance.now();
        AppState.frameCount = 0;
        requestAnimationFrame(detectionLoop);

        showAlert('Caméra activée. Détection IA temps réel en cours d\'exécution...', 'success', 2500);

    } catch (err) {
        console.error('Erreur d\'accès caméra :', err);
        let errorMsg = 'Impossible d\'accéder à la webcam.';
        
        if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
            errorMsg = '<strong>Accès refusé :</strong> Vous devez autoriser le navigateur à utiliser la caméra pour démarrer l\'analyse.';
        } else if (err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError') {
            errorMsg = '<strong>Aucune caméra trouvée :</strong> Veuillez brancher une webcam ou vérifier vos pilotes vidéo.';
        } else if (err.name === 'NotReadableError' || err.name === 'TrackStartError') {
            errorMsg = '<strong>Périphérique occupé :</strong> La webcam est déjà utilisée par une autre application (ex: Teams, Zoom).';
        }

        showAlert(errorMsg, 'danger');
        stopCamera();
    }
}

/**
 * Arrête le flux vidéo de la caméra et libère les ressources
 */
function stopCamera() {
    if (AppState.mediaStream) {
        AppState.mediaStream.getTracks().forEach(track => track.stop());
        AppState.mediaStream = null;
    }

    if (AppState.animationFrameId) {
        cancelAnimationFrame(AppState.animationFrameId);
        AppState.animationFrameId = null;
    }

    AppState.isStreaming = false;
    AppState.isFrozen = false;
    DOM.webcam.srcObject = null;

    // Réinitialiser le canvas
    clearCanvas();

    // Mettre à jour l'interface
    showStandbyScreen();
    DOM.liveFeedTag.classList.add('d-none');
    DOM.liveFeedTag.classList.remove('d-flex');
    DOM.freezeIndicator.classList.add('d-none');
    
    DOM.btnStartCamera.disabled = false;
    DOM.btnStopCamera.disabled = true;
    DOM.btnFreezeFrame.disabled = true;
    if (DOM.btnSaveCapture && DOM.importedImage.style.display !== 'block') {
        DOM.btnSaveCapture.disabled = true;
    }

    DOM.cameraStatusBadge.className = 'badge bg-secondary-subtle text-secondary border d-flex align-items-center gap-1 px-3 py-2';
    DOM.cameraStatusBadge.innerHTML = `<i class="bi bi-camera-video-off"></i> <span>Caméra arrêtée</span>`;

    DOM.fpsCounter.textContent = '0 FPS';
    DOM.latencyCounter.textContent = '0 ms';

    // Conserver les dernières données dans le rapport mais mettre le statut en attente
    updateDashboard();
}

// ============================================================================
// IMPORT PHOTO / VIDÉO (Fonctionnalité ajoutée)
// ============================================================================
// 6. GESTION DES PRÉDICTIONS & MODE CHAISES RENFORCÉ
// ============================================================================

/**
 * Filtre et mappe les prédictions COCO-SSD en appliquant les règles métier
 * et la compensation d'occlusion pour les chaises.
 */
function filterAndMapPredictions(rawPredictions) {
    if (!rawPredictions || !Array.isArray(rawPredictions)) return [];

    return rawPredictions.map(p => {
        let pClass = p.class;
        // Mode chaises renforcé : si banc d'amphi ou fauteuil, assimiler à une chaise
        if (AppState.enhancedChairMode && (pClass === 'bench' || pClass === 'couch')) {
            pClass = 'chair';
        }
        return { ...p, class: pClass, originalClass: p.class };
    }).filter(p => {
        // En mode renforcé, seuil très tolérant pour les chaises (occlusion forte dans les salles de classe)
        if (AppState.enhancedChairMode && p.class === 'chair') {
            const chairThreshold = Math.max(0.12, AppState.confidenceThreshold - 0.28);
            return p.score >= chairThreshold;
        }
        return p.score >= AppState.confidenceThreshold;
    });
}

/**
 * Détection multi-échelles (Tiling) pour capturer les chaises distantes ou partiellement masquées
 */
async function detectWithMultiScale(imageElement) {
    if (!AppState.model || !imageElement) return [];

    // 1. Détection globale sur l'image entière
    let allPredictions = await AppState.model.detect(imageElement);

    const nw = imageElement.naturalWidth || imageElement.videoWidth || imageElement.width;
    const nh = imageElement.naturalHeight || imageElement.videoHeight || imageElement.height;

    // Si l'image a une résolution suffisante, découper 3 sous-zones pour grossir les chaises de rangées arrière
    if (nw >= 480 && nh >= 360) {
        try {
            const offCanvas = document.createElement('canvas');
            const offCtx = offCanvas.getContext('2d');

            // Zones ciblées où se concentrent les rangées de tables et chaises
            const patches = [
                { x: 0, y: 0, w: Math.round(nw * 0.58), h: nh },
                { x: Math.round(nw * 0.42), y: 0, w: Math.round(nw * 0.58), h: nh },
                { x: 0, y: Math.round(nh * 0.25), w: nw, h: Math.round(nh * 0.75) }
            ];

            for (const patch of patches) {
                offCanvas.width = patch.w;
                offCanvas.height = patch.h;
                offCtx.drawImage(imageElement, patch.x, patch.y, patch.w, patch.h, 0, 0, patch.w, patch.h);

                const patchPreds = await AppState.model.detect(offCanvas);
                // Réajuster les coordonnées de la boîte englobante vers l'image complète
                patchPreds.forEach(p => {
                    const [px, py, pw, ph] = p.bbox;
                    allPredictions.push({
                        ...p,
                        bbox: [px + patch.x, py + patch.y, pw, ph]
                    });
                });
            }

            // Supprimer les détections redondantes avec Non-Maximum Suppression
            allPredictions = applyNms(allPredictions, 0.42);
        } catch (err) {
            console.warn('Tiling multi-scale error:', err);
        }
    }

    return allPredictions;
}

/**
 * Non-Maximum Suppression (NMS) pour fusionner les boîtes englobantes qui se chevauchent
 */
function applyNms(predictions, iouThreshold = 0.42) {
    if (!predictions || predictions.length <= 1) return predictions || [];
    const sorted = [...predictions].sort((a, b) => b.score - a.score);
    const selected = [];

    while (sorted.length > 0) {
        const best = sorted.shift();
        selected.push(best);

        for (let i = sorted.length - 1; i >= 0; i--) {
            const candidate = sorted[i];
            const isSameClass = best.class === candidate.class;
            if (isSameClass && calculateIoU(best.bbox, candidate.bbox) > iouThreshold) {
                sorted.splice(i, 1);
            }
        }
    }
    return selected;
}

/**
 * Calcul du ratio d'Intersection over Union (IoU) entre deux boîtes englobantes
 */
function calculateIoU(bbox1, bbox2) {
    const [x1, y1, w1, h1] = bbox1;
    const [x2, y2, w2, h2] = bbox2;

    const xi1 = Math.max(x1, x2);
    const yi1 = Math.max(y1, y2);
    const xi2 = Math.min(x1 + w1, x2 + w2);
    const yi2 = Math.min(y1 + h1, y2 + h2);

    const interArea = Math.max(0, xi2 - xi1) * Math.max(0, yi2 - yi1);
    if (interArea === 0) return 0;

    const area1 = w1 * h1;
    const area2 = w2 * h2;
    const unionArea = area1 + area2 - interArea;

    return unionArea > 0 ? interArea / unionArea : 0;
}

function formatBytes(bytes) {
    if (!bytes || bytes === 0) return '0 Ko';
    const k = 1024;
    const sizes = ['Octets', 'Ko', 'Mo', 'Go'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
}

/**
 * Met à jour la carte d'aperçu du média importé (Grand format et détail)
 */
function updateImportedMediaPreviewCard(mediaItem, detectionCount, predictions = []) {
    if (!DOM.importedMediaPreviewCard) return;

    DOM.importedMediaPreviewCard.classList.remove('d-none');
    DOM.importedMediaBadge.textContent = mediaItem.type === 'image' ? 'Photo' : 'Vidéo';
    DOM.importedMediaName.textContent = mediaItem.name;
    DOM.importedMediaDimensions.textContent = mediaItem.dimensions || '- x - px';
    DOM.importedMediaSize.textContent = mediaItem.size || '- Ko';
    DOM.importedMediaCount.textContent = `${detectionCount} objet(s) détecté(s)`;

    if (mediaItem.type === 'image') {
        DOM.importedMediaThumbImg.src = mediaItem.url;
        DOM.importedMediaThumbImg.classList.remove('d-none');
        DOM.importedMediaThumbVideo.classList.add('d-none');
    } else {
        DOM.importedMediaThumbVideo.src = mediaItem.url;
        DOM.importedMediaThumbVideo.classList.remove('d-none');
        DOM.importedMediaThumbImg.classList.add('d-none');
    }

    // Afficher le détail des détections pour ce média
    renderImportedMediaDetailList(predictions.length > 0 ? predictions : AppState.latestPredictions);
    renderMediaHistoryStrip();
}

/**
 * Affiche la liste détaillée de chaque objet détecté sur le média importé
 */
function renderImportedMediaDetailList(predictions) {
    if (!DOM.importedMediaDetectionsList) return;

    if (!predictions || predictions.length === 0) {
        DOM.importedMediaDetectionsList.innerHTML = '<span class="text-muted small p-2 italic">Aucun objet détecté avec le seuil actuel.</span>';
        if (DOM.importedMediaCategorySummary) DOM.importedMediaCategorySummary.textContent = '0 catégorie';
        return;
    }

    const categories = new Set(predictions.map(p => p.class));
    if (DOM.importedMediaCategorySummary) {
        DOM.importedMediaCategorySummary.textContent = `${categories.size} catégorie${categories.size > 1 ? 's' : ''} • ${predictions.length} objet${predictions.length > 1 ? 's' : ''} au total`;
    }

    let html = '';
    const sorted = [...predictions].sort((a, b) => b.score - a.score);

    sorted.forEach((p, idx) => {
        const labelFr = COCO_TRANSLATIONS_FR[p.class] || p.class;
        const color = CATEGORY_COLORS[p.class] || '#64748b';
        const scorePct = Math.round(p.score * 100);
        const [x, y, w, h] = p.bbox.map(Math.round);

        let scoreClass = 'bg-success text-white';
        if (scorePct < 60) scoreClass = 'bg-warning text-dark';
        else if (scorePct < 80) scoreClass = 'bg-info text-dark';

        html += `
            <div class="detection-detail-item">
                <div class="d-flex align-items-center gap-2">
                    <span class="legend-dot" style="background-color: ${color}"></span>
                    <strong class="text-dark">#${idx + 1} ${labelFr}</strong>
                    ${p.originalClass && p.originalClass !== p.class ? `<span class="badge bg-secondary-subtle text-secondary fs-xs">ex-${p.originalClass}</span>` : ''}
                </div>
                <div class="d-flex align-items-center gap-2">
                    <span class="text-muted font-monospace fs-xs d-none d-sm-inline">[${x}, ${y}, ${w}×${h}px]</span>
                    <span class="detection-score-pill ${scoreClass}">${scorePct}%</span>
                </div>
            </div>
        `;
    });

    DOM.importedMediaDetectionsList.innerHTML = html;
}

/**
 * Affiche la bande de miniatures des médias récemment importés
 */
function renderMediaHistoryStrip() {
    if (!DOM.importedMediaHistoryStrip || !DOM.importedMediaHistoryList) return;
    if (AppState.importedMediaHistory.length <= 1) {
        DOM.importedMediaHistoryStrip.classList.add('d-none');
        return;
    }

    DOM.importedMediaHistoryStrip.classList.remove('d-none');
    DOM.importedMediaHistoryList.innerHTML = '';

    AppState.importedMediaHistory.forEach(item => {
        const div = document.createElement('div');
        div.className = `thumb-history-item ${AppState.activeImportedMedia?.id === item.id ? 'active' : ''}`;
        div.title = `${item.name} (${item.type === 'image' ? 'Photo' : 'Vidéo'})`;
        if (item.type === 'image') {
            div.innerHTML = `<img src="${item.url}" alt="${item.name}">`;
        } else {
            div.innerHTML = `<video src="${item.url}" muted></video>`;
        }
        div.addEventListener('click', () => loadMediaItem(item));
        DOM.importedMediaHistoryList.appendChild(div);
    });
}

/**
 * Charge un média issu de l'historique de session
 */
async function loadMediaItem(item) {
    AppState.activeImportedMedia = item;
    clearCanvas();

    if (item.type === 'image') {
        if (AppState.isStreaming) stopCamera();
        DOM.webcam.style.display = 'none';
        DOM.importedImage.style.display = 'block';
        DOM.importedImage.src = item.url;
        hideStandbyScreen();

        await new Promise(r => { DOM.importedImage.onload = r; });
        syncCanvasDimensions();

        const rawPredictions = await detectWithMultiScale(DOM.importedImage);
        AppState.rawPredictionsCache = rawPredictions;
        const filtered = filterAndMapPredictions(rawPredictions);
        AppState.latestPredictions = filtered;
        processAndRenderPredictions(filtered);

        DOM.btnClearImport.classList.remove('d-none');
        DOM.btnClearImport.classList.add('d-inline-flex');
        if (DOM.btnSaveCapture) DOM.btnSaveCapture.disabled = false;
        updateImportedMediaPreviewCard(item, filtered.length);
        showAlert(`Média "${item.name}" chargé depuis l'historique.`, 'info', 2000);
    }
}

/**
 * Réanalyse le média actif (utilisé lors du changement de seuil ou de mode chaises)
 */
async function reanalyzeActiveMedia() {
    if (!AppState.activeImportedMedia) return;

    if (AppState.activeImportedMedia.type === 'image') {
        const rawPredictions = await detectWithMultiScale(DOM.importedImage);
        AppState.rawPredictionsCache = rawPredictions;
        const filtered = filterAndMapPredictions(rawPredictions);
        AppState.latestPredictions = filtered;
        processAndRenderPredictions(filtered);
        updateImportedMediaPreviewCard(AppState.activeImportedMedia, filtered.length);
        showAlert(`Réanalyse terminée : ${filtered.length} objet(s) détecté(s).`, 'success', 2000);
    }
}

/**
 * Gère l'import d'une image ou vidéo locale et lance la détection dessus
 */
async function handleFileImport(e) {
    const file = e.target.files[0];
    if (!file) return;

    const isImage = file.type.startsWith('image/');
    const isVideo = file.type.startsWith('video/');

    if (!isImage && !isVideo) {
        showAlert('Format non supporté. Importez une image (JPG, PNG, WEBP) ou une vidéo (MP4, MOV, WEBM).', 'danger', 4000);
        return;
    }

    // Arrêter la caméra si elle tourne
    if (AppState.isStreaming) stopCamera();

    const objectUrl = URL.createObjectURL(file);
    clearCanvas();

    const mediaItem = {
        id: Date.now(),
        file,
        name: file.name,
        type: isImage ? 'image' : 'video',
        url: objectUrl,
        size: formatBytes(file.size),
        dimensions: ''
    };

    AppState.activeImportedMedia = mediaItem;
    // Ajouter à l'historique s'il n'existe pas déjà
    if (!AppState.importedMediaHistory.some(m => m.name === mediaItem.name && m.size === mediaItem.size)) {
        AppState.importedMediaHistory.push(mediaItem);
    }

    if (isImage) {
        // --- Cas IMAGE ---
        // Masquer la webcam et le standby immédiatement
        DOM.webcam.style.display = 'none';
        DOM.importedImage.style.display = 'block';
        DOM.importedImage.src = objectUrl;
        hideStandbyScreen();
        DOM.btnClearImport.classList.remove('d-none');
        DOM.btnClearImport.classList.add('d-inline-flex');

        await new Promise((resolve) => {
            DOM.importedImage.onload = resolve;
        });

        mediaItem.dimensions = `${DOM.importedImage.naturalWidth} x ${DOM.importedImage.naturalHeight} px`;

        // Synchroniser canvas sur les dimensions réelles de l'image
        syncCanvasDimensions();

        if (AppState.model) {
            // Lancer la détection multi-échelles sur l'image pour maximiser la détection des chaises
            const rawPredictions = await detectWithMultiScale(DOM.importedImage);
            AppState.rawPredictionsCache = rawPredictions;
            const filtered = filterAndMapPredictions(rawPredictions);
            AppState.latestPredictions = filtered;
            processAndRenderPredictions(filtered);
            if (DOM.btnSaveCapture) DOM.btnSaveCapture.disabled = false;

            // Mettre à jour la carte d'aperçu
            updateImportedMediaPreviewCard(mediaItem, filtered.length);
            showAlert(`Image importée : ${file.name}. ${filtered.length} objet(s) détecté(s).`, 'success', 3000);
        } else {
            updateImportedMediaPreviewCard(mediaItem, 0);
            showAlert(`Image importée : ${file.name}. Analyse automatique dès que le modèle IA est prêt...`, 'info', 3000);
        }

    } else if (isVideo) {
        // --- Cas VIDÉO ---
        DOM.importedImage.style.display = 'none';
        DOM.webcam.style.display = 'block';
        DOM.webcam.srcObject = null;
        DOM.webcam.src = objectUrl;
        DOM.webcam.loop = true;
        DOM.webcam.muted = true;
        DOM.webcam.setAttribute('playsinline', '');
        DOM.webcam.setAttribute('webkit-playsinline', '');
        hideStandbyScreen();

        await new Promise((resolve) => {
            DOM.webcam.onloadeddata = async () => {
                try { await DOM.webcam.play(); } catch(e) {}
                resolve();
            };
        });

        mediaItem.dimensions = `${DOM.webcam.videoWidth} x ${DOM.webcam.videoHeight} px`;

        await new Promise(r => setTimeout(r, 150));
        syncCanvasDimensions();

        AppState.isStreaming = true;
        AppState.isFrozen = false;
        DOM.liveFeedTag.classList.remove('d-none');
        DOM.liveFeedTag.classList.add('d-flex');
        DOM.btnStopCamera.disabled = false;
        DOM.btnFreezeFrame.disabled = false;
        if (DOM.btnSaveCapture) DOM.btnSaveCapture.disabled = false;
        DOM.btnClearImport.classList.remove('d-none');
        DOM.btnClearImport.classList.add('d-inline-flex');

        DOM.cameraStatusBadge.className = 'badge bg-info-subtle text-info border border-info-subtle d-flex align-items-center gap-1 px-3 py-2';
        DOM.cameraStatusBadge.innerHTML = `<i class="bi bi-film"></i> <span>Vidéo importée</span>`;

        AppState.lastFpsUpdateTime = performance.now();
        AppState.frameCount = 0;
        requestAnimationFrame(detectionLoop);

        // Mettre à jour la carte d'aperçu
        updateImportedMediaPreviewCard(mediaItem, 0);
        showAlert(`Vidéo importée : ${file.name}. Détection IA en cours...`, 'info', 3000);
    }

    // Réinitialiser le champ file pour permettre de réimporter le même fichier
    DOM.fileImportInput.value = '';
}

/**
 * Supprime le média importé et revient à l'écran d'attente
 */
function clearImportedMedia() {
    // Arrêter la vidéo importée si en cours
    if (!DOM.webcam.srcObject && DOM.webcam.src) {
        AppState.isStreaming = false;
        if (AppState.animationFrameId) {
            cancelAnimationFrame(AppState.animationFrameId);
            AppState.animationFrameId = null;
        }
        DOM.webcam.pause();
        URL.revokeObjectURL(DOM.webcam.src);
        DOM.webcam.src = '';
        DOM.webcam.loop = false;
    }

    DOM.importedImage.style.display = 'none';
    DOM.importedImage.src = '';
    DOM.webcam.style.display = 'none';
    DOM.btnClearImport.classList.add('d-none');
    DOM.btnClearImport.classList.remove('d-inline-flex');
    if (DOM.importedMediaPreviewCard) DOM.importedMediaPreviewCard.classList.add('d-none');
    AppState.activeImportedMedia = null;
    DOM.btnStartCamera.disabled = false;
    DOM.btnStopCamera.disabled = true;
    DOM.btnFreezeFrame.disabled = true;
    if (DOM.btnSaveCapture) DOM.btnSaveCapture.disabled = true;
    showStandbyScreen();

    DOM.cameraStatusBadge.className = 'badge bg-secondary-subtle text-secondary border d-flex align-items-center gap-1 px-3 py-2';
    DOM.cameraStatusBadge.innerHTML = `<i class="bi bi-camera-video-off"></i> <span>Caméra arrêtée</span>`;

    clearCanvas();
    AppState.latestPredictions = [];
    AppState.currentDetectedCounts = {};
    updateDashboard();
    showAlert('Média retiré. Vous pouvez démarrer la caméra ou importer un nouveau fichier.', 'secondary', 2500);
}

/**
 * Fige ou reprend le flux vidéo (capture instantanée pour audit stable)
 */
function toggleFreezeFrame() {
    if (!AppState.isStreaming) return;

    AppState.isFrozen = !AppState.isFrozen;

    if (AppState.isFrozen) {
        DOM.freezeIndicator.classList.remove('d-none');
        DOM.freezeIndicator.classList.add('d-flex');
        DOM.freezeBtnText.textContent = 'Reprendre le direct';
        DOM.liveFeedTag.classList.add('d-none');
        showAlert('Capture d\'écran figée. Vous pouvez auditer précisément ce plan ou exporter le rapport.', 'info', 3000);
    } else {
        DOM.freezeIndicator.classList.add('d-none');
        DOM.freezeBtnText.textContent = 'Figer / Capturer';
        DOM.liveFeedTag.classList.remove('d-none');
        DOM.liveFeedTag.classList.add('d-flex');
        // Relancer la boucle
        requestAnimationFrame(detectionLoop);
    }
}

/**
 * Ajuste les dimensions internes du Canvas pour correspondre à la vidéo
 */
function syncCanvasDimensions() {
    // Si une image statique est affichée dans le stage
    if (DOM.importedImage && DOM.importedImage.style.display !== 'none' && DOM.importedImage.naturalWidth) {
        DOM.canvas.width = DOM.importedImage.naturalWidth;
        DOM.canvas.height = DOM.importedImage.naturalHeight;
        DOM.canvas.style.position = 'absolute';
        DOM.canvas.style.left = (DOM.importedImage.offsetLeft || 0) + 'px';
        DOM.canvas.style.top = (DOM.importedImage.offsetTop || 0) + 'px';
        DOM.canvas.style.width = (DOM.importedImage.clientWidth || DOM.importedImage.offsetWidth) + 'px';
        DOM.canvas.style.height = (DOM.importedImage.clientHeight || DOM.importedImage.offsetHeight) + 'px';
        return;
    }

    // Cas flux webcam ou vidéo
    const vw = DOM.webcam.videoWidth;
    const vh = DOM.webcam.videoHeight;
    DOM.canvas.style.left = '0px';
    DOM.canvas.style.top = '0px';
    DOM.canvas.style.width = '100%';
    DOM.canvas.style.height = '100%';

    if (vw && vh) {
        DOM.canvas.width = vw;
        DOM.canvas.height = vh;
    } else {
        // Fallback: use displayed size if videoWidth not yet available (Safari edge case)
        const rect = DOM.webcam.getBoundingClientRect();
        if (rect.width > 0) {
            DOM.canvas.width = rect.width;
            DOM.canvas.height = rect.height;
        }
    }
}

/**
 * Efface le contenu du canvas
 */
function clearCanvas() {
    DOM.canvasCtx.clearRect(0, 0, DOM.canvas.width, DOM.canvas.height);
}

// ============================================================================
// 7. BOUCLE D'INFÉRENCE ET DÉTECTION D'OBJETS EN TEMPS RÉEL (TF.JS / COCO-SSD)
// ============================================================================
async function detectionLoop() {
    if (!AppState.isStreaming || AppState.isFrozen) {
        return;
    }

    if (DOM.webcam.readyState === 4 && AppState.model) {
        const startTime = performance.now();

        try {
            // Inférence par COCO-SSD
            const rawPredictions = await AppState.model.detect(DOM.webcam);
            AppState.rawPredictionsCache = rawPredictions;
            AppState.inferenceLatencyMs = Math.round(performance.now() - startTime);

            // Filtrage par seuil de confiance et mode chaises renforcé
            const filteredPredictions = filterAndMapPredictions(rawPredictions);
            AppState.latestPredictions = filteredPredictions;

            // Traitement des boîtes englobantes et mise à jour de l'UI
            processAndRenderPredictions(filteredPredictions);

            // Calcul du FPS
            calculateFps();

        } catch (err) {
            console.error('Erreur lors de la détection COCO-SSD :', err);
        }
    }

    // Prochaine itération de la boucle vidéo
    AppState.animationFrameId = requestAnimationFrame(detectionLoop);
}

/**
 * Calcule la fréquence de rafraîchissement (FPS)
 */
function calculateFps() {
    AppState.frameCount++;
    const now = performance.now();
    const elapsed = now - AppState.lastFpsUpdateTime;

    if (elapsed >= 500) { // Mise à jour 2 fois par seconde pour stabilité visuelle
        AppState.fps = Math.round((AppState.frameCount * 1000) / elapsed);
        AppState.frameCount = 0;
        AppState.lastFpsUpdateTime = now;

        DOM.fpsCounter.textContent = `${AppState.fps} FPS`;
        DOM.latencyCounter.textContent = `${AppState.inferenceLatencyMs} ms`;
    }
}

/**
 * Dessine les cadres englobants (bounding boxes) et met à jour l'inventaire
 */
function processAndRenderPredictions(predictions) {
    clearCanvas();
    syncCanvasDimensions();

    const counts = {};

    predictions.forEach(prediction => {
        const [x, y, width, height] = prediction.bbox;
        const categoryKey = prediction.class;
        const score = prediction.score;
        const labelFr = COCO_TRANSLATIONS_FR[categoryKey] || categoryKey;

        // Comptabilisation
        counts[categoryKey] = (counts[categoryKey] || 0) + 1;

        // Choix de la couleur
        const color = CATEGORY_COLORS[categoryKey] || CATEGORY_COLORS['default'];

        // 1. Dessiner le cadre englobant (bounding box)
        DOM.canvasCtx.strokeStyle = color;
        DOM.canvasCtx.lineWidth = 3;
        DOM.canvasCtx.strokeRect(x, y, width, height);

        // 2. Remplissage semi-transparent élégant
        DOM.canvasCtx.fillStyle = hexToRgba(color, 0.12);
        DOM.canvasCtx.fillRect(x, y, width, height);

        // 3. Préparer le texte de l'étiquette (Nom en français + % de confiance)
        const scorePercent = Math.round(score * 100);
        const tagText = `${labelFr} (${scorePercent}%)`;

        DOM.canvasCtx.font = '600 13px Inter, sans-serif';
        const textMetrics = DOM.canvasCtx.measureText(tagText);
        const textWidth = textMetrics.width;
        const textHeight = 18;
        const padding = 5;

        // Positionnement au-dessus ou à l'intérieur selon le bord
        let tagY = y - textHeight - (padding * 2);
        if (tagY < 0) {
            tagY = y + 4;
        }

        // Fond de l'étiquette
        DOM.canvasCtx.fillStyle = color;
        DOM.canvasCtx.fillRect(x, tagY, textWidth + (padding * 2), textHeight + (padding * 2));

        // Texte blanc contrasté
        DOM.canvasCtx.fillStyle = '#ffffff';
        DOM.canvasCtx.textBaseline = 'top';
        DOM.canvasCtx.fillText(tagText, x + padding, tagY + padding);
    });

    AppState.currentDetectedCounts = counts;

    // Mise à jour de l'affichage
    renderDetectionPills(counts, predictions);
    updateDashboard();
    renderAuditTable();
}

/**
 * Affiche la liste des objets détectés sous forme de pastilles (pills)
 */
function renderDetectionPills(counts, predictions) {
    const keys = Object.keys(counts);

    if (keys.length === 0) {
        DOM.detectedItemsPills.innerHTML = '<span class="text-muted small italic">Aucun objet détecté avec le seuil actuel.</span>';
        DOM.detectedBadgeCount.textContent = '0 catégorie';
        return;
    }

    DOM.detectedBadgeCount.textContent = `${keys.length} catégorie${keys.length > 1 ? 's' : ''}`;
    let html = '';

    keys.forEach(key => {
        const count = counts[key];
        const labelFr = COCO_TRANSLATIONS_FR[key] || key;
        const color = CATEGORY_COLORS[key] || '#64748b';

        html += `
            <div class="detection-pill shadow-xs">
                <span class="legend-dot" style="background-color: ${color}"></span>
                <span class="fw-semibold text-dark">${labelFr}</span>
                <span class="pill-count">${count}</span>
            </div>
        `;
    });

    DOM.detectedItemsPills.innerHTML = html;

    // Mise à jour de la liste détaillée en temps réel de chaque objet vu par la caméra
    renderLiveDetectionsDetail(predictions);
}

/**
 * Affiche la liste détaillée individuelle de chaque objet détecté en direct par la caméra
 */
function renderLiveDetectionsDetail(predictions) {
    if (!DOM.liveDetectionsDetailList || !DOM.liveDetectionObjectsCount) return;

    if (!predictions || predictions.length === 0) {
        DOM.liveDetectionsDetailList.innerHTML = '<span class="text-muted small p-2 italic">Aucun objet détecté dans le champ avec le seuil actuel.</span>';
        DOM.liveDetectionObjectsCount.textContent = '0 objet';
        return;
    }

    DOM.liveDetectionObjectsCount.textContent = `${predictions.length} objet${predictions.length > 1 ? 's' : ''}`;

    let html = '';
    // Trier par score décroissant pour mettre en avant les plus certains
    const sorted = [...predictions].sort((a, b) => b.score - a.score);

    sorted.forEach((p, index) => {
        const labelFr = COCO_TRANSLATIONS_FR[p.class] || p.class;
        const color = CATEGORY_COLORS[p.class] || '#64748b';
        const scorePct = Math.round(p.score * 100);
        const [x, y, w, h] = p.bbox.map(Math.round);

        // Badge couleur selon niveau de score
        let scoreClass = 'bg-success text-white';
        if (scorePct < 60) scoreClass = 'bg-warning text-dark';
        else if (scorePct < 80) scoreClass = 'bg-info text-dark';

        html += `
            <div class="detection-detail-item">
                <div class="d-flex align-items-center gap-2">
                    <span class="legend-dot" style="background-color: ${color}"></span>
                    <strong class="text-dark">#${index + 1} ${labelFr}</strong>
                    ${p.originalClass && p.originalClass !== p.class ? `<span class="badge bg-secondary-subtle text-secondary fs-xs">ex-${p.originalClass}</span>` : ''}
                </div>
                <div class="d-flex align-items-center gap-2">
                    <span class="text-muted font-monospace fs-xs d-none d-sm-inline">[${x}, ${y}, ${w}×${h}px]</span>
                    <span class="detection-score-pill ${scoreClass}">${scorePct}%</span>
                </div>
            </div>
        `;
    });

    DOM.liveDetectionsDetailList.innerHTML = html;
}

// ============================================================================
// 8. TABLEAU DE BORD SYNTHÉTIQUE (FONCTIONNALITÉ D)
// ============================================================================
function updateDashboard() {
    const counts = AppState.currentDetectedCounts;
    const rules = AppState.auditRules;

    // 1. Nombre total d'objets détectés (toutes catégories confondues)
    let totalDetected = 0;
    Object.values(counts).forEach(c => totalDetected += c);
    DOM.kpiTotalDetected.textContent = totalDetected;

    // 2. Nombre de catégories uniques reconnues
    const categoriesCount = Object.keys(counts).length;
    DOM.kpiCategoriesCount.textContent = categoriesCount;

    // 3. Nombre de règles vérifiables configurées
    const rulesCount = rules.length;
    DOM.kpiRulesCount.textContent = rulesCount;

    // 4. Nombre d'écarts observés sur les équipements audités
    let discrepanciesCount = 0;
    let hasDeficit = false;

    rules.forEach(rule => {
        const detected = counts[rule.key] || 0;
        const diff = detected - rule.expected;
        if (diff !== 0) {
            discrepanciesCount++;
            if (diff < 0) hasDeficit = true;
        }
    });

    DOM.kpiDiscrepanciesCount.textContent = discrepanciesCount;

    // Icône d'alerte des écarts
    if (discrepanciesCount === 0 && AppState.isStreaming) {
        DOM.kpiDiscrepanciesCount.className = 'fw-bold mb-0 text-success';
        DOM.kpiDiscrepanciesIcon.className = 'metric-icon-bubble bg-success-subtle text-success';
        DOM.kpiDiscrepanciesIcon.innerHTML = '<i class="bi bi-check-lg"></i>';
    } else {
        DOM.kpiDiscrepanciesCount.className = 'fw-bold mb-0 text-danger';
        DOM.kpiDiscrepanciesIcon.className = 'metric-icon-bubble bg-danger-subtle text-danger';
        DOM.kpiDiscrepanciesIcon.innerHTML = '<i class="bi bi-exclamation-triangle"></i>';
    }

    // 5. Statut global de l'audit
    updateGlobalStatusBanner(discrepanciesCount, hasDeficit);
}

/**
 * Met à jour la bannière synthétique du statut global d'audit
 */
function updateGlobalStatusBanner(discrepanciesCount, hasDeficit) {
    const banner = DOM.globalStatusBanner;
    const icon = DOM.globalStatusIcon;
    const title = DOM.globalStatusTitle;
    const desc = DOM.globalStatusDesc;

    banner.className = 'audit-status-banner p-3 rounded-3 border mb-3 text-center transition-all';

    if (!AppState.isStreaming && !AppState.isFrozen) {
        banner.classList.add('bg-light');
        icon.className = 'bi bi-shield-slash fs-4 text-secondary';
        title.className = 'fw-bold mb-0 text-secondary';
        title.textContent = 'Audit en Attente';
        desc.textContent = 'Démarrez la caméra pour amorcer l\'analyse de conformité de la salle.';
    } else if (discrepanciesCount === 0) {
        banner.classList.add('status-ok');
        icon.className = 'bi bi-shield-check fs-4 text-success';
        title.className = 'fw-bold mb-0 text-success';
        title.textContent = 'CONFORME — 100% DES RÈGLES RESPECTÉES';
        desc.textContent = 'Tous les équipements attendus ont été intégralement détectés dans le champ de la caméra.';
    } else if (hasDeficit) {
        banner.classList.add('status-danger');
        icon.className = 'bi bi-shield-exclamation fs-4 text-danger';
        title.className = 'fw-bold mb-0 text-danger';
        title.textContent = `NON CONFORME — ${discrepanciesCount} ÉCART(S) DÉTECTÉ(S)`;
        desc.textContent = 'Certains équipements obligatoires sont manquants ou masqués par des obstacles.';
    } else {
        banner.classList.add('status-warning');
        icon.className = 'bi bi-shield-shaded fs-4 text-warning';
        title.className = 'fw-bold mb-0 text-warning';
        title.textContent = `EXCÉDENT CONSTATÉ — ${discrepanciesCount} ÉQUIPEMENT(S) EN SURPLUS`;
        desc.textContent = 'La quantité détectée dépasse l\'effectif théorique prévu (mobilier additionnel).';
    }
}

// ============================================================================
// 9. GESTION DU TABLEAU D'AUDIT ET CONFIGURATION THÉORIQUE (FONCTIONNALITÉ C)
// ============================================================================

/**
 * Rend le tableau comparatif dynamique : Attendu vs Détecté vs Écart vs Statut
 */
function renderAuditTable() {
    const tbody = DOM.auditTableBody;
    const counts = AppState.currentDetectedCounts;

    tbody.innerHTML = '';

    AppState.auditRules.forEach((rule, index) => {
        const detected = counts[rule.key] || 0;
        const expected = rule.expected;
        const diff = detected - expected;
        const percent = expected > 0 ? Math.min(100, Math.round((detected / expected) * 100)) : 100;

        // Détermination du badge et du statut
        let badgeHtml = '';
        let diffText = '';
        let progressColor = 'bg-primary';

        if (diff === 0) {
            badgeHtml = `<span class="badge-conforme"><i class="bi bi-check-circle-fill"></i> Conforme</span>`;
            diffText = `<span class="fw-bold text-success">0 (Idéal)</span>`;
            progressColor = 'bg-success';
        } else if (diff < 0) {
            badgeHtml = `<span class="badge-deficit"><i class="bi bi-dash-circle-fill"></i> Manquant (${Math.abs(diff)})</span>`;
            diffText = `<span class="fw-bold text-danger">${diff}</span>`;
            progressColor = 'bg-danger';
        } else {
            badgeHtml = `<span class="badge-excedent"><i class="bi bi-plus-circle-fill"></i> Excédent (+${diff})</span>`;
            diffText = `<span class="fw-bold text-warning">+${diff}</span>`;
            progressColor = 'bg-warning';
        }

        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td class="ps-3">
                <div class="d-flex align-items-center gap-2">
                    <div class="text-primary fs-5"><i class="bi ${rule.icon || 'bi-box'}"></i></div>
                    <div>
                        <div class="fw-bold text-dark">${rule.labelFr}</div>
                        <div class="fs-xs text-muted font-monospace">${rule.key}</div>
                    </div>
                </div>
            </td>
            <td>
                <div class="d-flex align-items-center gap-1">
                    <input type="number" 
                           class="form-control form-control-sm audit-qty-input" 
                           value="${expected}" 
                           min="0" 
                           max="200" 
                           data-rule-index="${index}"
                           title="Modifier la quantité cible théorique">
                    <span class="text-muted small">unités</span>
                </div>
            </td>
            <td>
                <div class="fs-6 fw-bold ${detected > 0 ? 'text-primary' : 'text-muted'}">
                    ${detected}
                </div>
                <div class="fs-xs text-muted">à l'image</div>
            </td>
            <td>
                ${diffText}
            </td>
            <td>
                <div class="d-flex align-items-center gap-2">
                    <div class="progress flex-grow-1" style="height: 8px;">
                        <div class="progress-bar ${progressColor}" role="progressbar" style="width: ${percent}%;" aria-valuenow="${percent}" aria-valuemin="0" aria-valuemax="100"></div>
                    </div>
                    <span class="fs-xs fw-semibold text-muted font-monospace">${percent}%</span>
                </div>
            </td>
            <td class="text-center">
                ${badgeHtml}
            </td>
        `;

        // Écouteur de modification directe de la quantité théorique par l'utilisateur
        const input = tr.querySelector('.audit-qty-input');
        input.addEventListener('change', (e) => {
            const newQty = parseInt(e.target.value, 10);
            if (!isNaN(newQty) && newQty >= 0) {
                AppState.auditRules[index].expected = newQty;
                updateDashboard();
                renderAuditTable();
            }
        });

        tbody.appendChild(tr);
    });
}

/**
 * Remplit le sélecteur du modal avec les catégories COCO-SSD disponibles
 */
function populateCategoryModalSelect() {
    const select = DOM.newRuleCategorySelect;
    select.innerHTML = '';

    // Trier les classes par libellé français
    const sortedEntries = Object.entries(COCO_TRANSLATIONS_FR).sort((a, b) => a[1].localeCompare(b[1]));

    sortedEntries.forEach(([key, frLabel]) => {
        const option = document.createElement('option');
        option.value = key;
        option.textContent = `${frLabel} (${key})`;
        select.appendChild(option);
    });
}

/**
 * Traite l'ajout d'une nouvelle règle d'audit
 */
function handleAddNewRule() {
    const categoryKey = DOM.newRuleCategorySelect.value;
    const qty = parseInt(DOM.newRuleQuantityInput.value, 10);

    if (isNaN(qty) || qty < 1) {
        alert('Veuillez entrer une quantité valide supérieure ou égale à 1.');
        return;
    }

    // Vérifier si la règle existe déjà
    const existing = AppState.auditRules.find(r => r.key === categoryKey);
    if (existing) {
        existing.expected = qty;
        showAlert(`La règle pour "${existing.labelFr}" a été mise à jour avec une cible de ${qty}.`, 'info', 3000);
    } else {
        const labelFr = COCO_TRANSLATIONS_FR[categoryKey] || categoryKey;
        AppState.auditRules.push({
            key: categoryKey,
            labelFr: labelFr,
            expected: qty,
            icon: 'bi-box-seam',
            note: 'Règle personnalisée ajoutée'
        });
        showAlert(`Nouvelle règle d'audit ajoutée : ${qty} x ${labelFr}.`, 'success', 3000);
    }

    // Fermer le modal Bootstrap
    const modalElement = document.getElementById('addRuleModal');
    const modalInstance = bootstrap.Modal.getInstance(modalElement);
    if (modalInstance) {
        modalInstance.hide();
    }

    renderAuditTable();
    updateDashboard();
}

// ============================================================================
// 10. GÉNÉRATION & EXPORT DU RAPPORT D'AUDIT (FONCTIONNALITÉ E)
// ============================================================================

/**
 * Génère le contenu textuel complet du rapport d'audit officiel
 */
function buildFullReportText() {
    const now = new Date();
    const formattedDate = now.toLocaleDateString('fr-FR', {
        weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
    });
    const formattedTime = now.toLocaleTimeString('fr-FR', {
        hour: '2-digit', minute: '2-digit', second: '2-digit'
    });

    const counts = AppState.currentDetectedCounts;
    const rules = AppState.auditRules;

    // Calculs de synthèse
    let totalDetected = 0;
    Object.values(counts).forEach(c => totalDetected += c);

    let totalDiscrepancies = 0;
    let conformingRules = 0;
    const tableRows = [];
    const identifiedGaps = [];

    rules.forEach(rule => {
        const observed = counts[rule.key] || 0;
        const expected = rule.expected;
        const diff = observed - expected;
        let status = 'CONFORME';

        if (diff === 0) {
            conformingRules++;
        } else if (diff < 0) {
            totalDiscrepancies++;
            status = `DÉFICIT (${diff})`;
            identifiedGaps.push(`- ${rule.labelFr} (${rule.key}) : ${observed} observés sur ${expected} requis (Manque : ${Math.abs(diff)})`);
        } else {
            totalDiscrepancies++;
            status = `EXCÉDENT (+${diff})`;
            identifiedGaps.push(`- ${rule.labelFr} (${rule.key}) : ${observed} observés sur ${expected} prévus (+${diff} en surplus)`);
        }

        tableRows.push(
            `| ${padRight(rule.labelFr, 25)} | ${padRight(String(expected), 10)} | ${padRight(String(observed), 10)} | ${padRight((diff > 0 ? '+' : '') + diff, 8)} | ${padRight(status, 16)} |`
        );
    });

    // Catégories non soumises à l'audit détectées
    const auditKeys = new Set(rules.map(r => r.key));
    const unmonitoredDetected = [];
    Object.entries(counts).forEach(([k, count]) => {
        if (!auditKeys.has(k)) {
            const labelFr = COCO_TRANSLATIONS_FR[k] || k;
            unmonitoredDetected.push(`${labelFr} (${k}) : ${count}`);
        }
    });

    const complianceRate = rules.length > 0 ? Math.round((conformingRules / rules.length) * 100) : 100;
    const globalVerdict = totalDiscrepancies === 0 
        ? 'CONFORME — Le parc d\'équipements est en adéquation totale avec la dotation officielle.'
        : `ATTENTION : NON CONFORME — ${totalDiscrepancies} divergence(s) identifiée(s) nécessitant vérification.`;

    // Assemblage du rapport structuré
    const report = 
`================================================================================
                    RAPPORT OFFICIEL D'AUDIT DE SALLE DE CLASSE
                      ÉCOLE D'INGÉNIEURS EPITA — PROJET SMART CLASSROOM
================================================================================

1. CONTEXTE DE L'INSPECTION
--------------------------------------------------------------------------------
- Date de l'audit        : ${formattedDate}
- Heure de prélèvement   : ${formattedTime}
- Auditeur en charge     : Maïwenn FOUCHER - EPITA ING3 GITM
- Module académique      : AI for Project Management
- Salle auditée          : Salle de cours standard (EPITA Campus Kremlin-Bicêtre)
- Système de vision      : EPITA Smart Classroom v1.0 (Edge In-Browser Vision)
- Modèle de détection    : TensorFlow.js & COCO-SSD (Lite MobileNet v2)
- Seuil de confiance IA  : ${Math.round(AppState.confidenceThreshold * 100)}%
- Mode de prélèvement    : ${AppState.isFrozen ? 'Instantané figé haute fidélité' : 'Analyse temps réel caméra'}

2. SYNTHÈSE GLOBALE & VERDICT
--------------------------------------------------------------------------------
- Statut global d'audit  : ${globalVerdict}
- Taux de conformité     : ${complianceRate}% (${conformingRules}/${rules.length} règles satisfaites)
- Total objets détectés  : ${totalDetected}
- Nombre d'écarts        : ${totalDiscrepancies} équipement(s) avec divergence

3. TABLEAU COMPARATIF : ATTENDU vs OBSERVÉ
--------------------------------------------------------------------------------
| Équipement audité         | Attendu    | Observé    | Écart    | Statut           |
+---------------------------+------------+------------+----------+------------------+
${tableRows.join('\n')}
--------------------------------------------------------------------------------

4. DÉTAIL DES ÉCARTS IDENTIFIÉS
--------------------------------------------------------------------------------
${identifiedGaps.length > 0 ? identifiedGaps.join('\n') : 'Aucun écart quantitatif détecté. L\'ensemble des quotas est rigoureusement respecté.'}

5. OBJETS TIERS DÉTECTÉS HORS RÉFÉRENTIEL D'AUDIT
--------------------------------------------------------------------------------
${unmonitoredDetected.length > 0 
    ? unmonitoredDetected.map(item => `- ${item}`).join('\n')
    : 'Aucun objet tiers détecté en dehors des équipements de la salle de classe.'}

6. CATÉGORIES DE SALLE NON PRISES EN CHARGE PAR LE MODÈLE
--------------------------------------------------------------------------------
Le modèle générique COCO-SSD est entraîné sur 80 classes du quotidien. Certaines 
infrastructures spécifiques d'une salle de classe moderne ne sont pas reconnues :
- Vidéoprojecteurs montés au plafond
- Tableaux blancs effaçables traditionnels (Velleda) sans cadre moniteur
- Boîtiers multiprises intégrés aux tables
- Systèmes de visioconférence et caméras d'ambiance
- Climatisation, radiateurs et extincteurs normalisés

7. LIMITES TECHNIQUES DE L'ANALYSE PAR VISION
--------------------------------------------------------------------------------
IMPORTANT — Nuance méthodologique fondamentale :
Un équipement non détecté par le système n'est PAS obligatoirement absent de la 
salle. Les facteurs suivants peuvent limiter l'inférence :
a) Angle de vue & Champ optique : Les caméras conventionnelles ont un angle 
   restreint (~70° à 90°) excluant les rangées arrière ou les angles morts.
b) Occlusion géométrique : Les chaises glissées sous les tables ou des sacs posés
   sur les bureaux masquent les formes clés des assises et plateaux.
c) Éclairage & Contre-jour : Les réflexions sur les baies vitrées ou zones 
   d'ombre réduisent l'indice de confiance du modèle MobileNet.
d) Assimilation sémantique : La classe COCO-SSD 'tv' sert ici de substitut 
   sémantique pour les tableaux interactifs (Smartboards) et écrans de projection.

8. RECOMMANDATIONS OPÉRATIONNELLES POUR LE GESTIONNAIRE
--------------------------------------------------------------------------------
1. Réaliser un balayage panoramique lent de la pièce avec la webcam pour couvrir 
   la totalité des 360° avant de valider l'inventaire définitif.
2. Déplacer temporairement les chaises masquées pour les rendre visibles à l'objectif.
3. En cas de doute persistant sur un écart négatif (déficit), effectuer une levée
   de doute manuelle avant tout déclenchement d'une procédure de réapprovisionnement.
4. Ajuster le curseur de sensibilité (seuil de confiance) à 40%-50% pour les 
   environnements de classe volumineux.

================================================================================
Rapport généré automatiquement par l'application EPITA Smart Classroom
Conçu par Maïwenn FOUCHER - EPITA GITM - AI for Project Management
================================================================================`;

    return report;
}

/**
 * Met à jour la zone de prévisualisation du rapport dans l'interface
 */
function generateReportPreview() {
    const reportText = buildFullReportText();
    DOM.reportContentArea.textContent = reportText;
}

/**
 * Copie le rapport d'audit dans le presse-papier de l'utilisateur
 */
async function copyReportToClipboard() {
    const reportText = buildFullReportText();
    try {
        await navigator.clipboard.writeText(reportText);
        showAlert('Rapport d\'audit copié dans le presse-papier !', 'success', 2500);
    } catch (err) {
        console.warn('Clipboard API non supportée ou refusée, fallback...', err);
        // Fallback avec textarea temporaire
        const textarea = document.createElement('textarea');
        textarea.value = reportText;
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand('copy');
        document.body.removeChild(textarea);
        showAlert('Rapport d\'audit copié dans le presse-papier !', 'success', 2500);
    }
}

/**
 * Télécharge le rapport d'audit sous forme de fichier .txt horodaté
 */
function downloadReportFile() {
    const reportText = buildFullReportText();
    const dateStr = new Date().toISOString().slice(0, 10);
    const fileName = `Rapport_Audit_EPITA_Smart_Classroom_${dateStr}.txt`;

    const blob = new Blob([reportText], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    
    const a = document.createElement('a');
    a.href = url;
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    showAlert(`Fichier "${fileName}" téléchargé avec succès !`, 'success', 3000);
}

// ============================================================================
// 11. UTILITAIRES DIVERS (ALERTES, COULEURS, FORMATAGE)
// ============================================================================

/**
 * Affiche une notification d'alerte dismissible Bootstrap
 */
function showAlert(message, type = 'info', timeoutMs = 5000) {
    const alertId = `alert-${Date.now()}`;
    const iconClass = type === 'success' ? 'bi-check-circle-fill' :
                      type === 'warning' ? 'bi-exclamation-circle-fill' :
                      type === 'danger'  ? 'bi-slash-circle-fill' : 'bi-info-circle-fill';

    const alertHtml = `
        <div id="${alertId}" class="alert alert-${type} alert-dismissible fade show d-flex align-items-center gap-2 shadow-sm" role="alert">
            <i class="bi ${iconClass} fs-5"></i>
            <div class="flex-grow-1">${message}</div>
            <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Fermer"></button>
        </div>
    `;

    DOM.alertContainer.insertAdjacentHTML('beforeend', alertHtml);

    if (timeoutMs > 0) {
        setTimeout(() => {
            const el = document.getElementById(alertId);
            if (el) {
                const alertInstance = bootstrap.Alert.getOrCreateInstance(el);
                alertInstance.close();
            }
        }, timeoutMs);
    }
}

/**
 * Convertit un code couleur Hexadécimal en RGBA avec opacité
 */
function hexToRgba(hex, alpha = 1) {
    let cleanHex = hex.replace('#', '');
    if (cleanHex.length === 3) {
        cleanHex = cleanHex.split('').map(c => c + c).join('');
    }
    const r = parseInt(cleanHex.substring(0, 2), 16) || 0;
    const g = parseInt(cleanHex.substring(2, 4), 16) || 0;
    const b = parseInt(cleanHex.substring(4, 6), 16) || 0;
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

/**
 * Complète une chaîne avec des espaces à droite pour alignement monospace
 */
function padRight(str, length) {
    const s = String(str);
    if (s.length >= length) return s.slice(0, length);
    return s + ' '.repeat(length - s.length);
}

// ============================================================================
// CLOUDFLARE D1 — SAUVEGARDE ET GALERIE DES CAPTURES
// ============================================================================

/**
 * Capture la frame courante du canvas+vidéo et l'envoie à Cloudflare D1
 */
async function saveCaptureToDB() {
    // Create a temp canvas to composite video + overlay
    const tempCanvas = document.createElement('canvas');
    const source = DOM.importedImage.style.display === 'block' ? DOM.importedImage : DOM.webcam;
    tempCanvas.width = source.videoWidth || source.naturalWidth || DOM.canvas.width;
    tempCanvas.height = source.videoHeight || source.naturalHeight || DOM.canvas.height;
    const ctx2 = tempCanvas.getContext('2d');
    ctx2.drawImage(source, 0, 0, tempCanvas.width, tempCanvas.height);
    ctx2.drawImage(DOM.canvas, 0, 0, tempCanvas.width, tempCanvas.height);
    const imageData = tempCanvas.toDataURL('image/jpeg', 0.7);

    const body = {
        imageData,
        timestamp: new Date().toISOString(),
        detections: AppState.latestPredictions.map(p => ({
            class: p.class,
            score: Math.round(p.score * 100),
            labelFr: COCO_TRANSLATIONS_FR[p.class] || p.class
        })),
        auditSummary: {
            total: Object.values(AppState.currentDetectedCounts).reduce((a,b)=>a+b,0),
            categories: Object.keys(AppState.currentDetectedCounts).length,
            status: DOM.globalStatusTitle ? DOM.globalStatusTitle.textContent : 'N/A'
        }
    };

    try {
        const res = await fetch(`${WORKER_URL}/api/captures`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body)
        });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();
        showAlert(`Capture #${data.id} sauvegardée dans Cloudflare D1.`, 'success', 3000);
        loadGallery();
    } catch(err) {
        showAlert(`Erreur sauvegarde: ${err.message}`, 'danger', 4000);
    }
}

/**
 * Charge les dernières captures depuis Cloudflare D1 et les affiche
 */
async function loadGallery() {
    const galleryEl = document.getElementById('captureGallery');
    if (!galleryEl) return;
    galleryEl.innerHTML = '<div class="text-center text-muted py-3"><span class="spinner-border spinner-border-sm"></span> Chargement...</div>';
    try {
        const res = await fetch(`${WORKER_URL}/api/captures`);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const { captures } = await res.json();
        if (!captures || captures.length === 0) {
            galleryEl.innerHTML = '<p class="text-muted text-center small py-3">Aucune capture sauvegardée.</p>';
            return;
        }
        galleryEl.innerHTML = captures.map(c => {
            const summary = JSON.parse(c.audit_summary_json || '{}');
            const detections = JSON.parse(c.detections_json || '[]');
            const date = new Date(c.timestamp).toLocaleString('fr-FR');
            return `
                <div class="capture-card card shadow-sm border-0 mb-2">
                    <div class="card-body p-2 d-flex align-items-center gap-3">
                        <img src="${c.thumbnail}" class="rounded" style="width:80px;height:60px;object-fit:cover;cursor:pointer"
                             onclick="openCaptureDetail(${c.id})" title="Voir en grand"
                             onerror="this.onerror=null;this.src='data:image/svg+xml,%3Csvg xmlns=\\'http://www.w3.org/2000/svg\\' width=\\'80\\' height=\\'60\\'%3E%3Crect fill=\\'%236c757d\\' width=\\'80\\' height=\\'60\\'/%3E%3Ctext fill=\\'%23fff\\' font-size=\\'11\\' x=\\'50%25\\' y=\\'55%25\\' text-anchor=\\'middle\\'%3E📷 %23${c.id}%3C/text%3E%3C/svg%3E';">
                        <div class="flex-grow-1">
                            <div class="fw-semibold small">${date}</div>
                            <div class="text-muted fs-xs">${summary.total || 0} objet(s) • ${summary.categories || 0} catégorie(s)</div>
                            <div class="fs-xs text-truncate text-secondary">${summary.status || ''}</div>
                        </div>
                        <button class="btn btn-sm btn-outline-danger py-0" onclick="deleteCapture(${c.id})" title="Supprimer">
                            <i class="bi bi-trash3"></i>
                        </button>
                    </div>
                </div>`;
        }).join('');
    } catch(err) {
        galleryEl.innerHTML = `<p class="text-danger small">${err.message}</p>`;
    }
}

async function openCaptureDetail(id) {
    try {
        const res = await fetch(`${WORKER_URL}/api/captures/${id}`);
        const { capture } = await res.json();
        // Show in a modal or new tab
        const win = window.open();
        if (win) {
            win.document.write(`<img src="${capture.image_data}" style="max-width:100%">`);
        } else {
            showAlert('Fenêtre pop-up bloquée. Veuillez autoriser les pop-ups.', 'warning');
        }
    } catch(err) { showAlert('Erreur chargement capture.', 'danger'); }
}

async function deleteCapture(id) {
    if (!confirm('Supprimer cette capture ?')) return;
    try {
        await fetch(`${WORKER_URL}/api/captures/${id}`, { method: 'DELETE' });
        showAlert('Capture supprimée.', 'secondary', 2000);
        loadGallery();
    } catch(err) { showAlert('Erreur suppression.', 'danger'); }
}

// Exposer sur l'objet global window pour les handlers HTML onclick
window.saveCaptureToDB = saveCaptureToDB;
window.loadGallery = loadGallery;
window.openCaptureDetail = openCaptureDetail;
window.deleteCapture = deleteCapture;


