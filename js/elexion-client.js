/**
 * elexion-client.js — Cliente HTTP para a API Elexion (via Proxy Supabase)
 * Versao: 2.0.0 (Fase 5 — Proxy Seguro)
 *
 * AVISO: Apos validar o proxy em producao, remover inteia.com.br do CORS
 * do NestJS (main.ts na VPS 187.77.53.163). O proxy elimina a necessidade
 * de CORS direto. (SEC-04)
 *
 * Mudancas vs v1.0.0:
 *   - Token JWT do Elexion REMOVIDO do browser (SEC-01)
 *   - Todas as chamadas REST passam pelo proxy Supabase Edge Function
 *   - Autenticacao via sessao Supabase (window.CONECTA_SUPABASE)
 *   - Funcoes removidas: login(), saveTokens(), getAccessToken(),
 *     getRefreshToken(), refreshTokens(), clearTokens()
 *
 * Uso:
 *   <script src="js/elexion-client.js"></script>
 *   const kpis = await ElexionClient.fetchKpis();  // null se offline
 */

window.ElexionClient = (() => {
  'use strict';

  // URL da Edge Function proxy (Supabase)
  const PROXY_URL = 'https://dvgbqbwipwegkndutvte.supabase.co/functions/v1/elexion-proxy';

  // Dados do usuario (nao e token — safe no sessionStorage)
  const USER_KEY = 'elexion_user';

  // ---- Helper: obter cliente Supabase global ----

  function getSupabaseClient() {
    return window.CONECTA_SUPABASE || window._conectaSupabase || null;
  }

  // ---- Auth ----

  /**
   * Retorna true se ha sessao Supabase ativa.
   * Substituiu a verificacao de token Elexion no sessionStorage.
   * NOTA: esta funcao e async — chamadores devem usar await.
   */
  async function isAuthenticated() {
    try {
      const client = getSupabaseClient();
      if (!client) return false;
      const { data } = await client.auth.getSession();
      return !!(data?.session?.access_token);
    } catch {
      return false;
    }
  }

  /**
   * Retorna o objeto user salvo na sessao, ou null.
   */
  function getCurrentUser() {
    try {
      const raw = sessionStorage.getItem(USER_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  }

  /**
   * Logout — limpa dados do usuario no sessionStorage.
   * Nao desautentica do Supabase (isso e feito pelo CONECTA).
   */
  function logout() {
    sessionStorage.removeItem(USER_KEY);
  }

  // ---- Fetch via proxy ----

  /**
   * Fetch para endpoint do Elexion via proxy Supabase Edge Function.
   * CLIENT-03: retorna null (nao throw) quando indisponivel.
   *
   * @param {string} path - Ex: '/analytics/kpis'
   * @param {RequestInit} options - Opcoes adicionais de fetch (method, body, etc)
   * @returns {Promise<any|null>} dados JSON ou null
   */
  async function request(path, options = {}) {
    // Obter token da sessao Supabase ativa
    let supabaseToken = null;
    try {
      const client = getSupabaseClient();
      if (client) {
        const { data } = await client.auth.getSession();
        supabaseToken = data?.session?.access_token || null;
      }
    } catch (e) {
      console.warn('[ElexionClient] Nao foi possivel obter sessao Supabase:', e.message);
    }

    if (!supabaseToken) {
      console.warn('[ElexionClient] Sem sessao Supabase ativa — proxy nao autenticado');
      return null;
    }

    try {
      const res = await fetch(PROXY_URL + path, {
        ...options,
        headers: {
          'Content-Type': 'application/json',
          ...options.headers,
          'Authorization': 'Bearer ' + supabaseToken,
        },
      });

      if (!res.ok) {
        console.warn('[ElexionClient] proxy retornou', res.status, 'para', path);
        return null;
      }

      return await res.json();

    } catch (err) {
      // CLIENT-03: proxy indisponivel nao quebra o CONECTA
      console.warn('[ElexionClient] Proxy indisponivel:', err.message);
      return null;
    }
  }

  // ---- Endpoints da API ----

  /** GET /analytics/kpis — requer coordenador+ */
  async function fetchKpis() {
    return request('/analytics/kpis');
  }

  /** GET /analytics/heatmap — requer coordenador+ */
  async function fetchHeatmap() {
    return request('/analytics/heatmap');
  }

  /** GET /analytics/heatmap/gaps — requer coordenador+ */
  async function fetchHeatmapGaps() {
    return request('/analytics/heatmap/gaps');
  }

  /** GET /geofences — requer coordenador+ */
  async function fetchGeofences() {
    return request('/geofences');
  }

  /** GET /war-room/feed — requer coordenador+ */
  async function fetchWarRoomFeed() {
    return request('/war-room/feed');
  }

  /** GET /war-room/alerts — requer coordenador+ */
  async function fetchAlerts() {
    return request('/war-room/alerts');
  }

  /**
   * GET /analytics/leaderboard — ranking de cabos por XP.
   * @param {string|null} equipeId - Filtrar por equipe (opcional). Null = todos.
   * @returns {Promise<Array|null>} array de cabos ou null
   */
  async function fetchLeaderboard(equipeId = null) {
    const path = equipeId
      ? '/analytics/leaderboard?equipe=' + encodeURIComponent(equipeId)
      : '/analytics/leaderboard';
    return request(path);
  }

  /**
   * GET /analytics/teams/ranking — ranking agregado por equipe.
   * @returns {Promise<Array|null>} array de equipes ou null
   */
  async function fetchTeamsRanking() {
    return request('/analytics/teams/ranking');
  }

  // ---- Operacoes de Campo (Phase 4) ----

  /** GET /tasks — lista tarefas de campo paginadas */
  async function fetchTasks(filters = {}) {
    const params = new URLSearchParams();
    if (filters.status) params.set('status', filters.status);
    if (filters.type) params.set('type', filters.type);
    params.set('page', '1');
    params.set('limit', '20');
    return request('/tasks?' + params.toString());
  }

  /** GET /tasks/:id/reports */
  async function fetchTaskReports(taskId) {
    return request('/tasks/' + encodeURIComponent(taskId) + '/reports');
  }

  /** POST /tasks — requer role COORDINATOR */
  async function createTask(payload) {
    return request('/tasks', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  }

  /** POST /tasks/:id/assign */
  async function assignTask(taskId, workerId) {
    return request('/tasks/' + encodeURIComponent(taskId) + '/assign', {
      method: 'POST',
      body: JSON.stringify({ workerId }),
    });
  }

  /** GET /challenges?status=active */
  async function fetchChallenges() {
    return request('/challenges?status=active');
  }

  /** POST /challenges — requer role COORDINATOR */
  async function createChallenge(payload) {
    return request('/challenges', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  }

  /** GET /challenges/:id/progress */
  async function fetchChallengeProgress(challengeId) {
    return request('/challenges/' + encodeURIComponent(challengeId) + '/progress');
  }

  /** GET /challenges/:id/leaderboard */
  async function fetchChallengeLeaderboard(challengeId) {
    return request('/challenges/' + encodeURIComponent(challengeId) + '/leaderboard');
  }

  /** GET /social/team/:teamId/metrics */
  async function fetchSocialTeamMetrics(teamId) {
    return request('/social/team/' + encodeURIComponent(teamId) + '/metrics');
  }

  /** GET /social/scorecard/:userId */
  async function fetchSocialScorecard(userId) {
    return request('/social/scorecard/' + encodeURIComponent(userId) + '/');
  }

  // ---- API publica ----

  return {
    // Auth (sem login/refreshTokens — token Elexion nao existe mais no browser)
    logout,
    isAuthenticated,
    getCurrentUser,
    request,
    // Endpoints — Dashboard Core (Phase 2)
    fetchKpis,
    fetchHeatmap,
    fetchHeatmapGaps,
    fetchGeofences,
    fetchWarRoomFeed,
    fetchAlerts,
    fetchLeaderboard,
    fetchTeamsRanking,
    // Endpoints — Operacoes de Campo (Phase 4)
    fetchTasks,
    fetchTaskReports,
    createTask,
    assignTask,
    fetchChallenges,
    createChallenge,
    fetchChallengeProgress,
    fetchChallengeLeaderboard,
    fetchSocialTeamMetrics,
    fetchSocialScorecard,
  };
})();
