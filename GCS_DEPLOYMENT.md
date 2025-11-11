# Google Cloud Storage Deployment Guide

## Деплой фронтенда в GCS с доменом Cloudflare

### Быстрый старт

```bash
chmod +x deploy-to-gcs.sh
./deploy-to-gcs.sh
```

### Ручной деплой

#### 1. Установка зависимостей и сборка

```bash
export REACT_APP_API_BASE_URL=https://dolina-flower-order-backend-373154353561.europe-west1.run.app/api/v1
npm install
npm run build
```

#### 2. Создание bucket

```bash
export PROJECT_ID="dolina-flower-order"
export BUCKET_NAME="order.dolinaflo.com"

gcloud config set project $PROJECT_ID
gsutil mb -p $PROJECT_ID -l europe-west1 gs://$BUCKET_NAME
```

#### 3. Настройка bucket для хостинга

```bash
# Включить веб-хостинг
gsutil web set -m index.html -e index.html gs://$BUCKET_NAME

# Сделать bucket публичным
gsutil iam ch allUsers:objectViewer gs://$BUCKET_NAME
```

#### 4. Загрузка файлов

```bash
gsutil -m rsync -r -d build/ gs://$BUCKET_NAME
```

#### 5. Установка кэш-заголовков

```bash
# Долгое кэширование для статических файлов
gsutil -m setmeta -h "Cache-Control:public, max-age=31536000" gs://$BUCKET_NAME/static/**

# Без кэширования для index.html
gsutil -m setmeta -h "Cache-Control:no-cache" gs://$BUCKET_NAME/index.html
```

### Настройка Cloudflare

#### 1. DNS настройки

Зайди в Cloudflare DNS для домена `dolinaflo.com`:

1. **Добавь CNAME запись:**
    - Type: `CNAME`
    - Name: `order`
    - Target: `c.storage.googleapis.com`
    - Proxy status: ✅ Proxied (оранжевое облако)
    - TTL: Auto

2. **Альтернативно через Load Balancer (если нужна дополнительная отказоустойчивость):**
    - Name: `order`
    - Target: `c.storage.googleapis.com`
    - Можно добавить несколько endpoint'ов Google Storage

#### 2. SSL/TLS настройки

В Cloudflare SSL/TLS:

1. **Encryption mode:** Full или Flexible
2. **Always Use HTTPS:** ✅ Enabled
3. **Minimum TLS Version:** TLS 1.2 или выше
4. **Automatic HTTPS Rewrites:** ✅ Enabled

#### 3. Page Rules (опционально)

Создай Page Rule для `order.dolinaflo.com/*`:

- **Browser Cache TTL:** 4 hours
- **Cache Level:** Standard
- **Always Online:** On

#### 4. Проверка настроек

```bash
# Проверка DNS
dig order.dolinaflo.com

# Проверка доступности
curl -I https://order.dolinaflo.com
```

### Обновление деплоя

```bash
# Просто запусти скрипт снова
./deploy-to-gcs.sh
```

Или вручную:

```bash
npm run build
gsutil -m rsync -r -d build/ gs://order.dolinaflo.com
```

### Откат к предыдущей версии

```bash
# Просмотр версий (если включено версионирование)
gsutil ls -a gs://order.dolinaflo.com

# Восстановление конкретной версии
gsutil cp gs://order.dolinaflo.com/index.html#<generation> gs://order.dolinaflo.com/index.html
```

### Мониторинг и логи

```bash
# Просмотр содержимого bucket
gsutil ls -r gs://order.dolinaflo.com

# Проверка метаданных файла
gsutil stat gs://order.dolinaflo.com/index.html

# Размер bucket
gsutil du -sh gs://order.dolinaflo.com
```

### Безопасность

#### CORS (если нужно)

Создай файл `cors.json`:

```json
[
  {
    "origin": ["https://order.dolinaflo.com"],
    "method": ["GET", "HEAD"],
    "responseHeader": ["Content-Type"],
    "maxAgeSeconds": 3600
  }
]
```

Примени:

```bash
gsutil cors set cors.json gs://order.dolinaflo.com
```

### Troubleshooting

#### Проблема: 404 на страницах React Router

GCS не поддерживает SPA routing out-of-box. Решения:

1. **Использовать Hash Router** (изменить `BrowserRouter` на `HashRouter`)
2. **Использовать Cloudflare Workers** для редиректа всех запросов на index.html
3. **Использовать Firebase Hosting** вместо GCS (поддерживает rewrites)

Для Cloudflare Workers создай Worker:

```javascript
addEventListener('fetch', event => {
  event.respondWith(handleRequest(event.request))
})

async function handleRequest(request) {
  const url = new URL(request.url)
  
  // If requesting a file with extension, pass through
  if (url.pathname.includes('.')) {
    return fetch(request)
  }
  
  // Otherwise, serve index.html
  const indexUrl = new URL(request.url)
  indexUrl.pathname = '/index.html'
  return fetch(indexUrl.toString())
}
```

#### Проблема: CORS ошибки

Проверь backend CORS настройки:

```bash
curl -I -X OPTIONS \
  -H "Origin: https://order.dolinaflo.com" \
  -H "Access-Control-Request-Method: GET" \
  https://dolina-flower-order-backend-373154353561.europe-west1.run.app/api/v1/flowers
```

### CI/CD с GitHub Actions

Создай `.github/workflows/deploy.yml`:

```yaml
name: Deploy to GCS

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
          
      - name: Build
        run: |
          npm install
          npm run build
        env:
          REACT_APP_API_BASE_URL: https://dolina-flower-order-backend-373154353561.europe-west1.run.app/api/v1
          
      - name: Setup Cloud SDK
        uses: google-github-actions/setup-gcloud@v1
        with:
          project_id: dolina-flower-order
          service_account_key: ${{ secrets.GCP_SA_KEY }}
          
      - name: Deploy to GCS
        run: |
          gsutil -m rsync -r -d build/ gs://order.dolinaflo.com
          gsutil -m setmeta -h "Cache-Control:public, max-age=31536000" gs://order.dolinaflo.com/static/**
          gsutil -m setmeta -h "Cache-Control:no-cache" gs://order.dolinaflo.com/index.html
```

### Costs

Google Cloud Storage pricing (europe-west1):

- Storage: ~$0.020 per GB/month
- Network egress: ~$0.12 per GB (to internet)
- Operations: Class A ~$0.05 per 10k ops, Class B ~$0.004 per 10k ops

Для статического сайта с небольшим трафиком стоимость будет минимальной (~$1-5/month).

### Полезные команды

```bash
# Очистка bucket
gsutil -m rm -r gs://order.dolinaflo.com/**

# Копирование между buckets
gsutil -m cp -r gs://source-bucket/* gs://order.dolinaflo.com/

# Включение версионирования
gsutil versioning set on gs://order.dolinaflo.com

# Настройка lifecycle (автоудаление старых версий)
gsutil lifecycle set lifecycle.json gs://order.dolinaflo.com
```

