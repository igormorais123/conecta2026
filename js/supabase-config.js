// CONECTA 2026 — Shared Supabase/bootstrap configuration
(function() {
    'use strict';

    if (window.CONECTA_CONFIG && window.CONECTA_CONFIG._initialized) {
        return;
    }

    function resolveBasePath() {
        if (window.location.pathname.indexOf('/conecta2026/') !== -1) {
            return '/conecta2026/';
        }
        return './';
    }

    function normalizePath(path) {
        if (!path) return resolveBasePath();
        return path.charAt(path.length - 1) === '/' ? path : path + '/';
    }

    function createConfig() {
        var existing = window.CONECTA_CONFIG || {};
        var basePath = normalizePath(existing.basePath || resolveBasePath());
        return {
            _initialized: true,
            basePath: basePath,
            loginPath: existing.loginPath || basePath + 'login.html',
            appPath: existing.appPath || basePath + 'CONECTA.html',
            contaPath: existing.contaPath || basePath + 'conta.html',
            cadastroPublicoPath: existing.cadastroPublicoPath || basePath + 'cadastro-apoiador.html'
        };
    }

    function dispatchReady() {
        window.dispatchEvent(new Event('supabase-ready'));
    }

    function showConfigError(message) {
        window._conectaSupabaseError = message;
        console.error('[CONECTA] ' + message);
        document.addEventListener('DOMContentLoaded', function() {
            if (document.getElementById('conectaSupabaseErrorBanner')) {
                return;
            }
            var banner = document.createElement('div');
            banner.id = 'conectaSupabaseErrorBanner';
            banner.style.cssText = 'position:fixed;top:0;left:0;right:0;z-index:9999;padding:12px 16px;background:#b91c1c;color:#fff;text-align:center;font:600 14px/1.4 Inter,Segoe UI,sans-serif;';
            banner.textContent = message;
            document.body.prepend(banner);
        });
    }

    window.CONECTA_CONFIG = createConfig();

    var supabaseUrl = window.CONECTA_SUPABASE_URL || 'https://SEU-PROJETO.supabase.co';
    var supabaseAnonKey = window.CONECTA_SUPABASE_KEY || 'SUA-ANON-KEY';

    window.CONECTA_SUPABASE_URL = supabaseUrl;
    window.CONECTA_SUPABASE_KEY = supabaseAnonKey;

    if (window.CONECTA_SUPABASE) {
        dispatchReady();
        return;
    }

    if (supabaseUrl.indexOf('SEU-PROJETO') !== -1 || supabaseAnonKey.indexOf('SUA-ANON-KEY') !== -1) {
        showConfigError('Credenciais Supabase nao configuradas em js/supabase-config.js.');
        dispatchReady();
        return;
    }

    if (window.CONECTA_SUPABASE_LOADING) {
        return;
    }

    window.CONECTA_SUPABASE_LOADING = true;

    var script = document.createElement('script');
    script.src = 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/dist/umd/supabase.min.js';
    script.async = true;
    script.onload = function() {
        window.CONECTA_SUPABASE_LIB = window.supabase;
        if (!window.CONECTA_SUPABASE_LIB || typeof window.CONECTA_SUPABASE_LIB.createClient !== 'function') {
            showConfigError('Biblioteca do Supabase carregada de forma invalida.');
            dispatchReady();
            return;
        }

        window.CONECTA_SUPABASE = window.CONECTA_SUPABASE_LIB.createClient(supabaseUrl, supabaseAnonKey);
        window._conectaSupabase = window.CONECTA_SUPABASE;
        dispatchReady();
    };
    script.onerror = function() {
        showConfigError('Falha ao carregar o cliente Supabase pela CDN.');
        dispatchReady();
    };
    document.head.appendChild(script);
})();
