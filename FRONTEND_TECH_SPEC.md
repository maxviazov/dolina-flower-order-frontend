# Техническое задание: Фронтенд для системы заказа цветов

## Обзор
Создать веб-приложение для заказа цветов на основе существующего бэкенда. Приложение должно позволять пользователям просматривать доступные цветы и создавать заказы.

## Backend Architecture

### Инфраструктура
- **Platform:** Google Cloud Run (Serverless)
- **Language:** Go 1.21+
- **Framework:** Chi Router
- **Database:** Cloud SQL PostgreSQL 15
- **Region:** europe-west1 (Belgium)
- **Production URL:** `https://dolina-flower-order-backend-yakk46t3xa-ew.a.run.app`

### Backend Stack
```
┌─────────────────────────────────────────────┐
│         Google Cloud Platform               │
│                                             │
│  ┌────────────┐         ┌────────────┐     │
│  │ Cloud Run  │◄───────►│ Cloud SQL  │     │
│  │  Backend   │         │ PostgreSQL │     │
│  │  (Go)      │         │            │     │
│  └────────────┘         └────────────┘     │
│       ▲                                     │
│       │ HTTPS                               │
│       │                                     │
│  ┌────────────┐                            │
│  │ Cloud Run  │                            │
│  │  Frontend  │                            │
│  │ (React)    │                            │
│  └────────────┘                            │
└─────────────────────────────────────────────┘
```

### Database Schema
```sql
-- Таблица flowers (источник данных от ферм)
CREATE TABLE flowers (
    id SERIAL PRIMARY KEY,
    variety VARCHAR(255) NOT NULL,
    length INT NOT NULL,
    box_count DECIMAL(10,2) NOT NULL,
    pack_rate INT NOT NULL,
    total_stems INT NOT NULL,
    farm_name VARCHAR(255) NOT NULL,
    truck_name VARCHAR(255) NOT NULL,
    price DECIMAL(10,2) DEFAULT 0.0,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Таблица orders
CREATE TABLE orders (
    id SERIAL PRIMARY KEY,
    mark_box VARCHAR(50) NOT NULL,
    customer_id VARCHAR(255) NOT NULL,
    status VARCHAR(50) DEFAULT 'pending',
    notes TEXT,
    created_at TIMESTAMP DEFAULT NOW(),
    processed_at TIMESTAMP,
    farm_order_id VARCHAR(255)
);

-- Таблица order_items
CREATE TABLE order_items (
    id SERIAL PRIMARY KEY,
    order_id INT REFERENCES orders(id) ON DELETE CASCADE,
    variety VARCHAR(255) NOT NULL,
    length INT NOT NULL,
    box_count DECIMAL(10,2) NOT NULL,
    pack_rate INT NOT NULL,
    total_stems INT NOT NULL,
    farm_name VARCHAR(255) NOT NULL,
    truck_name VARCHAR(255) NOT NULL,
    comments TEXT,
    price DECIMAL(10,2) DEFAULT 0.0,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Indexes для производительности
CREATE INDEX idx_orders_customer ON orders(customer_id);
CREATE INDEX idx_orders_status ON orders(status);
CREATE INDEX idx_order_items_order ON order_items(order_id);
CREATE INDEX idx_flowers_variety ON flowers(variety);
```

### Backend Features
- ✅ RESTful API с JSON responses
- ✅ CORS enabled (для всех origins в MVP)
- ✅ Cloud SQL Connection Pooling
- ✅ Structured logging (Cloud Logging)
- ✅ Health checks (`/health`)
- ✅ Graceful shutdown
- ✅ Auto-scaling (0-10 instances)
- ⏳ Authentication (IAM в production)
- ⏳ Rate limiting (планируется)
- ⏳ API versioning (v1 готова)

## API Бэкенда

### Base URL
```
Production: https://dolina-flower-order-backend-yakk46t3xa-ew.a.run.app/api/v1
Local:      http://localhost:8080/api/v1
```

### Authentication
Для production API требуется Bearer token от Google Cloud IAM:
```bash
TOKEN=$(gcloud auth print-identity-token)
curl -H "Authorization: Bearer $TOKEN" $API_URL/flowers
```

Бэкенд предоставляет следующие endpoints:

### Получение доступных цветов
- **URL:** `GET /api/v1/flowers`
- **Ответ:**
```json
{
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

### Создание заказа
- **URL:** `POST /api/v1/orders`
- **Тело запроса:**
```json
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
```
- **Ответ:**
```json
{
  "id": 1,
  "mark_box": "VVA",
  "customer_id": "customer123",
  "status": "pending",
  "created_at": "2025-11-05T10:00:00Z",
  "items": ["..."],
  "notes": "Optional order notes"
}
```

### Получение списка заказов
- **URL:** `GET /api/v1/orders`
- **Query параметры:**
  - `limit` - количество заказов на странице (default: 50)
  - `offset` - смещение для пагинации (default: 0)
  - `status` - фильтр по статусу (optional)
- **Ответ:**
```json
{
  "orders": [
    {
      "id": 1,
      "mark_box": "VVA",
      "customer_id": "customer123",
      "status": "pending",
      "created_at": "2025-11-05T10:00:00Z",
      "total_items": 5
    }
  ],
  "total": 100,
  "limit": 50,
  "offset": 0
}
```

### Получение заказа по ID
- **URL:** `GET /api/v1/orders/{id}`
- **Ответ:** Полный объект заказа со всеми items

### Обновление заказа (для специалистов)
- **URL:** `PATCH /api/v1/orders/{id}`
- **Тело запроса:**
```json
{
  "status": "confirmed",
  "items": [
    {
      "variety": "Red Naomi",
      "length": 70,
      "price": 0.45
    }
  ]
}
```
- **Примечание:** Для MVP без аутентификации обновление статуса и цен доступно всем. В будущем будет добавлена проверка прав.
- **Ответ:** Обновленный объект заказа

### Коды ошибок
- `400 Bad Request` - неверные данные запроса
- `404 Not Found` - заказ/ресурс не найден
- `500 Internal Server Error` - ошибка сервера

Формат ошибки:
```json
{
  "error": "validation error: invalid customer_id"
}
```

## Функциональные требования

### 1. Страница списка цветов (`/flowers`)
- Отображение таблицы/карточек с доступными цветами
- Колонки: Variety, Length, Box Count, Pack Rate, Total Stems, Farm, Truck, Price
- Клиентская фильтрация по variety, farm, length (поиск в реальном времени)
- Клиентская сортировка по колонкам (по возрастанию/убыванию)
- Состояния:
  - **Loading**: показать скелетон/спиннер при загрузке
  - **Empty**: "Нет доступных цветов" если список пустой
  - **Error**: показать сообщение об ошибке с кнопкой "Повторить"
- Кнопка "Создать заказ" переводит на `/orders/new`

### 2. Страница создания заказа (`/orders/new`)
- Поля формы:
  - `mark_box` - выбор из dropdown (пока только "VVA", в будущем больше опций)
  - `customer_id` - текстовое поле (обязательное)
  - `notes` - textarea (необязательное)
- Секция добавления items:
  - Кнопка "Добавить позицию" открывает модал с выбором цветка
  - В модале: список цветов из `/api/v1/flowers` с поиском
  - После выбора цветка:
    - `variety`, `length`, `farm_name`, `truck_name` - автозаполняются
    - `box_count` - ввод числа (обязательное, > 0)
    - `pack_rate` - автозаполняется, но можно редактировать
    - `total_stems` - **автоматически рассчитывается** как `Math.floor(box_count * pack_rate)`
    - `price` - поле показывается как "0.00 USD" (будет установлено позже)
    - `comments` - текстовое поле (необязательное)
  - Каждая добавленная позиция отображается в списке с возможностью редактирования/удаления
- Валидация:
  - `customer_id` не пустой
  - Минимум 1 item в заказе
  - `box_count > 0` для каждого item
- Кнопки:
  - "Отмена" - возврат на `/flowers`
  - "Создать заказ" - отправка POST запроса, затем редирект на `/orders/{id}`
- Состояния:
  - Показывать спиннер на кнопке при отправке
  - Показывать toast с ошибкой при неудаче
  - Показывать toast "Заказ создан!" при успехе

### 3. Страница списка заказов (`/orders`)
- Таблица заказов с колонками: ID, Mark Box, Customer ID, Status, Дата создания, Кол-во позиций
- Пагинация (50 заказов на странице)
- Фильтр по статусу (dropdown: все/pending/confirmed/cancelled)
- Клик по строке ведет на `/orders/{id}`
- Цветовая индикация статуса:
  - `pending` - желтый
  - `confirmed` - зеленый
  - `cancelled` - красный
- Состояния: Loading, Empty, Error (аналогично странице цветов)

### 4. Страница детального просмотра заказа (`/orders/{id}`)
- Отображение информации:
  - ID, Mark Box, Customer ID, Status, Дата создания
  - Список всех items с деталями
  - Notes
  - **Total Amount**: сумма всех `item.price * item.total_stems` (если цены установлены)
- Для MVP: кнопка "Редактировать цены" открывает модал:
  - Список всех items
  - Для каждого item можно обновить `price`
  - Кнопка "Сохранить" отправляет PATCH запрос
- Кнопка "Обновить статус" с dropdown (pending/confirmed/cancelled)
- Кнопка "Назад к заказам" → `/orders`

### User Flow
```
/flowers (список цветов)
  ↓ [Создать заказ]
/orders/new (форма создания)
  ↓ [Создать заказ]
/orders/{id} (детали заказа)
  ↓ [Назад к заказам]
/orders (список заказов)
```

### Бизнес-логика цен
- При создании заказа клиентом все `price = 0.0`
- Специалист компании заходит на `/orders/{id}` и устанавливает цены после подтверждения от ферм
- После установки цен автоматически считается Total Amount
- В будущем: статус может меняться только специалистом (через модуль аутентификации)

## Технические требования

### Стек технологий
- **Framework**: React 18+ (с TypeScript)
- **HTTP клиент**: Axios для API запросов
- **CSS Framework**: Tailwind CSS
- **State management**: Context API + useReducer (для такого простого приложения достаточно)
- **Routing**: React Router v6
- **UI библиотека**: Shadcn UI или Headless UI (для модалов, dropdown)
- **Формы**: React Hook Form
- **Валидация**: Zod
- **Toast notifications**: React Hot Toast или Sonner

### Структура проекта
```
frontend/
  src/
    components/
      common/
        Button.tsx
        Input.tsx
        Modal.tsx
        Spinner.tsx
        Toast.tsx
      flowers/
        FlowerTable.tsx
        FlowerFilters.tsx
      orders/
        OrderForm.tsx
        OrderItemsList.tsx
        OrderStatusBadge.tsx
        OrderDetailsView.tsx
        PriceEditModal.tsx
    pages/
      FlowersPage.tsx
      OrdersListPage.tsx
      CreateOrderPage.tsx
      OrderDetailsPage.tsx
    services/
      api.ts          # Axios instance + API endpoints
      apiTypes.ts     # API request/response types
    types/
      flower.ts
      order.ts
    hooks/
      useFlowers.ts   # Fetch flowers logic
      useOrders.ts    # Orders CRUD operations
      useToast.ts     # Toast notifications
    utils/
      validation.ts   # Zod schemas
      calculations.ts # total_stems, total_amount calculations
    context/
      AppContext.tsx  # Global app state (if needed)
    App.tsx
    main.tsx
  public/
  package.json
  tsconfig.json
  tailwind.config.js
  vite.config.ts
```

### Дизайн
- Адаптивный дизайн для мобильных (375px+) и десктопных (1024px+) устройств
- Чистый, минималистичный интерфейс
- Использование цветов бренда:
  - Primary: зеленый (#10B981 / green-500)
  - Secondary: нейтральный серый
  - Status colors: желтый (pending), зеленый (confirmed), красный (cancelled)
- Шрифт: Inter или system font stack
- Spacing: использовать Tailwind spacing scale (4px increments)

### Безопасность
- Валидация всех входных данных на клиенте (Zod schemas)
- Обработка всех ошибок API с пользовательскими сообщениями
- Защита от XSS (React автоматически экранирует)
- Sanitize пользовательского ввода для comments/notes
- CORS настроен на бэкенде

### Производительность
- Code splitting: lazy loading страниц через React.lazy()
- Debounce для фильтров поиска (300ms)
- Мемоизация дорогих вычислений (useMemo для total_amount)
- Виртуализация длинных списков (если > 100 items) - react-window
- Оптимистичные UI обновления при создании/редактировании заказов

### Обработка ошибок
- **Network errors**: "Не удалось подключиться к серверу. Проверьте соединение."
- **400 Bad Request**: показать конкретное сообщение из response.error
- **404 Not Found**: "Заказ не найден"
- **500 Server Error**: "Ошибка сервера. Попробуйте позже."
- Все ошибки логируются в console для отладки
- Показывать retry кнопку при ошибках загрузки данных

## Этапы разработки

### Phase 1: Настройка (1-2 дня)
1. Создать Vite + React + TypeScript проект
2. Настроить Tailwind CSS
3. Настроить React Router
4. Создать базовую структуру папок
5. Настроить Axios instance с baseURL к бэкенду
6. Создать базовые типы (Flower, Order, OrderItem)

### Phase 2: Список цветов (2-3 дня)
1. Создать FlowersPage с таблицей
2. Реализовать useFlowers hook для fetch данных
3. Добавить фильтрацию и сортировку
4. Добавить состояния Loading/Empty/Error
5. Протестировать с реальным API

### Phase 3: Создание заказа (3-4 дня)
1. Создать CreateOrderPage с формой
2. Реализовать добавление items (модал выбора цветка)
3. Автоматический расчет total_stems
4. Валидация формы (Zod + React Hook Form)
5. Отправка POST запроса и редирект
6. Обработка ошибок и success уведомления

### Phase 4: Список и детали заказов (2-3 дня)
1. Создать OrdersListPage с таблицей и пагинацией
2. Реализовать фильтр по статусу
3. Создать OrderDetailsPage
4. Реализовать отображение Total Amount
5. Добавить возможность обновления статуса

### Phase 5: Редактирование цен (1-2 дня)
1. Создать PriceEditModal
2. Реализовать PATCH запрос для обновления цен
3. Обновление UI после сохранения
4. Валидация цен (должны быть >= 0)

### Phase 6: Полировка и тестирование (2-3 дня)
1. Проверить все user flows
2. Протестировать на мобильных устройствах
3. Добавить loading states везде где нужно
4. Оптимизировать производительность
5. Проверить обработку всех ошибок
6. Code review и рефакторинг

### Phase 7: Деплой на GCP Cloud Run (2-3 дня)
1. Создать Dockerfile с multi-stage build
2. Создать nginx.conf для serving React app
3. Настроить cloudbuild.yaml для CI/CD
4. Настроить environment variables (VITE_API_BASE_URL)
5. Деплой на Cloud Run:
   - Build Docker image
   - Push to Container Registry
   - Deploy с правильными настройками (memory, cpu, scaling)
6. Настроить custom domain (опционально)
7. Проверить работу с production API
8. Настроить мониторинг и алерты
9. Проверить логи и метрики
10. Load testing (базовый)

**Deployment Checklist:**
- [ ] Dockerfile создан и протестирован локально
- [ ] nginx.conf настроен для React Router
- [ ] Environment variables настроены
- [ ] Health check endpoint работает
- [ ] CORS работает корректно с production URLs
- [ ] Логи пишутся в Cloud Logging
- [ ] Метрики отображаются в Cloud Monitoring
- [ ] Custom domain настроен (если требуется)
- [ ] SSL сертификаты работают
- [ ] Проведен smoke test всех endpoints
- [ ] Проверена работа на mobile devices

**Общее время: 14-21 день**

## Критерии приемки

### Функциональность
- ✅ Все 4 страницы работают корректно
- ✅ Можно создать заказ с несколькими items
- ✅ Total stems рассчитывается автоматически
- ✅ Можно обновить цены и статус заказа
- ✅ Total amount отображается корректно
- ✅ Пагинация работает на странице заказов

### Валидация
- ✅ Нельзя создать заказ без customer_id
- ✅ Нельзя создать заказ без items
- ✅ Box count должен быть > 0
- ✅ Цены должны быть >= 0

### UX
- ✅ Все состояния Loading/Empty/Error реализованы
- ✅ Toast уведомления при успехе/ошибке
- ✅ Адаптивный дизайн работает на mobile и desktop
- ✅ Нет UI блокировок при асинхронных операциях

### Качество кода
- ✅ TypeScript без any types
- ✅ Компоненты разбиты логично
- ✅ Переиспользуемые компоненты вынесены в common/
- ✅ API вызовы централизованы в services/
- ✅ Валидация через Zod schemas
- ✅ Читаемый и поддерживаемый код

## Примечания для MVP
- Аутентификация будет добавлена в следующей фазе
- Пока любой может редактировать цены и статусы
- Валюта захардкожена как USD
- mark_box пока только "VVA"
- Поддержка только английского языка (можно добавить русский позже)
- Нет unit тестов в MVP (добавить в следующей итерации)

## Production Deployment Guide

### Prerequisites
```bash
# Установить Google Cloud SDK
brew install google-cloud-sdk  # macOS
# или https://cloud.google.com/sdk/docs/install

# Аутентификация
gcloud auth login
gcloud config set project dolina-flower-order

# Включить необходимые API
gcloud services enable cloudbuild.googleapis.com
gcloud services enable run.googleapis.com
gcloud services enable containerregistry.googleapis.com
```

### Deployment Steps

#### 1. Создать необходимые файлы

**Dockerfile:**
```dockerfile
# Multi-stage build для оптимизации размера
FROM node:18-alpine AS build
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
ARG VITE_API_BASE_URL
ENV VITE_API_BASE_URL=$VITE_API_BASE_URL
RUN npm run build

FROM nginx:alpine
COPY --from=build /app/build /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 8080
CMD ["nginx", "-g", "daemon off;"]
```

**nginx.conf:**
```nginx
server {
    listen 8080;
    root /usr/share/nginx/html;
    index index.html;

    gzip on;
    gzip_types text/plain text/css application/json application/javascript;

    location / {
        try_files $uri $uri/ /index.html;
    }

    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }

    location /health {
        return 200 "healthy\n";
        add_header Content-Type text/plain;
    }
}
```

**cloudbuild.yaml:**
```yaml
steps:
  - name: 'node:18'
    entrypoint: 'npm'
    args: ['install']

  - name: 'node:18'
    entrypoint: 'npm'
    args: ['run', 'build']
    env:
      - 'VITE_API_BASE_URL=https://dolina-flower-order-backend-yakk46t3xa-ew.a.run.app/api/v1'

  - name: 'gcr.io/cloud-builders/docker'
    args: ['build', '-t', 'gcr.io/$PROJECT_ID/dolina-frontend:$SHORT_SHA', '.']

  - name: 'gcr.io/cloud-builders/docker'
    args: ['push', 'gcr.io/$PROJECT_ID/dolina-frontend:$SHORT_SHA']

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

images:
  - 'gcr.io/$PROJECT_ID/dolina-frontend:$SHORT_SHA'
```

**(.gitignore добавить):**
```
.env
.env.local
.env.production
```

**(.dockerignore):**
```
node_modules
npm-debug.log
.git
.gitignore
README.md
.env
.env.local
```

#### 2. Manual Deployment
```bash
# Build и push
docker build -t gcr.io/dolina-flower-order/dolina-frontend:latest \
  --build-arg VITE_API_BASE_URL=https://dolina-flower-order-backend-yakk46t3xa-ew.a.run.app/api/v1 .

docker push gcr.io/dolina-flower-order/dolina-frontend:latest

# Deploy to Cloud Run
gcloud run deploy dolina-frontend \
  --image gcr.io/dolina-flower-order/dolina-frontend:latest \
  --region europe-west1 \
  --platform managed \
  --allow-unauthenticated \
  --memory 512Mi \
  --cpu 1 \
  --min-instances 0 \
  --max-instances 5 \
  --concurrency 80 \
  --timeout 300 \
  --set-env-vars API_BASE_URL=https://dolina-flower-order-backend-yakk46t3xa-ew.a.run.app/api/v1
```

#### 3. CI/CD Setup
```bash
# Настроить Cloud Build trigger
gcloud builds triggers create github \
  --repo-name=dolina-flower-order-frontend \
  --repo-owner=maxviazov \
  --branch-pattern="^main$" \
  --build-config=cloudbuild.yaml \
  --description="Auto-deploy frontend on main branch"
```

#### 4. Custom Domain: orderdolina.viazov.dev (Cloudflare)

**Рекомендуемый подход: Cloudflare Proxy (DDoS + CDN)**

```bash
# Шаг 1: Деплой и получить Cloud Run URL
gcloud run services describe dolina-frontend \
  --region=europe-west1 \
  --format='value(status.url)'
# Output: https://dolina-frontend-HASH-ew.a.run.app

# Шаг 2: В Cloudflare Dashboard (viazov.dev → DNS):
#
# Добавить CNAME запись:
# ┌─────────────────────────────────────────────────┐
# │ Type:   CNAME                                   │
# │ Name:   orderdolina                             │
# │ Target: dolina-frontend-HASH-ew.a.run.app      │
# │ Proxy:  ✅ Proxied (оранжевая тучка)            │
# │ TTL:    Auto                                    │
# └─────────────────────────────────────────────────┘
#
# Шаг 3: Cloudflare SSL/TLS настройки:
# - Перейди в SSL/TLS → Overview
# - Выбери: Full (strict) ✅
# - Включи: Always Use HTTPS
# - Включи: Automatic HTTPS Rewrites
#
# Шаг 4: Cloudflare Speed настройки (опционально):
# - Auto Minify: HTML, CSS, JS
# - Brotli: ON
# - Rocket Loader: OFF (может сломать React)
#
# Шаг 5: Проверка
curl -I https://orderdolina.viazov.dev/health
# Должен вернуть 200 OK + Cloudflare headers (cf-ray, cf-cache-status)
```

**Преимущества Cloudflare Proxy:**
- ✅ DDoS protection (бесплатно)
- ✅ CDN для статики (edge caching)
- ✅ Web Application Firewall (WAF)
- ✅ Analytics + bot detection
- ✅ Automatic SSL certificates
- ✅ HTTP/2 и HTTP/3 support
- ✅ Image optimization (Cloudflare Polish)
- ✅ Geo-based routing
- ✅ Rate limiting (в платных планах)

**Cloudflare Page Rules (опционально, Free plan: 3 rules):**

Rule 1 - Cache static assets:
```
URL: orderdolina.viazov.dev/assets/*
Settings:
  - Cache Level: Cache Everything
  - Edge Cache TTL: 1 month
  - Browser Cache TTL: 1 day
```

Rule 2 - Bypass cache for API calls:
```
URL: orderdolina.viazov.dev/api/*
Settings:
  - Cache Level: Bypass
```

Rule 3 - Security for admin (если будет):
```
URL: orderdolina.viazov.dev/admin/*
Settings:
  - Security Level: High
  - Browser Integrity Check: ON
```

**DNS Propagation Check:**
```bash
# Проверь DNS
dig orderdolina.viazov.dev +short
# Должно показать Cloudflare IPs

# Проверь SSL
curl -vI https://orderdolina.viazov.dev 2>&1 | grep -i "SSL\|subject:"

# Full health check
curl -s https://orderdolina.viazov.dev/health
```

**Monitoring:**
```bash
# Uptime monitoring через Cloudflare Health Checks (Pro plan)
# Или использовать бесплатные:
# - UptimeRobot (https://uptimerobot.com)
# - Pingdom
# - StatusCake
```
```

### Post-Deployment Verification

```bash
# 1. Check service is running
gcloud run services describe dolina-frontend --region europe-west1

# 2. Test health endpoint
curl https://dolina-frontend-xxx.a.run.app/health

# 3. Test API connectivity
curl https://dolina-frontend-xxx.a.run.app

# 4. Check logs
gcloud logging read "resource.type=cloud_run_revision AND resource.labels.service_name=dolina-frontend" \
  --limit=50 \
  --format=json

# 5. Monitor metrics
gcloud monitoring dashboards list
```

### Rollback Strategy

```bash
# List all revisions
gcloud run revisions list --service=dolina-frontend --region=europe-west1

# Rollback to previous revision
gcloud run services update-traffic dolina-frontend \
  --region=europe-west1 \
  --to-revisions=dolina-frontend-00005-abc=100

# Gradual rollout (канареечный деплой)
gcloud run services update-traffic dolina-frontend \
  --region=europe-west1 \
  --to-revisions=dolina-frontend-00006-xyz=10,dolina-frontend-00005-abc=90
```

### Monitoring & Alerting

```bash
# Create uptime check
gcloud monitoring uptime create \
  --display-name="Frontend Health Check" \
  --host=dolina-frontend-xxx.a.run.app \
  --path=/health \
  --check-interval=60s

# Create alert policy for high latency
gcloud alpha monitoring policies create \
  --notification-channels=YOUR_CHANNEL_ID \
  --display-name="Frontend High Latency" \
  --condition-display-name="Latency > 2s" \
  --condition-threshold-value=2000 \
  --condition-threshold-duration=60s
```

## Security Best Practices

### Environment Variables
- **НИКОГДА** не коммить `.env` файлы в git
- Использовать Cloud Run environment variables для production secrets
- Разделять dev/staging/production configs

### Content Security Policy
Добавить в `index.html`:
```html
<meta http-equiv="Content-Security-Policy"
      content="default-src 'self';
               script-src 'self' 'unsafe-inline';
               style-src 'self' 'unsafe-inline';
               connect-src 'self' https://dolina-flower-order-backend-yakk46t3xa-ew.a.run.app;">
```

### HTTPS Only
Cloud Run автоматически обеспечивает HTTPS, но убедись что:
```javascript
// В production всегда используй HTTPS
if (window.location.protocol !== 'https:' && process.env.NODE_ENV === 'production') {
  window.location.href = 'https:' + window.location.href.substring(window.location.protocol.length);
}
```

## Performance Optimization

### Lighthouse Score Target
- Performance: > 90
- Accessibility: > 95
- Best Practices: > 95
- SEO: > 90

### Optimization Checklist
- [ ] Code splitting (React.lazy)
- [ ] Image optimization (WebP, lazy loading)
- [ ] Bundle size < 500KB (gzipped)
- [ ] First Contentful Paint < 1.5s
- [ ] Time to Interactive < 3s
- [ ] Caching strategy implemented
- [ ] CDN для статических ассетов (опционально)

## Cost Optimization

### Current Setup (Estimated)
```
Cloud Run (Frontend):
- 100K requests/month
- 512Mi RAM, 1 vCPU
- Avg response time: 200ms
Estimated cost: $5-10/month

Cloud Build:
- 10 builds/day
- Free tier: 120 minutes/day
Estimated cost: $0/month
```

### Cost Reduction Tips
1. Reduce min-instances to 0 для dev/staging
2. Use Cloud CDN для статики (если > 1M requests/month)
3. Optimize Docker image size (use alpine images)
4. Enable request timeout (default: 300s → 60s)
5. Monitor и удаляй старые container images

## Troubleshooting

### Common Issues

**1. Build fails with "npm install" error:**
```bash
# Clear npm cache
npm cache clean --force
rm -rf node_modules package-lock.json
npm install
```

**2. Container crashes immediately:**
```bash
# Check logs
gcloud logging read "resource.type=cloud_run_revision" --limit=100

# Test locally
docker run -p 8080:8080 gcr.io/dolina-flower-order/dolina-frontend:latest
```

**3. CORS errors in production:**
- Проверь что backend CORS настроен на production URL фронтенда
- Убедись что используется правильный API_BASE_URL

**4. High latency:**
```bash
# Increase CPU
gcloud run services update dolina-frontend --cpu=2 --region=europe-west1

# Increase concurrency
gcloud run services update dolina-frontend --concurrency=100 --region=europe-west1
```

## Next Steps After MVP

### Phase 2 Features
1. **Authentication & Authorization**
   - Firebase Auth или Google Identity Platform
   - Role-based access control (client vs specialist)
   - Protected routes

2. **Advanced Features**
   - Real-time updates (WebSockets или Server-Sent Events)
   - Email notifications (SendGrid integration)
   - PDF generation для заказов
   - Analytics dashboard

3. **Internationalization**
   - i18next для мультиязычности
   - Поддержка английского и русского

4. **Testing**
   - Unit tests (Jest + React Testing Library)
   - E2E tests (Playwright или Cypress)
   - Integration tests для API calls

5. **CI/CD Improvements**
   - Automated testing в pipeline
   - Staging environment
   - Blue-green deployments
   - Automated rollbacks

### Maintenance

**Weekly:**
- Проверять логи на ошибки
- Мониторить метрики производительности
- Проверять cost reports

**Monthly:**
- Security updates (npm audit fix)
- Dependency updates
- Performance review
- Cost optimization review

**Quarterly:**
- Major dependency updates
- Architecture review
- Security audit
- User feedback review

---

## Contact & Support

**Frontend Repository:** https://github.com/maxviazov/dolina-flower-order-frontend
**Backend Repository:** https://github.com/maxviazov/dolina-flower-order-backend
**GCP Project:** dolina-flower-order
**Production Frontend URL:** https://orderdolina.viazov.dev
**Production Backend URL:** https://dolina-flower-order-backend-yakk46t3xa-ew.a.run.app
**Domain Provider:** Cloudflare (viazov.dev)

Для вопросов и support открывай issues в соответствующем репозитории.

---

## Quick Start Commands Summary

```bash
# 1. Локальная разработка
npm install
npm run dev
# Open http://localhost:5173

# 2. Production build тест
npm run build
npm run preview

# 3. Docker локально
docker build -t dolina-frontend --build-arg VITE_API_BASE_URL=https://dolina-flower-order-backend-yakk46t3xa-ew.a.run.app/api/v1 .
docker run -p 8080:8080 dolina-frontend

# 4. Деплой на GCP
gcloud builds submit --config=cloudbuild.yaml

# 5. Настройка домена в Cloudflare
# DNS → Add record:
# Type: CNAME
# Name: orderdolina
# Target: [your-cloud-run-url].a.run.app
# Proxy: ON (оранжевая тучка)

# 6. Проверка
curl https://orderdolina.viazov.dev/health
```</content>
<parameter name="filePath">/Users/maximviazov/Developer/Golang/GoLandWorkspace/dolina-flower-order-backend/FRONTEND_TECH_SPEC.md
