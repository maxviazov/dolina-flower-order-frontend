# ✅ Деплой завершен успешно!

## Что сделано

1. ✅ **Google Cloud Storage bucket создан**: `order.dolinaflo.com`
2. ✅ **React приложение собрано и загружено** в bucket
3. ✅ **Cache headers настроены**:
    - Static files: `Cache-Control: public, max-age=31536000` (1 год)
    - index.html: `Cache-Control: no-cache`
4. ✅ **API URL настроен**:
   `https://dolina-flower-order-backend-373154353561.europe-west1.run.app/api/v1`
5. ✅ **Файлы в bucket**:
    - index.html
    - asset-manifest.json
    - static/css/main.ce13fda0.css
    - static/js/main.ffdb3d58.js
    -
        + source maps

## 🔴 ВАЖНО: Осталось настроить Cloudflare (5 минут)

### Шаг 1: DNS в Cloudflare

Зайди на https://dash.cloudflare.com/ и настрой DNS:

1. Выбери домен `dolinaflo.com`
2. Перейди в **DNS** → **Records**
3. Добавь запись:

```
Type: CNAME
Name: order
Target: c.storage.googleapis.com
Proxy: ✅ Proxied (оранжевое облако)
```

### Шаг 2: SSL/TLS

В **SSL/TLS** → **Overview**: выбери **Full**

В **SSL/TLS** → **Edge Certificates**: включи

- ✅ Always Use HTTPS
- ✅ Automatic HTTPS Rewrites

### Шаг 3: Worker для SPA Routing (КРИТИЧНО!)

Без этого шага React Router не будет работать!

#### Через UI (рекомендуется):

1. **Workers & Pages** → **Create** → **Create Worker**
2. Имя: `order-spa-router`
3. Скопируй код из `cloudflare-worker.js`
4. **Save and Deploy**
5. **Settings** → **Triggers** → **Add route**:
    - Route: `order.dolinaflo.com/*`
    - Zone: `dolinaflo.com`

#### Или через CLI:

```bash
npm install -g wrangler
wrangler login
wrangler deploy cloudflare-worker.js --name order-spa-router
wrangler route add "order.dolinaflo.com/*" order-spa-router
```

## Проверка

Подожди 2-5 минут после настройки DNS, затем:

```bash
# DNS
dig order.dolinaflo.com

# Доступность
curl -I https://order.dolinaflo.com
```

Открой в браузере:

- https://order.dolinaflo.com
- https://order.dolinaflo.com/flowers
- https://order.dolinaflo.com/orders

## Обновление сайта

```bash
# Быстрый деплой
make deploy-gcs

# Или
./upload-to-gcs.sh
```

## Полезные ссылки

- **Bucket**: https://console.cloud.google.com/storage/browser/order.dolinaflo.com
- **Cloudflare**: https://dash.cloudflare.com/
- **Backend**: https://console.cloud.google.com/run?project=dolina-flower-order

## Стоимость

- GCS: ~$1-2/мес
- Cloudflare: $0 (Free)
- Backend: ~$5-10/мес

**Итого**: $6-12/мес

## Troubleshooting

### 404 на роутах

→ Проверь Worker настроен и активен

### CORS ошибки

→ Backend должен разрешать `order.dolinaflo.com`

### Старая версия

→ Cloudflare: Caching → Purge Everything

## 🎉 Готово!

После настройки Cloudflare твой сайт будет на:

**https://order.dolinaflo.com**

