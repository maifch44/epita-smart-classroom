/**
 * Cloudflare Worker — EPITA Smart Classroom API & Static Hosting
 * Backend D1 (SQLite) pour la persistance des audits et captures photo
 */

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    const corsHeaders = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    };

    // Gestion de la requête préliminaire CORS preflight
    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: corsHeaders });
    }

    // Helper pour générer des réponses JSON avec headers CORS
    const jsonResponse = (data, status = 200) => {
      return new Response(JSON.stringify(data), {
        status,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        },
      });
    };

    // Routage des appels d'API
    if (url.pathname.startsWith('/api/')) {
      try {
        const pathname = url.pathname.replace(/\/+$/, '') || '/';

        // GET /api/health — Vérification de l'état de l'API et de la base D1
        if (pathname === '/api/health' && request.method === 'GET') {
          if (!env.DB) {
            return jsonResponse({ status: 'warning', db: 'unbound', message: 'Base D1 non liée dans wrangler.toml' });
          }
          try {
            await env.DB.prepare('SELECT 1').run();
            return jsonResponse({ status: 'ok', db: 'connected' });
          } catch (dbErr) {
            return jsonResponse({ status: 'error', db: 'disconnected', error: dbErr.message }, 500);
          }
        }

        // Vérification de la présence de D1 pour les routes de captures
        if (!env.DB && pathname.startsWith('/api/captures')) {
          return jsonResponse({
            error: 'Base de données D1 non encore connectée.',
            help: 'Créez epita-classroom-db dans Cloudflare Dashboard et renseignez database_id dans wrangler.toml.'
          }, 503);
        }

        // POST /api/captures — Sauvegarde d'une capture photo et métadonnées
        if (pathname === '/api/captures' && request.method === 'POST') {
          const body = await request.json();
          const { imageData, detections, timestamp, auditSummary } = body;

          if (!imageData) {
            return jsonResponse({ error: 'Le champ imageData est requis.' }, 400);
          }

          const detectionsJson = typeof detections === 'string' ? detections : JSON.stringify(detections || []);
          const auditSummaryJson = typeof auditSummary === 'string' ? auditSummary : JSON.stringify(auditSummary || {});
          const captureTimestamp = timestamp || new Date().toISOString();

          const result = await env.DB.prepare(
            `INSERT INTO captures (timestamp, image_data, detections_json, audit_summary_json)
             VALUES (?, ?, ?, ?)`
          ).bind(captureTimestamp, imageData, detectionsJson, auditSummaryJson).run();

          const insertedId = result.meta?.last_row_id;
          return jsonResponse({ success: true, id: insertedId }, 201);
        }

        // GET /api/captures — Récupération des 20 dernières captures
        if (pathname === '/api/captures' && request.method === 'GET') {
          const { results } = await env.DB.prepare(
            `SELECT id, timestamp, detections_json, audit_summary_json, SUBSTR(image_data, 1, 200) AS thumbnail
             FROM captures
             ORDER BY id DESC
             LIMIT 20`
          ).all();

          return jsonResponse({ captures: results || [] });
        }

        // Routes dynamiques /api/captures/:id
        const captureMatch = pathname.match(/^\/api\/captures\/(\d+)$/);
        if (captureMatch) {
          const captureId = parseInt(captureMatch[1], 10);

          // GET /api/captures/:id — Détail complet d'une capture avec image intégrale
          if (request.method === 'GET') {
            const capture = await env.DB.prepare(
              `SELECT id, timestamp, image_data, detections_json, audit_summary_json
               FROM captures
               WHERE id = ?`
            ).bind(captureId).first();

            if (!capture) {
              return jsonResponse({ error: 'Capture introuvable.' }, 404);
            }

            return jsonResponse({ capture });
          }

          // DELETE /api/captures/:id — Suppression d'une capture
          if (request.method === 'DELETE') {
            await env.DB.prepare(
              `DELETE FROM captures WHERE id = ?`
            ).bind(captureId).run();

            return jsonResponse({ success: true });
          }
        }

        return jsonResponse({ error: 'Route API introuvable.' }, 404);
      } catch (err) {
        return jsonResponse({ error: err.message || 'Erreur interne du serveur' }, 500);
      }
    }

    // En l'absence de route API, servir les assets statiques (frontend)
    if (env.ASSETS) {
      return env.ASSETS.fetch(request);
    }

    return new Response('Not Found', { status: 404 });
  }
};
