# 🚀 Deployment Guide - Dolina Flower Order Frontend

## Production URL
**https://orderdolina.viazov.dev**

## Краткий План Деплоя

### 📋 Prerequisites (5-10 минут)
```bash
# 1. Установить gcloud CLI (если еще нет)
brew install google-cloud-sdk

# 2. Аутентификация
gcloud auth login
gcloud config set project dolina-flower-order

# 3. Включить необходимые API
gcloud services enable cloudbuild.googleapis.com
gcloud services enable run.googleapis.com
gcloud services enable containerregistry.googleapis.com
```

### 🔧 Исправить Критические Баги (2-3 часа)

#### 1. Fix API Configuration
**Файл:** `src/services/api.ts`

```typescript
// БЫЛО (❌ не будет работать в production):
const API_BASE_URL = 'http://localhost:8080/api/v1';

// СТАЛО (✅):
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080/api/v1';
```

#### 2. Fix package.json
**Файл:** `package.json`

Заменить полностью на:
```json
{
  "name": "dolina-flower-order-frontend",
  "version": "1.0.0",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "tsc && vite build",
    "preview": "vite preview"
  },
  "dependencies": {
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "react-router-dom": "^6.20.0",
    "axios": "^1.6.2",
    "react-hook-form": "^7.49.0",
    "@hookform/resolvers": "^3.3.2",
    "zod": "^3.22.4",
    "zustand": "^4.4.7",
    "sonner": "^1.2.4"
  },
  "devDependencies": {
    "@types/react": "^18.2.43",
    "@types/react-dom": "^18.2.17",
    "@vitejs/plugin-react": "^4.2.1",
    "autoprefixer": "^10.4.16",
    "postcss": "^8.4.32",
    "tailwindcss": "^3.4.0",
    "typescript": "^5.3.3",
    "vite": "^5.0.8"
  }
}
```

#### 3. Создать vite.config.ts
**Файл:** `vite.config.ts`

```typescript
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    host: true,
  },
  build: {
    outDir: 'build',
    sourcemap: false,
  },
});
```

#### 4. Создать .env файлы
**Файл:** `.env` (для локальной разработки)
```env
VITE_API_BASE_URL=http://localhost:8080/api/v1
```

**Файл:** `.env.production` (для production)
```env
VITE_API_BASE_URL=https://dolina-flower-order-backend-yakk46t3xa-ew.a.run.app/api/v1
```

**Важно:** Убедись что `.env*` в `.gitignore`!

#### 5. Add Authentication Interceptor
**Файл:** `src/services/api.ts`

```typescript
import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080/api/v1';

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
});

// Add auth interceptor for production
api.interceptors.request.use((config) => {
  if (import.meta.env.PROD) {
    const token = localStorage.getItem('gcp_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  }
  return config;
});

// Handle errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    console.error('API Error:', error);
    if (error.response?.status === 401) {
      console.error('Authentication required');
      // TODO: Redirect to login or show auth modal
    }
    return Promise.reject(error);
  }
);

export default api;
export { flowersApi, ordersApi };
```

### 📦 Создать Deployment Files (30 минут)

#### Dockerfile
```dockerfile
# Stage 1: Build
FROM node:18-alpine AS build
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
ARG VITE_API_BASE_URL
ENV VITE_API_BASE_URL=$VITE_API_BASE_URL
RUN npm run build

# Stage 2: Serve
FROM nginx:alpine
COPY --from=build /app/build /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 8080
CMD ["nginx", "-g", "daemon off;"]
```

#### nginx.conf
```nginx
server {
    listen 8080;
    root /usr/share/nginx/html;
    index index.html;

    # Gzip compression
    gzip on;
    gzip_types text/plain text/css application/json application/javascript text/xml application/xml text/javascript;
    gzip_vary on;

    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header Referrer-Policy "no-referrer-when-downgrade" always;

    # React Router - SPA fallback
    location / {
        try_files $uri $uri/ /index.html;
    }

    # Cache static assets
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }

    # Health check for Cloud Run
    location /health {
        access_log off;
        return 200 "healthy\n";
        add_header Content-Type text/plain;
    }
}
```

#### cloudbuild.yaml
```yaml
steps:
  # Install dependencies
  - name: 'node:18'
    entrypoint: 'npm'
    args: ['install']

  # Build React app
  - name: 'node:18'
    entrypoint: 'npm'
    args: ['run', 'build']
    env:
      - 'VITE_API_BASE_URL=https://dolina-flower-order-backend-yakk46t3xa-ew.a.run.app/api/v1'

  # Build Docker image
  - name: 'gcr.io/cloud-builders/docker'
    args:
      - 'build'
      - '-t'
      - 'gcr.io/$PROJECT_ID/dolina-frontend:$SHORT_SHA'
      - '-t'
      - 'gcr.io/$PROJECT_ID/dolina-frontend:latest'
      - '--build-arg'
      - 'VITE_API_BASE_URL=https://dolina-flower-order-backend-yakk46t3xa-ew.a.run.app/api/v1'
      - '.'

  # Push to Container Registry
  - name: 'gcr.io/cloud-builders/docker'
    args: ['push', 'gcr.io/$PROJECT_ID/dolina-frontend:$SHORT_SHA']

  - name: 'gcr.io/cloud-builders/docker'
    args: ['push', 'gcr.io/$PROJECT_ID/dolina-frontend:latest']

  # Deploy to Cloud Run
  - name: 'gcr.io/google.com/cloudsdktool/cloud-sdk'
    entrypoint: gcloud
    args:
      - 'run'
      - 'deploy'
      - 'dolina-frontend'
      - '--image=gcr.io/$PROJECT_ID/dolina-frontend:$SHORT_SHA'
      - '--region=europe-west1'
      - '--platform=managed'
      - '--allow-unauthenticated'
      - '--memory=512Mi'
      - '--cpu=1'
      - '--min-instances=0'
      - '--max-instances=5'
      - '--concurrency=80'
      - '--timeout=60'

images:
  - 'gcr.io/$PROJECT_ID/dolina-frontend:$SHORT_SHA'
  - 'gcr.io/$PROJECT_ID/dolina-frontend:latest'

options:
  logging: CLOUD_LOGGING_ONLY
```

#### .dockerignore
```
node_modules
npm-debug.log
.git
.gitignore
README.md
.env
.env.local
.env.production
.DS_Store
build
dist
coverage
.vscode
.idea
*.log
```

### 🚀 Деплой (10-15 минут)

#### Вариант 1: Manual Deploy (для первого раза)
```bash
# 1. Test local build
npm install
npm run build
npm run preview

# 2. Test Docker locally
docker build -t dolina-frontend \
  --build-arg VITE_API_BASE_URL=https://dolina-flower-order-backend-yakk46t3xa-ew.a.run.app/api/v1 .

docker run -p 8080:8080 dolina-frontend
# Open http://localhost:8080

# 3. Build and push to GCR
docker tag dolina-frontend gcr.io/dolina-flower-order/dolina-frontend:v1
docker push gcr.io/dolina-flower-order/dolina-frontend:v1

# 4. Deploy to Cloud Run
gcloud run deploy dolina-frontend \
  --image gcr.io/dolina-flower-order/dolina-frontend:v1 \
  --region europe-west1 \
  --platform managed \
  --allow-unauthenticated \
  --memory 512Mi \
  --cpu 1 \
  --min-instances 0 \
  --max-instances 5
```

#### Вариант 2: Cloud Build (рекомендуется)
```bash
# Deploy через Cloud Build
gcloud builds submit --config=cloudbuild.yaml

# Получить URL
gcloud run services describe dolina-frontend \
  --region=europe-west1 \
  --format='value(status.url)'
```

### 🌐 Настройка Домена Cloudflare (5 минут)

#### Шаг 1: Получить Cloud Run URL
```bash
CLOUD_RUN_URL=$(gcloud run services describe dolina-frontend \
  --region=europe-west1 \
  --format='value(status.url)' | sed 's|https://||')

echo "Add CNAME: orderdolina → $CLOUD_RUN_URL"
```

#### Шаг 2: Добавить CNAME в Cloudflare
1. Перейди на https://dash.cloudflare.com
2. Выбери домен `viazov.dev`
3. DNS → Add record:

```
┌─────────────────────────────────────────────────┐
│ Type:   CNAME                                   │
│ Name:   orderdolina                             │
│ Target: dolina-frontend-xxx-ew.a.run.app       │
│ Proxy:  ✅ Proxied (оранжевая тучка)            │
│ TTL:    Auto                                    │
└─────────────────────────────────────────────────┘
```

#### Шаг 3: Настроить SSL/TLS
- SSL/TLS → Overview → **Full (strict)**
- SSL/TLS → Edge Certificates:
  - ✅ Always Use HTTPS
  - ✅ Automatic HTTPS Rewrites
  - ✅ Minimum TLS Version: 1.2

#### Шаг 4: Speed Settings (опционально)
- Speed → Optimization:
  - ✅ Auto Minify: HTML, CSS, JS
  - ✅ Brotli
  - ❌ Rocket Loader (может сломать React)

#### Шаг 5: Проверка
```bash
# Wait 1-2 minutes for DNS propagation, then:
curl -I https://orderdolina.viazov.dev/health

# Should return:
# HTTP/2 200
# cf-ray: xxx
# cf-cache-status: DYNAMIC
```

### ✅ Post-Deployment Checklist

```bash
# 1. Health check
curl https://orderdolina.viazov.dev/health
# Expected: 200 OK "healthy"

# 2. Test API connectivity
curl https://orderdolina.viazov.dev/

# 3. Check logs
gcloud logging read "resource.type=cloud_run_revision" \
  --limit=20 \
  --format=json

# 4. Check service status
gcloud run services describe dolina-frontend --region=europe-west1

# 5. Test from browser
open https://orderdolina.viazov.dev

# 6. Smoke test всех pages:
# - https://orderdolina.viazov.dev/ (FlowersPage)
# - https://orderdolina.viazov.dev/create-order (CreateOrderPage)
# - https://orderdolina.viazov.dev/orders/1 (OrderPage)
```

### 🔄 CI/CD Setup (опционально, 10 минут)

```bash
# 1. Connect GitHub repo to Cloud Build
# https://console.cloud.google.com/cloud-build/triggers

# 2. Create trigger via gcloud
gcloud builds triggers create github \
  --repo-name=dolina-flower-order-frontend \
  --repo-owner=maxviazov \
  --branch-pattern="^main$" \
  --build-config=cloudbuild.yaml \
  --description="Auto-deploy frontend on push to main"

# 3. Test trigger
git commit -m "Test CI/CD" --allow-empty
git push origin main

# 4. Monitor build
gcloud builds list --limit=5
```

### 📊 Monitoring & Alerts

```bash
# Create uptime check
gcloud monitoring uptime create \
  --display-name="Frontend Uptime" \
  --host=orderdolina.viazov.dev \
  --path=/health \
  --check-interval=60s

# View logs in real-time
gcloud logging tail "resource.type=cloud_run_revision AND resource.labels.service_name=dolina-frontend"

# View metrics
gcloud monitoring dashboards list
```

### 🐛 Troubleshooting

#### Build fails
```bash
# Check Cloud Build logs
gcloud builds list --limit=5
gcloud builds log [BUILD_ID]

# Common issues:
# - Wrong Node version → Use node:18
# - Missing dependencies → Check package.json
# - TypeScript errors → Run `npm run build` locally first
```

#### Container crashes
```bash
# Check logs
gcloud logging read "resource.type=cloud_run_revision AND severity>=ERROR" --limit=50

# Test locally
docker run -p 8080:8080 gcr.io/dolina-flower-order/dolina-frontend:latest
```

#### CORS errors
```bash
# Check if backend CORS is configured correctly
curl -I -X OPTIONS https://dolina-flower-order-backend-yakk46t3xa-ew.a.run.app/api/v1/flowers \
  -H "Origin: https://orderdolina.viazov.dev"

# Should have:
# Access-Control-Allow-Origin: *
```

#### Domain not working
```bash
# Check DNS
dig orderdolina.viazov.dev +short
# Should show Cloudflare IPs (104.x.x.x or 172.x.x.x)

# Check Cloudflare SSL
curl -vI https://orderdolina.viazov.dev 2>&1 | grep "SSL"

# If issues, try disabling Cloudflare proxy temporarily (серая тучка)
```

### 📈 Cost Monitoring

```bash
# Check current costs
gcloud billing accounts list
gcloud billing budgets list

# Estimated monthly cost:
# - Cloud Run: $5-10/month (100K requests)
# - Cloud Build: $0 (free tier 120 min/day)
# - Container Registry: $0.10-0.50/month
# - Cloudflare: $0 (free plan)
# Total: ~$5-15/month
```

### 🎯 Success Criteria

После деплоя должно работать:
- ✅ https://orderdolina.viazov.dev загружается
- ✅ https://orderdolina.viazov.dev/health возвращает 200
- ✅ SSL certificate валидный (зеленый замок)
- ✅ Cloudflare proxy активен (проверь response headers)
- ✅ API calls работают (проверь в DevTools → Network)
- ✅ React Router работает (переходы между страницами)
- ✅ Нет ошибок в browser console
- ✅ Нет ошибок в Cloud Run logs

### 📞 Support

- **Frontend Issues:** https://github.com/maxviazov/dolina-flower-order-frontend/issues
- **Backend Issues:** https://github.com/maxviazov/dolina-flower-order-backend/issues
- **GCP Console:** https://console.cloud.google.com/run?project=dolina-flower-order
- **Cloudflare:** https://dash.cloudflare.com

---

**Estimated Total Time:** 3-4 hours (including fixes + deployment + testing)

**Priority:** HIGH - Deployment blocking issues must be fixed first!

See **CODE_REVIEW.md** for detailed code quality improvements.
