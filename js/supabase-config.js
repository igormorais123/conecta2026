// CONECTA 2026 — Supabase Configuration
// Substitua SUPABASE_URL e SUPABASE_ANON_KEY pelos valores do seu projeto
(function() {
    var SUPABASE_URL = window.CONECTA_SUPABASE_URL || 'https://SEU-PROJETO.supabase.co';
    var SUPABASE_ANON_KEY = window.CONECTA_SUPABASE_KEY || 'SUA-ANON-KEY';

    // Load Supabase client from CDN
    var script = document.createElement('script');
    script.src = 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/dist/umd/supabase.min.js';
    script.onload = function() {
        // O CDN UMD expõe window.supabase com { createClient }
        var lib = window.supabase;
        window._supabaseLib = lib;
        window.supabase = lib.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
        window.dispatchEvent(new Event('supabase-ready'));
    };
    document.head.appendChild(script);
})();
