// CONECTA 2026 — Database sync layer
// Keeps localStorage as a compatibility cache and mirrors managed keys to Supabase.

var ConectaDB = (function() {
    'use strict';

    var STORAGE = {
        getItem: localStorage.getItem.bind(localStorage),
        setItem: localStorage.setItem.bind(localStorage),
        removeItem: localStorage.removeItem.bind(localStorage)
    };
    var PENDING_QUEUE_KEY = 'conectacelina_sync_queue';
    var cache = {};
    var ready = false;
    var readyCallbacks = [];
    var initPromise = null;
    var subscriptions = [];
    var supabase = null;
    var currentUser = null;
    var activeManagedKeys = [];
    var syncState = {
        pendingCount: 0,
        lastSyncAt: null,
        lastError: null,
        online: typeof navigator === 'undefined' ? true : navigator.onLine
    };

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
        'conectacelina_tarefas_pessoas': { table: 'tarefas', type: 'grouped-by-pessoa' },
        'coordSegmentosSociais': { table: 'configuracoes_app', type: 'config-singleton', configKey: 'coord_segmentos_sociais' },
        'organograma_lista_completa': { table: 'configuracoes_app', type: 'config-singleton', configKey: 'organograma_lista_completa' },
        'logistica_celina_2026': { table: 'configuracoes_app', type: 'config-singleton', configKey: 'logistica_estado' }
    };
    var MANAGED_KEYS = Object.keys(TABLES);

    function parseJson(value, fallback) {
        if (typeof value !== 'string') return value == null ? fallback : value;
        try {
            return JSON.parse(value);
        } catch (err) {
            return fallback;
        }
    }

    function readLocal(key, fallback) {
        var raw = STORAGE.getItem(key);
        if (raw == null) return fallback;
        return parseJson(raw, fallback);
    }

    function writeLocal(key, value) {
        var raw = typeof value === 'string' ? value : JSON.stringify(value);
        try {
            STORAGE.setItem(key, raw);
        } catch(e) {
            if (e.name === 'QuotaExceededError' || e.code === 22) {
                console.error('ConectaDB: localStorage cheio para chave ' + key);
                if (typeof window.showToast === 'function') {
                    window.showToast('Armazenamento local cheio! Exporte seus dados.', 'error');
                }
            }
            throw e;
        }
    }

    function getPendingQueue() {
        var queue = readLocal(PENDING_QUEUE_KEY, []);
        return Array.isArray(queue) ? queue : [];
    }

    function normalizeManagedData(key, data) {
        if (key !== 'conectacelina_atividades' || !Array.isArray(data)) {
            return data;
        }

        var used = {};
        var nextId = Date.now();
        var changed = false;

        var normalized = data.map(function(item) {
            var row = item ? Object.assign({}, item) : { text: '', time: new Date().toISOString() };
            if (row.id != null) {
                used[String(row.id)] = true;
                return row;
            }
            while (used[String(nextId)]) {
                nextId += 1;
            }
            row.id = nextId;
            used[String(nextId)] = true;
            nextId += 1;
            changed = true;
            return row;
        });

        return changed ? normalized : data;
    }

    function emitSyncStatus() {
        syncState.pendingCount = getPendingQueue().length;
        syncState.online = typeof navigator === 'undefined' ? true : navigator.onLine;
        window.dispatchEvent(new CustomEvent('conecta-sync-status', {
            detail: {
                pendingCount: syncState.pendingCount,
                lastSyncAt: syncState.lastSyncAt,
                lastError: syncState.lastError,
                online: syncState.online
            }
        }));
    }

    function markSyncSuccess() {
        syncState.lastSyncAt = new Date().toISOString();
        syncState.lastError = null;
        emitSyncStatus();
    }

    function markSyncError(err) {
        syncState.lastError = err ? String(err.message || err) : 'Erro desconhecido';
        emitSyncStatus();
    }

    function getDefault(key) {
        if (key === 'conectacelina_comunicacao') {
            return { whats: 0, insta: 0, videos: 0, midia: 0, jingles: 0, santinhos: 0 };
        }
        if (key === 'conectacelina_visitas') return {};
        if (key === 'conectacelina_tarefas_pessoas') return {};
        if (key === 'coordSegmentosSociais') return '';
        if (key === 'organograma_lista_completa') return [];
        if (key === 'logistica_celina_2026') return null;
        return [];
    }

    function notifyReady() {
        ready = true;
        while (readyCallbacks.length) {
            var callback = readyCallbacks.shift();
            try {
                callback();
            } catch (err) {
                console.warn('ConectaDB ready callback error:', err);
            }
        }
    }

    function onReady(callback) {
        if (ready) {
            callback();
            return;
        }
        readyCallbacks.push(callback);
    }

    function sanitizeNumber(value) {
        if (value === '' || value == null) return null;
        var number = Number(value);
        return isNaN(number) ? null : number;
    }

    function buildUpsertOptions(config) {
        if (config.type === 'array' || config.type === 'grouped-by-pessoa') {
            return { onConflict: 'id' };
        }
        if (config.type === 'object-by-cidade') {
            return { onConflict: 'cidade' };
        }
        if (config.type === 'config-singleton') {
            return { onConflict: 'chave' };
        }
        return {};
    }

    function normalizeArrayItem(table, item) {
        if (!item) return null;
        var row;

        if (table === 'eventos') {
            row = {
                id: item.id,
                data: item.data || null,
                hora: item.hora || null,
                titulo: item.titulo || '',
                local: item.local || '',
                tipo: item.tipo || null,
                obs: item.obs || ''
            };
        } else if (table === 'veiculos') {
            row = {
                id: item.id,
                placa: item.placa || '',
                modelo: item.modelo || '',
                cor: item.cor || '',
                responsavel: item.responsavel || '',
                telefone: item.telefone || '',
                uso: item.uso || '',
                data_saida: item.dataSaida || item.data_saida || null,
                hora_saida: item.horaSaida || item.hora_saida || null,
                km_saida: sanitizeNumber(item.kmSaida || item.km_saida),
                km_chegada: sanitizeNumber(item.kmChegada || item.km_chegada),
                status: item.status || 'disponivel'
            };
        } else if (table === 'pessoas') {
            row = {
                id: item.id,
                nome: item.nome || '',
                telefone: item.tel || item.telefone || '',
                regiao: item.regiao || '',
                atribuicoes: item.atribuicoes || '',
                foto_url: item.foto || item.foto_url || '',
                obs: item.obs || ''
            };
        } else if (table === 'pesquisas') {
            row = {
                id: item.id,
                data: item.data || null,
                instituto: item.instituto || '',
                celina: sanitizeNumber(item.celina) || 0,
                segundo: item.segundo || '',
                segundo_pct: sanitizeNumber(item.segundoPct || item.segundo_pct) || 0,
                amostra: sanitizeNumber(item.amostra),
                margem: sanitizeNumber(item.margem)
            };
        } else if (table === 'demandas') {
            row = {
                id: item.id,
                titulo: item.titulo || '',
                regiao: item.regiao || '',
                categoria: item.categoria || '',
                prioridade: item.prioridade || 'media',
                descricao: item.desc || item.descricao || '',
                solicitante: item.solicitante || '',
                status: item.status || 'Aberta'
            };
        } else if (table === 'juridico') {
            row = {
                id: item.id,
                data: item.data || null,
                titulo: item.titulo || '',
                descricao: item.desc || item.descricao || '',
                tipo: item.tipo || ''
            };
        } else if (table === 'materiais') {
            row = {
                id: item.id,
                nome: item.nome || '',
                fase: item.fase || null,
                fornecedor: item.fornecedor || '',
                quantidade: sanitizeNumber(item.qtd || item.quantidade) || 0,
                estoque: sanitizeNumber(item.estoque) || 0,
                distribuido: sanitizeNumber(item.dist || item.distribuido) || 0,
                minimo: sanitizeNumber(item.minimo) || 0,
                obs: item.obs || ''
            };
        } else if (table === 'lideres') {
            row = {
                id: item.id,
                nome: item.nome || '',
                telefone: item.telefone || '',
                aniversario_dia: sanitizeNumber(item.aniversarioDia || item.aniversario_dia || (typeof item.aniversario === 'string' && item.aniversario.match(/^(\d{1,2})\//) ? item.aniversario.split('/')[0] : null)),
                aniversario_mes: item.aniversarioMes || item.aniversario_mes || (typeof item.aniversario === 'string' && item.aniversario.match(/\/(\d{1,2})$/) ? item.aniversario.split('/')[1] : ''),
                regiao: item.regiao || '',
                endereco: item.endereco || '',
                tipo: item.tipo || '',
                areas: Array.isArray(item.areas) ? item.areas : [],
                define: item.define || '',
                chegou: item.chegou || '',
                alcance: sanitizeNumber(item.alcance) || 0,
                obs: item.obs || '',
                lgpd: item.lgpd === true,
                status: item.status || 'Ativo'
            };
        } else if (table === 'atividades') {
            row = {
                texto: item.text || item.texto || '',
                criado_em: item.time || item.criado_em || new Date().toISOString(),
                usuario_id: currentUser ? currentUser.id : null
            };
            if (item.id != null) {
                row.id = item.id;
            }
        } else {
            row = Object.assign({}, item);
        }

        if ('criado_por' in row === false && currentUser && table !== 'atividades') {
            row.criado_por = currentUser.id;
        }

        return row;
    }

    function denormalizeArrayItem(table, item) {
        if (!item) return item;

        if (table === 'veiculos') {
            item.dataSaida = item.data_saida || '';
            item.horaSaida = item.hora_saida || '';
            item.kmSaida = item.km_saida != null ? String(item.km_saida) : '';
            item.kmChegada = item.km_chegada != null ? String(item.km_chegada) : '';
            delete item.data_saida;
            delete item.hora_saida;
            delete item.km_saida;
            delete item.km_chegada;
        } else if (table === 'pessoas') {
            item.tel = item.telefone || '';
            item.foto = item.foto_url || '';
            delete item.telefone;
            delete item.foto_url;
        } else if (table === 'pesquisas') {
            item.segundoPct = item.segundo_pct || 0;
            delete item.segundo_pct;
        } else if (table === 'demandas') {
            item.desc = item.descricao || '';
            item.data = item.criado_em ? String(item.criado_em).slice(0, 10) : '';
            delete item.descricao;
        } else if (table === 'juridico') {
            item.desc = item.descricao || '';
            delete item.descricao;
        } else if (table === 'materiais') {
            item.qtd = item.quantidade || 0;
            item.dist = item.distribuido || 0;
            delete item.quantidade;
            delete item.distribuido;
        } else if (table === 'lideres') {
            item.aniversarioDia = item.aniversario_dia || null;
            item.aniversarioMes = item.aniversario_mes || '';
            delete item.aniversario_dia;
            delete item.aniversario_mes;
        } else if (table === 'atividades') {
            item.text = item.texto || '';
            item.time = item.criado_em || '';
            delete item.texto;
        }

        return item;
    }

    function flattenGroupedTasks(data) {
        var rows = [];
        Object.keys(data || {}).forEach(function(personId) {
            (data[personId] || []).forEach(function(task) {
                rows.push({
                    id: task.id,
                    pessoa_id: sanitizeNumber(personId),
                    titulo: task.titulo || '',
                    descricao: task.descricao || '',
                    prazo: task.prazo || null,
                    concluida: !!task.concluida,
                    criado_em: task.criadoEm || new Date().toISOString(),
                    criado_por: currentUser ? currentUser.id : null
                });
            });
        });
        return rows;
    }

    function inflateGroupedTasks(rows) {
        var grouped = {};
        (rows || []).forEach(function(row) {
            var personId = String(row.pessoa_id);
            if (!grouped[personId]) {
                grouped[personId] = [];
            }
            grouped[personId].push({
                id: row.id,
                titulo: row.titulo,
                descricao: row.descricao,
                prazo: row.prazo,
                concluida: !!row.concluida,
                criadoEm: row.criado_em
            });
        });
        return grouped;
    }

    function getCurrentData(key) {
        if (!(key in cache)) {
            cache[key] = normalizeManagedData(key, readLocal(key, getDefault(key)));
            writeLocal(key, cache[key]);
        }
        return cache[key];
    }

    function get(key) {
        return JSON.stringify(getCurrentData(key));
    }

    function enqueuePending(key, data) {
        data = normalizeManagedData(key, data);
        var queue = getPendingQueue();
        queue = (queue || []).filter(function(entry) { return entry.key !== key; });
        queue.push({
            key: key,
            data: data,
            updatedAt: new Date().toISOString()
        });
        writeLocal(PENDING_QUEUE_KEY, queue);
        emitSyncStatus();
    }

    function removePending(key) {
        var queue = getPendingQueue();
        queue = (queue || []).filter(function(entry) { return entry.key !== key; });
        writeLocal(PENDING_QUEUE_KEY, queue);
        emitSyncStatus();
    }

    async function syncPendingQueue() {
        var queue = getPendingQueue();
        if (!supabase || !Array.isArray(queue) || queue.length === 0) return;

        for (var i = 0; i < queue.length; i += 1) {
            var entry = queue[i];
            var normalizedData = normalizeManagedData(entry.key, entry.data);
            try {
                await syncToSupabase(entry.key, normalizedData);
                removePending(entry.key);
                markSyncSuccess();
            } catch (err) {
                console.warn('ConectaDB: pending queue sync failed for ' + entry.key, err);
                markSyncError(err);
            }
        }
    }

    async function syncAllManagedKeys() {
        if (!supabase) return;

        for (var i = 0; i < MANAGED_KEYS.length; i += 1) {
            var key = MANAGED_KEYS[i];
            try {
                await syncToSupabase(key, getCurrentData(key));
                removePending(key);
                markSyncSuccess();
            } catch (err) {
                console.warn('ConectaDB: syncAllManagedKeys failed for ' + key, err);
                enqueuePending(key, getCurrentData(key));
                markSyncError(err);
            }
        }
    }

    async function loadFromSupabase(key) {
        var config = TABLES[key];
        if (!supabase || !config) {
            return getDefault(key);
        }

        if (config.type === 'config-singleton') {
            var configResult = await supabase.from(config.table).select('payload').eq('chave', config.configKey).maybeSingle();
            return configResult.data ? configResult.data.payload : getDefault(key);
        }

        if (config.type === 'object' && config.table === 'comunicacao') {
            var objectResult = await supabase.from(config.table).select('*').limit(1).maybeSingle();
            if (!objectResult.data) return getDefault(key);
            return {
                whats: objectResult.data.whatsapp || 0,
                insta: objectResult.data.instagram || 0,
                videos: objectResult.data.videos || 0,
                midia: objectResult.data.midia || 0,
                jingles: objectResult.data.jingles || 0,
                santinhos: objectResult.data.santinhos || 0
            };
        }

        if (config.type === 'object-by-cidade') {
            var visitResult = await supabase.from(config.table).select('*');
            var visitas = {};
            (visitResult.data || []).forEach(function(row) {
                visitas[row.cidade] = {
                    status: row.status,
                    count: row.contagem || 0,
                    data: row.data || null,
                    obs: row.obs || ''
                };
            });
            return visitas;
        }

        if (config.type === 'grouped-by-pessoa') {
            var taskResult = await supabase.from(config.table).select('*');
            return inflateGroupedTasks(taskResult.data || []);
        }

        var result = await supabase.from(config.table).select('*');
        return (result.data || []).map(function(item) {
            return denormalizeArrayItem(config.table, Object.assign({}, item));
        });
    }

    async function init() {
        if (initPromise) return initPromise;

        initPromise = (async function() {
            supabase = window.CONECTA_SUPABASE || null;

            if (supabase) {
                try {
                    var sessionResult = await supabase.auth.getSession();
                    currentUser = sessionResult.data.session ? sessionResult.data.session.user : null;
                } catch (err) {
                    console.warn('ConectaDB: failed to read auth session', err);
                }
            }

            var keys = Object.keys(TABLES);
            for (var i = 0; i < keys.length; i += 1) {
                var key = keys[i];
                try {
                    cache[key] = supabase ? await loadFromSupabase(key) : readLocal(key, getDefault(key));
                } catch (err) {
                    console.warn('ConectaDB: fallback to localStorage for ' + key, err);
                    cache[key] = readLocal(key, getDefault(key));
                }
                cache[key] = normalizeManagedData(key, cache[key]);
                writeLocal(key, cache[key]);
            }

            if (supabase) {
                setupRealtimeSubscriptions();
                await syncPendingQueue();
            }

            emitSyncStatus();
            notifyReady();
        })();

        return initPromise;
    }

    function set(key, value) {
        var data = typeof value === 'string' ? parseJson(value, getDefault(key)) : value;
        data = normalizeManagedData(key, data);
        cache[key] = data;
        writeLocal(key, data);

        if (!TABLES[key] || !supabase) {
            return;
        }

        syncToSupabase(key, data)
            .then(function() {
                removePending(key);
                markSyncSuccess();
            })
            .catch(function(err) {
                console.warn('ConectaDB: deferred sync for ' + key, err);
                enqueuePending(key, data);
                markSyncError(err);
            });
    }

    function remove(key) {
        var fallback = getDefault(key);
        cache[key] = fallback;
        writeLocal(key, fallback);

        if (!TABLES[key] || !supabase) {
            return;
        }

        syncToSupabase(key, fallback)
            .then(function() {
                removePending(key);
                markSyncSuccess();
            })
            .catch(function(err) {
                console.warn('ConectaDB: deferred remove sync for ' + key, err);
                enqueuePending(key, fallback);
                markSyncError(err);
            });
    }

    async function syncArrayRows(config, rows) {
        var normalizedRows = rows.map(function(item) {
            return normalizeArrayItem(config.table, item);
        }).filter(Boolean);
        var batchSize = 200;

        // Upsert local rows to remote (merge, nao replace)
        for (var index = 0; index < normalizedRows.length; index += batchSize) {
            var batch = normalizedRows.slice(index, index + batchSize);
            var upsertResult = await supabase.from(config.table).upsert(batch, buildUpsertOptions(config));
            if (upsertResult.error) throw upsertResult.error;
        }

        // NAO deletar IDs remotos que nao existem localmente.
        // Motivo: em uso multiusuario, outro usuario pode ter adicionado
        // itens que este cliente ainda nao recebeu via realtime.
        // A reconciliacao acontece via pull no init() e via realtime.
    }

    async function syncToSupabase(key, data) {
        var config = TABLES[key];
        if (!config || !supabase) return;

        if (config.type === 'array') {
            await syncArrayRows(config, Array.isArray(data) ? data : []);
            return;
        }

        if (config.type === 'grouped-by-pessoa') {
            await syncArrayRows(config, flattenGroupedTasks(data || {}));
            return;
        }

        if (config.type === 'object' && config.table === 'comunicacao') {
            var payload = {
                id: 1,
                whatsapp: sanitizeNumber(data.whats) || 0,
                instagram: sanitizeNumber(data.insta) || 0,
                videos: sanitizeNumber(data.videos) || 0,
                midia: sanitizeNumber(data.midia) || 0,
                jingles: sanitizeNumber(data.jingles) || 0,
                santinhos: sanitizeNumber(data.santinhos) || 0,
                atualizado_por: currentUser ? currentUser.id : null,
                atualizado_em: new Date().toISOString()
            };
            var objectResult = await supabase.from(config.table).upsert(payload, buildUpsertOptions(config));
            if (objectResult.error) throw objectResult.error;
            return;
        }

        if (config.type === 'object-by-cidade') {
            var cidades = Object.keys(data || {});
            var rows = cidades.map(function(cidade) {
                return {
                    cidade: cidade,
                    status: data[cidade].status || 'nao-visitada',
                    contagem: sanitizeNumber(data[cidade].count) || 0,
                    data: data[cidade].data || null,
                    obs: data[cidade].obs || '',
                    atualizado_por: currentUser ? currentUser.id : null
                };
            });
            var visitResult = await supabase.from(config.table).upsert(rows, buildUpsertOptions(config));
            if (visitResult.error) throw visitResult.error;
            return;
        }

        if (config.type === 'config-singleton') {
            // Lock otimista: incrementar versao para detectar conflitos
            var currentResult = await supabase.from(config.table)
                .select('versao')
                .eq('chave', config.configKey)
                .maybeSingle();
            var currentVersion = (currentResult.data && currentResult.data.versao) || 0;

            var singletonResult = await supabase.from(config.table).upsert({
                chave: config.configKey,
                payload: data,
                versao: currentVersion + 1,
                atualizado_por: currentUser ? currentUser.id : null,
                atualizado_em: new Date().toISOString()
            }, buildUpsertOptions(config));
            if (singletonResult.error) throw singletonResult.error;
        }
    }

    function tableNameForKey(key) {
        return TABLES[key] ? TABLES[key].table : null;
    }

    function normalizeActiveKeys(keys) {
        var source = Array.isArray(keys) ? keys : [];
        var normalized = [];
        source.forEach(function(key) {
            if (MANAGED_KEYS.indexOf(key) === -1) return;
            if (normalized.indexOf(key) !== -1) return;
            normalized.push(key);
        });
        return normalized;
    }

    function clearRealtimeSubscriptions() {
        while (subscriptions.length) {
            var channel = subscriptions.pop();
            try {
                channel.unsubscribe();
            } catch (err) {
                console.warn('ConectaDB: failed to unsubscribe realtime channel', err);
            }
        }
    }

    async function reloadManagedKey(key) {
        if (!TABLES[key] || !supabase) return;
        try {
            cache[key] = await loadFromSupabase(key);
            writeLocal(key, cache[key]);
        } catch (err) {
            console.warn('ConectaDB: reload failed for ' + key, err);
        }
    }

    function setupRealtimeSubscriptions() {
        if (!supabase) return;

        clearRealtimeSubscriptions();

        var scopedKeys = activeManagedKeys.slice();
        if (scopedKeys.length === 0) return;

        var tables = {};
        scopedKeys.forEach(function(key) {
            var tableName = tableNameForKey(key);
            tables[tableName] = true;
        });

        Object.keys(tables).forEach(function(tableName) {
            var channel = supabase.channel(tableName + '-changes');
            channel.on('postgres_changes', { event: '*', schema: 'public', table: tableName }, async function() {
                var managedKeys = activeManagedKeys.filter(function(key) {
                    return tableNameForKey(key) === tableName;
                });

                for (var i = 0; i < managedKeys.length; i += 1) {
                    await reloadManagedKey(managedKeys[i]);
                }

                if (typeof window.renderCurrentPage === 'function') {
                    window.renderCurrentPage();
                }
            });
            channel.subscribe();
            subscriptions.push(channel);
        });
    }

    function setActiveKeys(keys) {
        var normalized = normalizeActiveKeys(keys);
        if (JSON.stringify(normalized) === JSON.stringify(activeManagedKeys)) {
            return;
        }

        activeManagedKeys = normalized;
        if (supabase) {
            setupRealtimeSubscriptions();
        }
    }

    async function logout() {
        if (supabase) {
            await supabase.auth.signOut();
        }
        currentUser = null;
        // Limpar dados sensiveis do localStorage no logout
        var managedKeys = Object.keys(TABLES);
        managedKeys.forEach(function(key) {
            try { STORAGE.removeItem(key); } catch(e) {}
        });
        try { STORAGE.removeItem('conectacelina_sync_queue'); } catch(e) {}
        cache = {};
        window.location.href = (window.CONECTA_CONFIG && window.CONECTA_CONFIG.loginPath) || 'login.html';
    }

    async function getUser() {
        if (currentUser) return currentUser;
        if (!supabase) return null;
        var sessionResult = await supabase.auth.getSession();
        currentUser = sessionResult.data.session ? sessionResult.data.session.user : null;
        return currentUser;
    }

    async function getUserProfile() {
        var user = await getUser();
        if (!user || !supabase) return null;
        var result = await supabase.from('perfis').select('*').eq('id', user.id).maybeSingle();
        return result.data || null;
    }

    async function uploadFoto(file, pessoaId) {
        if (!supabase) return null;
        var path = 'pessoas/' + pessoaId + '_' + Date.now() + '.jpg';
        var uploadResult = await supabase.storage.from('fotos-campanha').upload(path, file);
        if (uploadResult.error) {
            console.warn('ConectaDB upload error:', uploadResult.error);
            return null;
        }
        return supabase.storage.from('fotos-campanha').getPublicUrl(path).data.publicUrl;
    }

    window.addEventListener('online', function() {
        syncState.online = true;
        emitSyncStatus();
        syncPendingQueue();
    });

    window.addEventListener('offline', function() {
        syncState.online = false;
        emitSyncStatus();
    });

    return {
        init: init,
        onReady: onReady,
        get: get,
        set: set,
        remove: remove,
        setActiveKeys: setActiveKeys,
        logout: logout,
        getUser: getUser,
        getUserProfile: getUserProfile,
        uploadFoto: uploadFoto,
        syncPendingQueue: syncPendingQueue,
        syncNow: syncAllManagedKeys,
        getSyncStatus: function() {
            return {
                pendingCount: getPendingQueue().length,
                lastSyncAt: syncState.lastSyncAt,
                lastError: syncState.lastError,
                online: typeof navigator === 'undefined' ? true : navigator.onLine
            };
        },
        getCache: function() { return cache; },
        isReady: function() { return ready; }
    };
})();

(function() {
    'use strict';

    var managedKeys = [
        'conectacelina_eventos',
        'conectacelina_veiculos',
        'conectacelina_pessoas',
        'conectacelina_pesquisas',
        'conectacelina_demandas',
        'conectacelina_juridico',
        'conectacelina_comunicacao',
        'conectacelina_materiais',
        'conectacelina_lideres',
        'conectacelina_visitas',
        'conectacelina_atividades',
        'conectacelina_tarefas_pessoas',
        'coordSegmentosSociais',
        'organograma_lista_completa',
        'logistica_celina_2026'
    ];
    var originalGetItem = localStorage.getItem.bind(localStorage);
    var originalSetItem = localStorage.setItem.bind(localStorage);
    var originalRemoveItem = localStorage.removeItem.bind(localStorage);
    var _reentryGuard = false;

    localStorage.getItem = function(key) {
        if (!_reentryGuard && ConectaDB.isReady() && managedKeys.indexOf(key) !== -1) {
            return ConectaDB.get(key);
        }
        return originalGetItem(key);
    };

    localStorage.setItem = function(key, value) {
        if (_reentryGuard) { originalSetItem(key, value); return; }
        if (ConectaDB.isReady() && managedKeys.indexOf(key) !== -1) {
            _reentryGuard = true;
            try { ConectaDB.set(key, value); } finally { _reentryGuard = false; }
            return;
        }
        originalSetItem(key, value);
    };

    localStorage.removeItem = function(key) {
        if (ConectaDB.isReady() && managedKeys.indexOf(key) !== -1) {
            ConectaDB.remove(key);
            return;
        }
        originalRemoveItem(key);
    };
})();
