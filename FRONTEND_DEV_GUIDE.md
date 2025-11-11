# Frontend Development Guide - Dolina Flower Order

## Backend API Information

### Production Backend URL
```
https://dolina-flower-order-backend-yakk46t3xa-ew.a.run.app
```

### Backend Architecture
- **Platform:** Google Cloud Run (serverless containers)
- **Language:** Go 1.21+
- **Framework:** Chi router
- **Database:** PostgreSQL 15 (Cloud SQL)
- **Region:** europe-west1 (Belgium)
- **Authentication:** Google Cloud IAM (requires Bearer token)

**Note:** API требует аутентификацию. Для локальной разработки используй:
```bash
# Получить токен
gcloud auth print-identity-token

# Использовать в headers
Authorization: Bearer <token>
```

### Backend Features
- RESTful API с JSON responses
- CORS enabled для всех origins
- Automatic container scaling (0-10 instances)
- Cloud SQL Proxy для безопасного подключения к БД
- Structured logging с Google Cloud Logging
- Health checks и graceful shutdown

### API Endpoints

#### Health Check
```
GET /health
Response: {"service":"dolina-flower-order-backend","status":"ok","timestamp":"..."}
```

#### Ping
```
GET /api/v1/ping
Response: {"message":"pong"}
```

#### Get Available Flowers
```
GET /api/v1/flowers
Response: {
  "flowers": [
    {
      "variety": "Red Naomi",
      "length": 70,
      "box_count": 10.5,
      "pack_rate": 20,
      "total_stems": 210,
      "farm_name": "KENYA FARM 1",
      "truck_name": "TRUCK A",
      "price": 0.0
    }
  ]
}
```

#### Create Order
```
POST /api/v1/orders
Content-Type: application/json

Request Body:
{
  "mark_box": "VVA",
  "customer_id": "customer123",
  "items": [
    {
      "variety": "Red Naomi",
      "length": 70,
      "box_count": 10.5,
      "pack_rate": 20,
      "total_stems": 210,
      "farm_name": "KENYA FARM 1",
      "truck_name": "TRUCK A",
      "comments": "Optional comments",
      "price": 0.0
    }
  ],
  "notes": "Optional order notes"
}

Response:
{
  "id": 1,
  "mark_box": "VVA",
  "customer_id": "customer123",
  "status": "pending",
  "created_at": "2025-11-05T10:00:00Z",
  "items": [...],
  "notes": "Optional order notes"
}
```

#### Get Order by ID
```
GET /api/v1/orders/{id}
Response: Full order object with all items
```

#### Get Orders List (TODO: Not implemented yet)
```
GET /api/v1/orders?limit=50&offset=0&status=pending
```

#### Update Order (TODO: Not implemented yet)
```
PATCH /api/v1/orders/{id}
```

## Environment Variables for Frontend

Create `.env` file in your frontend project:

```env
# For development with authentication
VITE_API_BASE_URL=https://dolina-flower-order-backend-yakk46t3xa-ew.a.run.app/api/v1

# For local backend (if you run it locally)
# VITE_API_BASE_URL=http://localhost:8080/api/v1
```

## Authentication Setup for Development

Since the API requires authentication, you have two options:

### Option 1: Use gcloud token (for testing)
```typescript
// services/api.ts
import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL,
});

// Add interceptor to add auth token
api.interceptors.request.use(async (config) => {
  // Get token from gcloud (you need to run: gcloud auth print-identity-token)
  // For now, you can manually copy-paste token or implement auth flow
  const token = localStorage.getItem('gcp_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default api;
```

### Option 2: Run backend locally without auth
1. Clone backend repo
2. Set up local PostgreSQL
3. Run: `ENV=development go run cmd/server/main.go`
4. Backend will be at `http://localhost:8080`

## CORS Configuration

Backend already has CORS enabled:
```go
Access-Control-Allow-Origin: *
Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS
Access-Control-Allow-Headers: Origin, Content-Type, Content-Length, Accept-Encoding, X-CSRF-Token, Authorization
```

## Error Handling

Backend returns errors in format:
```json
{
  "error": "error message here"
}
```

HTTP Status Codes:
- `200 OK` - Success
- `201 Created` - Resource created
- `400 Bad Request` - Validation error
- `404 Not Found` - Resource not found
- `500 Internal Server Error` - Server error

## TypeScript Types

```typescript
// types/flower.ts
export interface Flower {
  variety: string;
  length: number;
  box_count: number;
  pack_rate: number;
  total_stems: number;
  farm_name: string;
  truck_name: string;
  price: number;
}

export interface FlowersResponse {
  flowers: Flower[];
}

// types/order.ts
export interface OrderItem {
  variety: string;
  length: number;
  box_count: number;
  pack_rate: number;
  total_stems: number;
  farm_name: string;
  truck_name: string;
  comments?: string;
  price: number;
}

export interface CreateOrderRequest {
  mark_box: string;
  customer_id: string;
  items: OrderItem[];
  notes?: string;
}

export interface Order {
  id: number;
  mark_box: string;
  customer_id: string;
  status: 'pending' | 'confirmed' | 'cancelled';
  created_at: string;
  items: OrderItem[];
  notes?: string;
}
```

## Quick Start Frontend Project

```bash
# Create Vite + React + TypeScript project
npm create vite@latest dolina-frontend -- --template react-ts
cd dolina-frontend

# Install dependencies
npm install
npm install axios react-router-dom zod react-hook-form @hookform/resolvers

# Install Tailwind CSS
npm install -D tailwindcss postcss autoprefixer
npx tailwindcss init -p

# Install UI library (optional)
npm install @radix-ui/react-dialog @radix-ui/react-dropdown-menu

# Install toast notifications
npm install sonner
```

## Example API Service

```typescript
// services/api.ts
import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080/api/v1',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add request interceptor for auth
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('gcp_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Add response interceptor for error handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const message = error.response?.data?.error || 'An error occurred';
    console.error('API Error:', message);
    return Promise.reject(error);
  }
);

export const flowersApi = {
  getAll: () => api.get('/flowers'),
};

export const ordersApi = {
  create: (data: CreateOrderRequest) => api.post('/orders', data),
  getById: (id: string) => api.get(`/orders/${id}`),
};

export default api;
```

## Testing the API

Use this script to test API endpoints:

```bash
#!/bin/bash
# test-api.sh

TOKEN=$(gcloud auth print-identity-token)
BASE_URL="https://dolina-flower-order-backend-yakk46t3xa-ew.a.run.app"

echo "Testing health endpoint..."
curl -H "Authorization: Bearer $TOKEN" "$BASE_URL/health"

echo -e "\n\nTesting ping endpoint..."
curl -H "Authorization: Bearer $TOKEN" "$BASE_URL/api/v1/ping"

echo -e "\n\nTesting flowers endpoint..."
curl -H "Authorization: Bearer $TOKEN" "$BASE_URL/api/v1/flowers"
```

## GCP Project Details

### Backend Infrastructure
- **Project ID:** dolina-flower-order
- **Project Number:** 373154353561
- **Region:** europe-west1 (Belgium)
- **Backend Service:** Cloud Run (dolina-flower-order-backend)
- **Database:** Cloud SQL PostgreSQL 15
  - Instance: `dolina-flower-db`
  - Connection: Private IP (VPC)
  - Automatic backups: Daily at 03:00 UTC
  - High availability: Disabled (для MVP)

### Frontend Deployment (Cloud Run)

**Рекомендуемая конфигурация для деплоя фронтенда на Cloud Run:**

```yaml
# cloudbuild.yaml для фронтенда
steps:
  # Build React app
  - name: 'node:18'
    entrypoint: 'npm'
    args: ['install']

  - name: 'node:18'
    entrypoint: 'npm'
    args: ['run', 'build']
    env:
      - 'VITE_API_BASE_URL=https://dolina-flower-order-backend-yakk46t3xa-ew.a.run.app/api/v1'

  # Build Docker image
  - name: 'gcr.io/cloud-builders/docker'
    args: ['build', '-t', 'gcr.io/$PROJECT_ID/dolina-frontend:$SHORT_SHA', '.']

  # Push to Container Registry
  - name: 'gcr.io/cloud-builders/docker'
    args: ['push', 'gcr.io/$PROJECT_ID/dolina-frontend:$SHORT_SHA']

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
      - '--max-instances=5'
      - '--set-env-vars=API_BASE_URL=https://dolina-flower-order-backend-yakk46t3xa-ew.a.run.app/api/v1'

images:
  - 'gcr.io/$PROJECT_ID/dolina-frontend:$SHORT_SHA'
```

### Dockerfile для фронтенда

```dockerfile
# Dockerfile
# Stage 1: Build
FROM node:18-alpine AS build
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
RUN npm run build

# Stage 2: Serve with nginx
FROM nginx:alpine
COPY --from=build /app/build /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 8080
CMD ["nginx", "-g", "daemon off;"]
```

### nginx.conf для Cloud Run

```nginx
server {
    listen 8080;
    server_name _;
    root /usr/share/nginx/html;
    index index.html;

    # Enable gzip
    gzip on;
    gzip_types text/plain text/css application/json application/javascript text/xml application/xml text/javascript;

    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;

    # React Router - все маршруты идут на index.html
    location / {
        try_files $uri $uri/ /index.html;
    }

    # Cache static assets
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }

    # Health check endpoint для Cloud Run
    location /health {
        access_log off;
        return 200 "healthy\n";
        add_header Content-Type text/plain;
    }
}
```

### Deploy Commands

```bash
# 1. Включить необходимые API
gcloud services enable cloudbuild.googleapis.com
gcloud services enable run.googleapis.com
gcloud services enable containerregistry.googleapis.com

# 2. Настроить Cloud Build для автоматического деплоя
gcloud builds submit --config=cloudbuild.yaml

# 3. Или деплой вручную
# Build Docker image
docker build -t gcr.io/dolina-flower-order/dolina-frontend:latest .

# Push to GCR
docker push gcr.io/dolina-flower-order/dolina-frontend:latest

# Deploy to Cloud Run
gcloud run deploy dolina-frontend \
  --image gcr.io/dolina-flower-order/dolina-frontend:latest \
  --region europe-west1 \
  --platform managed \
  --allow-unauthenticated \
  --memory 512Mi \
  --cpu 1 \
  --max-instances 5 \
  --set-env-vars API_BASE_URL=https://dolina-flower-order-backend-yakk46t3xa-ew.a.run.app/api/v1

# 4. Настроить custom domain: orderdolina.viazov.dev

# ВАРИАНТ 1: Native Cloud Run Domain Mapping (без Cloudflare Proxy)
# Шаг 1: Добавь в Cloudflare DNS (DNS only, серая тучка):
# Type: CNAME, Name: orderdolina, Target: ghs.googlehosted.com, Proxy: OFF

# Шаг 2: Verify domain в Google Search Console
# https://search.google.com/search-console
# Добавь TXT запись для верификации

# Шаг 3: Map domain
gcloud run domain-mappings create \
  --service dolina-frontend \
  --domain orderdolina.viazov.dev \
  --region europe-west1

# ВАРИАНТ 2: С Cloudflare Proxy (рекомендуется - DDoS protection + CDN)
# Шаг 1: Получи Cloud Run URL
CLOUD_RUN_URL=$(gcloud run services describe dolina-frontend --region=europe-west1 --format='value(status.url)')
echo $CLOUD_RUN_URL  # Пример: https://dolina-frontend-xxx-ew.a.run.app

# Шаг 2: В Cloudflare DNS добавь:
# Type: CNAME
# Name: orderdolina
# Target: dolina-frontend-xxx-ew.a.run.app (БЕЗ https://, только hostname)
# Proxy: ON (оранжевая тучка) ✅
#
# Cloudflare настройки:
# SSL/TLS → Full (strict)
# Always Use HTTPS: ON
# Automatic HTTPS Rewrites: ON

# Шаг 3: Проверь
curl -I https://orderdolina.viazov.dev/health
```

### CI/CD Setup (Cloud Build Triggers)

**Настройка автоматического деплоя при push в main:**

1. Подключить GitHub/GitLab репозиторий к Cloud Build
2. Создать trigger:

```bash
gcloud builds triggers create github \
  --repo-name=dolina-flower-order-frontend \
  --repo-owner=maxviazov \
  --branch-pattern="^main$" \
  --build-config=cloudbuild.yaml \
  --description="Deploy frontend on push to main"
```

3. Каждый commit в `main` будет автоматически деплоиться

### Мониторинг и Логи

```bash
# Просмотр логов фронтенда
gcloud logging read "resource.type=cloud_run_revision AND resource.labels.service_name=dolina-frontend" \
  --project=dolina-flower-order \
  --limit=100 \
  --format=json

# Метрики Cloud Run
gcloud monitoring dashboards list --project=dolina-flower-order

# Просмотр всех деплоев
gcloud run revisions list --service=dolina-frontend --region=europe-west1
```

### Cost Estimation

**Приблизительные расходы на GCP (в месяц):**

- **Cloud Run (Frontend):** $5-15/месяц
  - 0-5 instances, 512Mi RAM, 1 vCPU
  - ~100K requests/месяц

- **Cloud Run (Backend):** $10-25/месяц
  - 0-10 instances, 1Gi RAM, 1 vCPU
  - ~200K requests/месяц

- **Cloud SQL (PostgreSQL):** $25-50/месяц
  - db-f1-micro (0.6GB RAM, shared CPU)
  - 10GB storage
  - Automatic backups

- **Cloud Storage (для статики, опционально):** $1-5/месяц

- **Cloud Build:** Бесплатно (120 build-минут/день)

**Total: ~$40-95/месяц** (зависит от трафика)

### Scaling Configuration

```bash
# Автоскейлинг фронтенда
gcloud run services update dolina-frontend \
  --region europe-west1 \
  --min-instances=0 \
  --max-instances=5 \
  --concurrency=80 \
  --cpu-throttling \
  --memory=512Mi

# Для production с высокой нагрузкой
gcloud run services update dolina-frontend \
  --region europe-west1 \
  --min-instances=1 \
  --max-instances=20 \
  --concurrency=100
```

## Support

For backend issues or questions:
- Repository: https://github.com/maxviazov/dolina-flower-order-backend
- Backend logs: `gcloud logging read "resource.type=cloud_run_revision AND resource.labels.service_name=dolina-flower-order-backend" --project=dolina-flower-order --limit=50`

## Next Steps

1. ✅ Set up Vite + React + TypeScript project
2. ✅ Install dependencies (axios, react-router-dom, etc.)
3. ✅ Configure Tailwind CSS
4. ✅ Create API service layer
5. ✅ Implement authentication flow (get token from gcloud)
6. ✅ Build pages according to FRONTEND_TECH_SPEC.md
7. ✅ Test with production API

Good luck with frontend development! 🚀
