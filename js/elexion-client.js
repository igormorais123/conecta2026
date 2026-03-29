/**
 * elexion-client.js — Cliente HTTP para a API Elexion (modo bearer)
 * Versao: 1.0.0 (Fase 1 — Fundacao)
 *
 * Uso:
 *   <script src="js/elexion-client.js"></script>
 *   const user = await ElexionClient.login('email', 'senha');
 *   const kpis = await ElexionClient.fetchKpis();  // null se offline
 */

window.ElexionClient = (() => {
  'use strict';

  const BASE = 'https://api.elexion.com.br/api/v1';
  const TOKEN_KEY = 'elexion_access_token';
  const REFRESH_KEY = 'elexion_refresh_token';
  const USER_KEY = 'elexion_user';

  // ---- Armazenamento (sessionStorage, nunca localStorage) ----
  // CLIENT-02: token jamais vai para localStorage

  function getAccessToken() {
    return sessionStorage.getItem(TOKEN_KEY);
  }

  function getRefreshToken() {
    return sessionStorage.getItem(REFRESH_KEY);
  }

  function saveTokens(accessToken, refreshToken) {
    sessionStorage.setItem(TOKEN_KEY, accessToken);
    sessionStorage.setItem(REFRESH_KEY, refreshToken);
  }

  function clearTokens() {
    sessionStorage.removeItem(TOKEN_KEY);
    sessionStorage.removeItem(REFRESH_KEY);
    sessionStorage.removeItem(USER_KEY);
  }

  // ---- Auth ----

  /**
   * Login no Elexion com email e senha.
   * Modo bearer: sem x-session-transport: cookie.
   * @returns {Promise<object|null>} dados do usuario ou null em caso de erro
   */
  async function login(email, password) {
    try {
      const res = await fetch(BASE + '/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        // SEM x-session-transport: cookie — modo bearer
        body: JSON.stringify({ email, password }),
        mode: 'cors',
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.message || 'Credenciais invalidas (' + res.status + ')');
      }

      const data = await res.json();
      // data = { accessToken, refreshToken, user }
      saveTokens(data.accessToken, data.refreshToken);
      sessionStorage.setItem(USER_KEY, JSON.stringify(data.user));
      return data.user;

    } catch (err) {
      // CLIENT-03: nao propagar erro que quebre o CONECTA
      console.warn('[ElexionClient] login falhou:', err.message);
      return null;
    }
  }

  /**
   * Refresh do accessToken usando o refreshToken atual.
   * CRITICO: refresh token e rotativo — sempre salvar o novo par retornado.
   * @returns {Promise<string|null>} novo accessToken ou null
   */
  async function refreshTokens() {
    const refreshToken = getRefreshToken();
    if (!refreshToken) return null;

    try {
      const res = await fetch(BASE + '/auth/refresh', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refreshToken }),  // body, NAO cookie
        mode: 'cors',
      });

      if (!res.ok) {
        // Refresh falhou — limpar tokens, usuario deve relogar no Elexion
        clearTokens();
        return null;
      }

      const data = await res.json();
      // SEMPRE salvar AMBOS os tokens novos (refresh e rotativo)
      saveTokens(data.accessToken, data.refreshToken);
      return data.accessToken;

    } catch {
      clearTokens();
      return null;
    }
  }

  /**
   * Logout do Elexion (apenas local — limpa sessionStorage).
   * Nao desautentica do CONECTA/Supabase.
   */
  function logout() {
    clearTokens();
  }

  /**
   * Retorna true se ha um token de acesso em sessao.
   * Nao valida expiracao (isso acontece na proxima request).
   */
  function isAuthenticated() {
    return !!getAccessToken();
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

  // ---- Fetch autenticado com retry em 401 ----

  /**
   * Fetch para endpoint autenticado do Elexion.
   * Retry automatico em 401 via refresh token.
   * CLIENT-03: retorna null (nao throw) quando Elexion indisponivel.
   *
   * @param {string} path - Ex: '/analytics/kpis'
   * @param {RequestInit} options - Opcoes adicionais de fetch (method, body, etc)
   * @returns {Promise<any|null>} dados JSON ou null
   */
  async function request(path, options = {}) {
    const token = getAccessToken();
    if (!token) return null;

    const doFetch = async (bearerToken) => {
      return fetch(BASE + path, {
        ...options,
        headers: {
          'Content-Type': 'application/json',
          ...options.headers,
          'Authorization': 'Bearer ' + bearerToken,
        },
        mode: 'cors',
      });
    };

    try {
      let res = await doFetch(token);

      // 401 — tentar refresh uma vez
      if (res.status === 401) {
        const newToken = await refreshTokens();
        if (!newToken) {
          // Refresh falhou — usuario deve relogar no Elexion (nao afeta CONECTA)
          return null;
        }
        res = await doFetch(newToken);
      }

      if (!res.ok) {
        console.warn('[ElexionClient] request falhou:', res.status, path);
        return null;
      }

      return await res.json();

    } catch (err) {
      // CLIENT-03: Elexion offline nao quebra o CONECTA
      console.warn('[ElexionClient] Elexion indisponivel:', err.message);
      return null;
    }
  }

  // ---- Endpoints da API ----

  /** GET /api/v1/analytics/kpis — requer coordenador+ */
  async function fetchKpis() {
    return request('/analytics/kpis');
  }

  /** GET /api/v1/analytics/heatmap — requer coordenador+ */
  async function fetchHeatmap() {
    return request('/analytics/heatmap');
  }

  /** GET /api/v1/analytics/heatmap/gaps — requer coordenador+ */
  async function fetchHeatmapGaps() {
    return request('/analytics/heatmap/gaps');
  }

  /** GET /api/v1/geofences — requer coordenador+ */
  async function fetchGeofences() {
    return request('/geofences');
  }

  /** GET /api/v1/war-room/feed — requer coordenador+ */
  async function fetchWarRoomFeed() {
    return request('/war-room/feed');
  }

  /** GET /api/v1/war-room/alerts — requer coordenador+ */
  async function fetchAlerts() {
    return request('/war-room/alerts');
  }

  /**
   * GET /api/v1/analytics/leaderboard — ranking de cabos por XP.
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
   * GET /api/v1/analytics/teams/ranking — ranking agregado por equipe.
   * @returns {Promise<Array|null>} array de equipes ou null
   */
  async function fetchTeamsRanking() {
    return request('/analytics/teams/ranking');
  }

  // ---- Operacoes de Campo (Phase 4) ----

  /** GET /api/v1/tasks — lista tarefas de campo paginadas */
  async function fetchTasks(filters = {}) {
    const params = new URLSearchParams();
    if (filters.status) params.set('status', filters.status);
    if (filters.type) params.set('type', filters.type);
    params.set('page', '1');
    params.set('limit', '20');
    return request('/tasks?' + params.toString());
  }

  /** GET /api/v1/tasks/:id/reports */
  async function fetchTaskReports(taskId) {
    return request('/tasks/' + encodeURIComponent(taskId) + '/reports');
  }

  /** POST /api/v1/tasks — requer role COORDINATOR */
  async function createTask(payload) {
    return request('/tasks', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  }

  /** POST /api/v1/tasks/:id/assign */
  async function assignTask(taskId, workerId) {
    return request('/tasks/' + encodeURIComponent(taskId) + '/assign', {
      method: 'POST',
      body: JSON.stringify({ workerId }),
    });
  }

  /** GET /api/v1/challenges?status=active */
  async function fetchChallenges() {
    return request('/challenges?status=active');
  }

  /** POST /api/v1/challenges — requer role COORDINATOR */
  async function createChallenge(payload) {
    return request('/challenges', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  }

  /** GET /api/v1/challenges/:id/progress */
  async function fetchChallengeProgress(challengeId) {
    return request('/challenges/' + encodeURIComponent(challengeId) + '/progress');
  }

  /** GET /api/v1/challenges/:id/leaderboard */
  async function fetchChallengeLeaderboard(challengeId) {
    return request('/challenges/' + encodeURIComponent(challengeId) + '/leaderboard');
  }

  /** GET /api/v1/social/team/:teamId/metrics */
  async function fetchSocialTeamMetrics(teamId) {
    return request('/social/team/' + encodeURIComponent(teamId) + '/metrics');
  }

  /** GET /api/v1/social/scorecard/:userId */
  async function fetchSocialScorecard(userId) {
    return request('/social/scorecard/' + encodeURIComponent(userId) + '/');
  }

  // ---- API publica ----

  return {
    login,
    logout,
    refreshTokens,
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
