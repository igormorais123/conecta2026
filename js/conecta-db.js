// CONECTA 2026 — Database Sync Layer
// Replaces localStorage with Supabase + in-memory cache

var ConectaDB = (function() {
    var cache = {};
    var ready = false;
    var readyCallbacks = [];
    var supabase = null;
    var currentUser = null;

    // Table configs: localStorage key → Supabase table
    var TABLES = {
        'conectacelina_eventos': { table: 'eventos', type: 'array' },
        'conectacelina_veiculos': { table: 'veiculos', type: 'array' },
        'conectacelina_pessoas': { table: 'pessoas', type: 'array' },
        'conectacelina_pesquisas': { table: 'pesquisas', type: 'array' },
        'conectacelina_demandas': { table: 'demandas', type: 'array' },
        'conectacelina_juridico': { table: 'juridico', type: 'array' },
        'conectacelina_comunicacao': { table: 'comunicacao', type: 'object' },
        'conectacelina_materiais': { table: 'materiais', type: 'array' },
        'conectacelina_lideres': { table: 'lideres', type: 'array' },
        'conectacelina_visitas': { table: 'visitas', type: 'object-by-cidade' },
        'conectacelina_atividades': { table: 'atividades', type: 'array' },
        'conectacelina_tarefas_pessoas': { table: 'tarefas', type: 'grouped-by-pessoa' }
    };

    function onReady(cb) {
        if (ready) { cb(); return; }
        readyCallbacks.push(cb);
    }

    function notifyReady() {
        ready = true;
        readyCallbacks.forEach(function(cb) { cb(); });
        readyCallbacks = [];
    }

    // Initialize: load all data from Supabase into cache
    async function init() {
        supabase = window.supabase;
        if (!supabase) {
            console.warn('ConectaDB: Supabase not loaded, falling back to localStorage');
            ready = true;
            notifyReady();
            return;
        }

        // Check auth
        var session = await supabase.auth.getSession();
        if (session.data.session) {
            currentUser = session.data.session.user;
        }

        // Load all tables in parallel
        var promises = Object.keys(TABLES).map(async function(key) {
            var config = TABLES[key];
            try {
                var result = await supabase.from(config.table).select('*');
                if (result.error) throw result.error;

                if (config.type === 'array') {
                    cache[key] = result.data || [];
                } else if (config.type === 'object') {
                    cache[key] = result.data && result.data[0] ? result.data[0] : getDefault(key);
                } else if (config.type === 'object-by-cidade') {
                    // visitas: convert array to {cidade: {status, contagem, data, obs}}
                    var obj = {};
                    (result.data || []).forEach(function(row) {
                        obj[row.cidade] = {
                            status: row.status,
                            count: row.contagem,
                            data: row.data,
                            obs: row.obs
                        };
                    });
                    cache[key] = obj;
                } else if (config.type === 'grouped-by-pessoa') {
                    // tarefas: group by pessoa_id
                    var grouped = {};
                    (result.data || []).forEach(function(row) {
                        var pid = String(row.pessoa_id);
                        if (!grouped[pid]) grouped[pid] = [];
                        grouped[pid].push({
                            id: row.id,
                            titulo: row.titulo,
                            descricao: row.descricao,
                            prazo: row.prazo,
                            concluida: row.concluida,
                            criadoEm: row.criado_em
                        });
                    });
                    cache[key] = grouped;
                }
            } catch(err) {
                console.warn('ConectaDB: Error loading ' + config.table + ', using localStorage fallback', err);
                var stored = localStorage.getItem(key);
                cache[key] = stored ? JSON.parse(stored) : getDefault(key);
            }
        });

        await Promise.all(promises);
        setupRealtimeSubscriptions();
        notifyReady();
    }

    function getDefault(key) {
        if (key === 'conectacelina_comunicacao') {
            return { whatsapp: 0, instagram: 0, videos: 0, midia: 0, jingles: 0, santinhos: 0 };
        }
        if (key === 'conectacelina_visitas') return {};
        if (key === 'conectacelina_tarefas_pessoas') return {};
        return [];
    }

    // Replace localStorage.getItem for CONECTA keys
    function get(key) {
        if (key in cache) {
            return JSON.stringify(cache[key]);
        }
        return localStorage.getItem(key);
    }

    // Replace localStorage.setItem — writes to cache + syncs to Supabase
    function set(key, value) {
        var data = typeof value === 'string' ? JSON.parse(value) : value;
        cache[key] = data;

        // Also keep localStorage as fallback
        localStorage.setItem(key, typeof value === 'string' ? value : JSON.stringify(value));

        // Async sync to Supabase
        if (TABLES[key] && supabase) {
            syncToSupabase(key, data);
        }
    }

    // Sync specific entity to Supabase
    async function syncToSupabase(key, data) {
        var config = TABLES[key];
        if (!config || !supabase) return;

        try {
            if (config.type === 'array') {
                // For arrays, we upsert (the data has IDs)
                // This is called after the full array is saved
                // We need to diff — but for simplicity, we'll use individual operations
                // The calling code should use saveItem/deleteItem instead
            } else if (config.type === 'object' && config.table === 'comunicacao') {
                var updateData = Object.assign({}, data);
                delete updateData.id;
                updateData.atualizado_por = currentUser ? currentUser.id : null;
                updateData.atualizado_em = new Date().toISOString();
                await supabase.from('comunicacao').upsert(
                    Object.assign({ id: 1 }, updateData)
                );
            } else if (config.type === 'object-by-cidade') {
                // visitas: upsert each cidade
                var upserts = Object.keys(data).map(function(cidade) {
                    return {
                        cidade: cidade,
                        status: data[cidade].status || 'nao-visitada',
                        contagem: data[cidade].count || 0,
                        data: data[cidade].data || null,
                        obs: data[cidade].obs || '',
                        atualizado_por: currentUser ? currentUser.id : null
                    };
                });
                if (upserts.length > 0) {
                    await supabase.from('visitas').upsert(upserts, { onConflict: 'cidade' });
                }
            }
        } catch(err) {
            console.warn('ConectaDB sync error for ' + key + ':', err);
        }
    }

    // Save a single item (insert or update)
    async function saveItem(tableName, item) {
        if (!supabase) return item;

        var insertData = Object.assign({}, item);
        // Add user reference
        if (currentUser) {
            insertData.criado_por = insertData.criado_por || currentUser.id;
        }
        // Remove frontend-only fields
        delete insertData._local;

        try {
            if (item.id && typeof item.id === 'number') {
                // Update existing
                var id = item.id;
                delete insertData.id;
                var result = await supabase.from(tableName).update(insertData).eq('id', id).select();
                return result.data ? result.data[0] : item;
            } else {
                // Insert new — remove old timestamp-based ID
                delete insertData.id;
                var result = await supabase.from(tableName).insert(insertData).select();
                return result.data ? result.data[0] : item;
            }
        } catch(err) {
            console.warn('ConectaDB saveItem error:', err);
            return item;
        }
    }

    // Delete a single item
    async function deleteItem(tableName, id) {
        if (!supabase) return;
        try {
            await supabase.from(tableName).delete().eq('id', id);
        } catch(err) {
            console.warn('ConectaDB deleteItem error:', err);
        }
    }

    // Setup realtime subscriptions
    function setupRealtimeSubscriptions() {
        if (!supabase) return;

        var tables = ['eventos', 'veiculos', 'pessoas', 'pesquisas', 'demandas',
                       'juridico', 'materiais', 'lideres', 'visitas', 'atividades', 'tarefas'];

        tables.forEach(function(table) {
            supabase
                .channel(table + '-changes')
                .on('postgres_changes',
                    { event: '*', schema: 'public', table: table },
                    function(payload) {
                        // Reload this table's data and re-render
                        reloadTable(table);
                    }
                )
                .subscribe();
        });
    }

    async function reloadTable(tableName) {
        // Find the cache key for this table
        var cacheKey = null;
        var config = null;
        Object.keys(TABLES).forEach(function(key) {
            if (TABLES[key].table === tableName) {
                cacheKey = key;
                config = TABLES[key];
            }
        });
        if (!cacheKey || !config) return;

        try {
            var result = await supabase.from(tableName).select('*');
            if (result.error) return;

            if (config.type === 'array') {
                cache[cacheKey] = result.data || [];
            } else if (config.type === 'object-by-cidade') {
                var obj = {};
                (result.data || []).forEach(function(row) {
                    obj[row.cidade] = { status: row.status, count: row.contagem, data: row.data, obs: row.obs };
                });
                cache[cacheKey] = obj;
            } else if (config.type === 'grouped-by-pessoa') {
                var grouped = {};
                (result.data || []).forEach(function(row) {
                    var pid = String(row.pessoa_id);
                    if (!grouped[pid]) grouped[pid] = [];
                    grouped[pid].push({
                        id: row.id, titulo: row.titulo, descricao: row.descricao,
                        prazo: row.prazo, concluida: row.concluida, criadoEm: row.criado_em
                    });
                });
                cache[cacheKey] = grouped;
            }

            // Trigger re-render if the page has a render function
            if (typeof window.renderCurrentPage === 'function') {
                window.renderCurrentPage();
            }
        } catch(err) {
            console.warn('ConectaDB reload error for ' + tableName, err);
        }
    }

    // Auth helpers
    async function login(email, password) {
        if (!supabase) return { error: 'Supabase not configured' };
        var result = await supabase.auth.signInWithPassword({ email: email, password: password });
        if (result.data.user) currentUser = result.data.user;
        return result;
    }

    async function loginMagicLink(email) {
        if (!supabase) return { error: 'Supabase not configured' };
        return await supabase.auth.signInWithOtp({
            email: email,
            options: { emailRedirectTo: window.location.origin + '/conecta/' }
        });
    }

    async function logout() {
        if (!supabase) return;
        await supabase.auth.signOut();
        currentUser = null;
        window.location.href = '/conecta/login.html';
    }

    async function getUser() {
        if (currentUser) return currentUser;
        if (!supabase) return null;
        var session = await supabase.auth.getSession();
        if (session.data.session) {
            currentUser = session.data.session.user;
            return currentUser;
        }
        return null;
    }

    async function getUserProfile() {
        var user = await getUser();
        if (!user || !supabase) return null;
        var result = await supabase.from('perfis').select('*').eq('id', user.id).single();
        return result.data;
    }

    // Photo upload
    async function uploadFoto(file, pessoaId) {
        if (!supabase) return null;
        var path = 'pessoas/' + pessoaId + '_' + Date.now() + '.jpg';
        var result = await supabase.storage.from('fotos-campanha').upload(path, file);
        if (result.error) {
            console.warn('Upload error:', result.error);
            return null;
        }
        var urlResult = supabase.storage.from('fotos-campanha').getPublicUrl(path);
        return urlResult.data.publicUrl;
    }

    return {
        init: init,
        onReady: onReady,
        get: get,
        set: set,
        saveItem: saveItem,
        deleteItem: deleteItem,
        login: login,
        loginMagicLink: loginMagicLink,
        logout: logout,
        getUser: getUser,
        getUserProfile: getUserProfile,
        uploadFoto: uploadFoto,
        getCache: function() { return cache; },
        isReady: function() { return ready; }
    };
})();

// Auto-init when Supabase is ready
window.addEventListener('supabase-ready', function() {
    ConectaDB.init();
});

// Override localStorage for CONECTA keys
(function() {
    var originalGetItem = localStorage.getItem.bind(localStorage);
    var originalSetItem = localStorage.setItem.bind(localStorage);

    var CONECTA_KEYS = [
        'conectacelina_eventos', 'conectacelina_veiculos', 'conectacelina_pessoas',
        'conectacelina_pesquisas', 'conectacelina_demandas', 'conectacelina_juridico',
        'conectacelina_comunicacao', 'conectacelina_materiais', 'conectacelina_lideres',
        'conectacelina_visitas', 'conectacelina_atividades', 'conectacelina_tarefas_pessoas'
    ];

    // We only intercept AFTER ConectaDB is ready
    // The STORAGE_KEY prefix in CONECTA.html is 'conectacelina_'
    localStorage.getItem = function(key) {
        if (ConectaDB.isReady() && CONECTA_KEYS.indexOf(key) !== -1) {
            return ConectaDB.get(key);
        }
        return originalGetItem(key);
    };

    localStorage.setItem = function(key, value) {
        originalSetItem(key, value);
        if (ConectaDB.isReady() && CONECTA_KEYS.indexOf(key) !== -1) {
            ConectaDB.set(key, value);
        }
    };
})();
