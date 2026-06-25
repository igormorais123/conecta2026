---
name: apify
description: Usar a API do Apify para scraping/automação (Instagram, Facebook, Twitter, Google Maps, sites públicos) com chave protegida
triggers:
  - apify
  - scraping
  - raspagem
  - raspa
  - extrai do instagram
  - extrai do facebook
  - extrai do twitter
  - extrai do x
  - extrai do google maps
  - busca seguidores
  - busca posts
  - monitora rede social
  - coleta dados publicos
  - actor do apify
---

# Skill: Apify (Scraping/Automação)

## Quando usar
Sempre que o Silvio pedir para coletar dados públicos de redes sociais, sites, Google Maps, ou qualquer scraping/automação via Apify.

## REGRAS DE SEGURANÇA (ABSOLUTAS)

1. **NUNCA exibir o token** em texto, log, output, mensagem ou commit
2. **NUNCA embutir o token** em arquivo `.html`, `.js`, `.md` rastreado pelo git
3. **NUNCA passar o token via linha de comando** (fica no histórico do shell). Sempre carregar em variável de ambiente
4. **SEMPRE ler o token** do arquivo `setup/CREDENCIAIS.md` (gitignored — confirmado em `.gitignore` linha 4)
5. **Se for criar arquivo `.js`/`.html` que use Apify** para uso público (browser), USAR proxy backend — nunca expor o token no frontend
6. **Antes de qualquer chamada**: confirmar que o ator escolhido respeita ToS da plataforma e LGPD (só dados públicos)

## Como pegar o token

```powershell
# PowerShell — extrai a linha do token sem exibir o valor
$apifyToken = (Select-String -Path "setup\CREDENCIAIS.md" -Pattern "apify_api_[A-Za-z0-9]+" -AllMatches).Matches[0].Value
$env:APIFY_TOKEN = $apifyToken
# A partir daqui usar $env:APIFY_TOKEN — não imprimir
```

```bash
# Bash equivalente
export APIFY_TOKEN=$(grep -oE 'apify_api_[A-Za-z0-9]+' setup/CREDENCIAIS.md | head -1)
```

## Endpoints essenciais

Base: `https://api.apify.com/v2/`

| Ação | Método/Path |
|------|------|
| Rodar actor (síncrono, devolve items) | `POST /acts/{actor}/run-sync-get-dataset-items` |
| Rodar actor (assíncrono) | `POST /acts/{actor}/runs` |
| Status do run | `GET /actor-runs/{runId}` |
| Items do dataset | `GET /datasets/{datasetId}/items?format=json` |
| Listar meus actors | `GET /acts` |

Header obrigatório: `Authorization: Bearer $APIFY_TOKEN`

## Actors mais úteis para campanha política

| Caso de uso | Actor ID |
|-------------|----------|
| Instagram (posts, hashtags, perfis) | `apify/instagram-scraper` |
| Instagram seguidores/seguindo | `apify/instagram-follower-scraper` |
| Facebook (posts de página) | `apify/facebook-pages-scraper` |
| Facebook comentários | `apify/facebook-comments-scraper` |
| Twitter/X posts e perfis | `apidojo/twitter-scraper-lite` |
| TikTok (perfis, vídeos, hashtags) | `clockworks/tiktok-scraper` |
| YouTube (vídeos, canais, comentários) | `streamers/youtube-scraper` |
| Google Maps (estabelecimentos por região) | `compass/crawler-google-places` |
| Google Search (resultados orgânicos) | `apify/google-search-scraper` |
| Web genérico (qualquer site) | `apify/web-scraper` ou `apify/cheerio-scraper` |
| Notícias (artigos de portais) | `apify/website-content-crawler` |

## Protocolo de uso

### 1. Confirmar com o Silvio o caso de uso
- Qual plataforma? Qual perfil/hashtag/região?
- Quantos resultados? (limita custo)
- Para que vai usar o dado? (define formato de saída)

### 2. Escolher o actor certo
Consultar a tabela acima ou perguntar ao Silvio o link do actor se ele já tiver um em mente.

### 3. Montar input JSON
Cada actor tem schema próprio. Exemplo (Instagram hashtag):
```json
{
  "hashtags": ["celinaleao", "df2026"],
  "resultsLimit": 50
}
```

### 4. Rodar (modo síncrono — preferido para volumes pequenos)
```powershell
$body = @{ hashtags = @("celinaleao"); resultsLimit = 50 } | ConvertTo-Json
$headers = @{ Authorization = "Bearer $env:APIFY_TOKEN" }
$result = Invoke-RestMethod -Method Post `
  -Uri "https://api.apify.com/v2/acts/apify~instagram-scraper/run-sync-get-dataset-items" `
  -Headers $headers `
  -Body $body `
  -ContentType "application/json"
$result | ConvertTo-Json -Depth 5 | Out-File "data/instagram_celinaleao.json"
```

### 5. Para volumes grandes — modo assíncrono
```powershell
# Dispara
$run = Invoke-RestMethod -Method Post `
  -Uri "https://api.apify.com/v2/acts/apify~instagram-scraper/runs" `
  -Headers $headers -Body $body -ContentType "application/json"
$runId = $run.data.id
$datasetId = $run.data.defaultDatasetId

# Aguarda terminar (polling simples)
do {
  Start-Sleep -Seconds 10
  $status = (Invoke-RestMethod -Headers $headers `
    -Uri "https://api.apify.com/v2/actor-runs/$runId").data.status
} while ($status -in @("READY","RUNNING"))

# Baixa items
Invoke-RestMethod -Headers $headers `
  -Uri "https://api.apify.com/v2/datasets/$datasetId/items?format=json" `
  | ConvertTo-Json -Depth 5 | Out-File "data/resultado.json"
```

### 6. Salvar saída
- Pasta `data/` ou similar — NUNCA dentro de `.html` rastreado
- Se o dado for sensível (lista de pessoas, contatos), adicionar pasta ao `.gitignore`
- Formato preferido: JSON (estrutura preservada)

### 7. Limpar a variável de ambiente após uso
```powershell
Remove-Item Env:APIFY_TOKEN
```

## Custos
- Apify cobra por compute units e datasets. Atores populares têm preço fixo por 1k resultados.
- Antes de rodar volume grande: confirmar com Silvio se ele quer prosseguir.
- Para teste, começar com `resultsLimit: 10`.

## Frontend / browser
Se for integrar Apify a alguma página HTML do CONECTA:
- **NÃO** chamar a API direto do navegador (token vazaria no DevTools)
- Criar um endpoint backend (ex.: Vercel Function, Supabase Edge Function) que guarda o token em env var e faz a chamada
- O HTML chama o backend, o backend chama o Apify

## Documentação
- API completa: https://docs.apify.com/api/v2
- Store de actors: https://apify.com/store
