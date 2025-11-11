# Настройка Cloudflare для order.dolinaflo.com

## Шаг 1: DNS настройки

1. Зайди в [Cloudflare Dashboard](https://dash.cloudflare.com/)
2. Выбери домен `dolinaflo.com`
3. Перейди в раздел **DNS** → **Records**
4. Добавь новую запись:

```
Type: CNAME
Name: order
Target: c.storage.googleapis.com
Proxy status: Proxied (🟠 оранжевое облако)
TTL: Auto
```

## Шаг 2: SSL/TLS настройки

1. Перейди в **SSL/TLS** → **Overview**
2. Выбери режим: **Full** или **Flexible**
3. Включи:
    - ✅ **Always Use HTTPS**
    - ✅ **Automatic HTTPS Rewrites**

4. В **SSL/TLS** → **Edge Certificates**:
    - ✅ **Always Use HTTPS**: On
    - **Minimum TLS Version**: TLS 1.2
    - ✅ **Opportunistic Encryption**: On
    - ✅ **TLS 1.3**: On

## Шаг 3: Настройка Cloudflare Worker для SPA Routing

### Вариант A: Через UI (рекомендуется)

1. Перейди в **Workers & Pages** → **Overview**
2. Нажми **Create application** → **Create Worker**
3. Назови worker: `order-spa-router`
4. Скопируй код из файла `cloudflare-worker.js`
5. Нажми **Save and Deploy**

6. Настрой Route:
    - Перейди в **Workers & Pages** → **order-spa-router** → **Settings** → **Triggers**
    - Нажми **Add route**
    - Route: `order.dolinaflo.com/*`
    - Zone: `dolinaflo.com`
    - Сохрани

### Вариант B: Через Wrangler CLI

```bash
# Установка Wrangler
npm install -g wrangler

# Логин
wrangler login

# Деплой worker
wrangler deploy cloudflare-worker.js --name order-spa-router

# Добавление route
wrangler route add "order.dolinaflo.com/*" order-spa-router
```

## Шаг 4: Page Rules (опционально)

Если не используешь Worker, можешь настроить Page Rules:

1. Перейди в **Rules** → **Page Rules**
2. Создай правило для `order.dolinaflo.com/*`:
    - **Browser Cache TTL**: 4 hours
    - **Cache Level**: Standard
    - **Always Online**: On

## Шаг 5: Настройка Cache (рекомендуется)

1. Перейди в **Caching** → **Configuration**
2. **Caching Level**: Standard
3. **Browser Cache TTL**: Respect Existing Headers

## Шаг 6: Security настройки (опционально)

### Настройка CORS через Transform Rules

1. Перейди в **Rules** → **Transform Rules** → **Modify Response Header**
2. Создай правило:
    - **Rule name**: CORS for API
    - **When incoming requests match**:
        - Custom filter: `(http.host eq "order.dolinaflo.com")`
    - **Then**:
        - Set static header:
            - `Access-Control-Allow-Origin`: `https://order.dolinaflo.com`
            - `Access-Control-Allow-Methods`: `GET, POST, PUT, DELETE, OPTIONS`
            - `Access-Control-Allow-Headers`: `Content-Type, Authorization`

### Защита от DDoS

1. Перейди в **Security** → **WAF**
2. Убедись что включены:
    - ✅ **OWASP ModSecurity Core Rule Set**
    - ✅ **Cloudflare Managed Ruleset**

## Шаг 7: Performance настройки

### Включение Auto Minify

1. Перейди в **Speed** → **Optimization**
2. Включи **Auto Minify**:
    - ✅ JavaScript
    - ✅ CSS
    - ✅ HTML

### Включение Brotli

1. В **Speed** → **Optimization**
2. Включи ✅ **Brotli**

### Rocket Loader (опционально)

Может ускорить загрузку, но иногда ломает React:

- **Rocket Loader**: Off (рекомендуется для React)

## Проверка настроек

### 1. DNS проверка

```bash
# Проверка DNS записи
dig order.dolinaflo.com

# Должен показать CNAME на c.storage.googleapis.com
```

### 2. SSL проверка

```bash
# Проверка SSL сертификата
curl -I https://order.dolinaflo.com

# Должен вернуть 200 OK с HTTPS
```

### 3. Проверка доступности

Открой в браузере:

- https://order.dolinaflo.com
- https://order.dolinaflo.com/flowers
- https://order.dolinaflo.com/orders

Все должны работать и показывать React приложение.

### 4. Проверка API подключения

Открой Developer Console в браузере и проверь:

```javascript
fetch('https://dolina-flower-order-backend-373154353561.europe-west1.run.app/api/v1/flowers')
  .then(r => r.json())
  .then(console.log)
```

## Troubleshooting

### Проблема: ERR_TOO_MANY_REDIRECTS

**Решение**: Измени SSL/TLS mode на **Full** вместо **Flexible**

### Проблема: 404 на роутах React

**Решение**:

1. Проверь что Worker настроен правильно
2. Или используй HashRouter в React вместо BrowserRouter

### Проблема: CORS ошибки

**Решение**: Настрой CORS на backend или используй Transform Rules в Cloudflare

### Проблема: Старая версия кэшируется

**Решение**: Очисти кэш Cloudflare:

1. Перейди в **Caching** → **Configuration**
2. Нажми **Purge Everything**

## Мониторинг

### Analytics

1. Перейди в **Analytics & Logs** → **Web Analytics**
2. Просмотр трафика, запросов, ошибок

### Workers Analytics

1. **Workers & Pages** → **order-spa-router** → **Analytics**
2. Просмотр выполнений worker'а, ошибок, производительности

## Итоговая структура

```
dolinaflo.com (основной сайт)
    └── order.dolinaflo.com (React SPA)
            ↓ (CNAME)
        c.storage.googleapis.com
            ↓
        Google Cloud Storage Bucket
            ↓ (Worker proxy)
        Cloudflare Worker (SPA routing)
            ↓ (API calls)
        Backend: dolina-flower-order-backend-373154353561.europe-west1.run.app
```

## Полезные ссылки

- [Cloudflare Workers Docs](https://developers.cloudflare.com/workers/)
- [Google Cloud Storage Docs](https://cloud.google.com/storage/docs)
- [React Router + Static Hosting](https://reactrouter.com/en/main/guides/deployment)

