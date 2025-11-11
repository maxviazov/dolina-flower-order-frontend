# Dolina Flower Order Frontend

Веб-приложение для системы заказа цветов компании Dolina.

🌍 **Production**: https://order.dolinaflo.com  
🔗 **Backend API**: https://dolina-flower-order-backend-373154353561.europe-west1.run.app/api/v1

## Технологии

- React 18 + TypeScript
- React Router для навигации
- Tailwind CSS для стилизации
- Zustand для управления состоянием
- React Hook Form для форм
- Axios для API запросов

## Функциональность

- 📋 Каталог цветов с фильтрацией и поиском
- 🛒 Создание заказов с валидацией
- 📊 Просмотр деталей заказа
- 📱 Адаптивный дизайн

## Быстрый старт

### Локальная разработка

```bash
# Установка зависимостей
npm install

# Запуск в режиме разработки
npm start
# Или
make dev
```

Приложение запустится на http://localhost:3000

### Production деплой

```bash
# Деплой в Google Cloud Storage
make deploy-gcs

# Или используй скрипт
./deploy-to-gcs.sh
```

## Инфраструктура

### Хостинг (CNAME решение)

- **Google Cloud Storage**: Static site hosting (gs://order.dolinaflo.com)
- **Cloudflare**: CDN, SSL, DNS (CNAME → c.storage.googleapis.com)
- **Домен**: order.dolinaflo.com

> **Текущее решение**: CNAME с Cloudflare Proxy (🟠 оранжевое облако) - работает отлично!
>
> **Альтернатива**: Load Balancer с A записью (дороже $18/мес, но больше контроля)
> управляет SSL и CDN.

### API Backend

- **Cloud Run**: https://dolina-flower-order-backend-373154353561.europe-west1.run.app
- **Регион**: europe-west1

### Endpoints

- `GET /api/v1/flowers` - получение списка цветов
- `POST /api/v1/orders` - создание заказа
- `GET /api/v1/orders/{id}` - получение заказа по ID

## Структура проекта

```
src/
├── components/           # Переиспользуемые компоненты
│   ├── FlowerCard.tsx   # Карточка цветка
│   └── FlowerFilters.tsx # Фильтры каталога
├── pages/               # Страницы приложения
│   ├── FlowersPage.tsx  # Каталог цветов
│   ├── CreateOrderPage.tsx # Создание заказа
│   └── OrderPage.tsx    # Детали заказа
├── services/            # API сервисы
│   └── api.ts          # Axios клиент и API методы
├── store/              # Zustand stores
│   ├── useFlowersStore.ts # Стейт каталога
│   └── useOrderStore.ts   # Стейт заказа
└── types/              # TypeScript типы
    └── index.ts        # Общие типы
```

## Документация

- [📦 DEPLOYMENT_COMPLETE.md](./DEPLOYMENT_COMPLETE.md) - Быстрый гайд по деплою (НАЧНИ ОТСЮДА!)
- [☁️ GCS_DEPLOYMENT.md](./GCS_DEPLOYMENT.md) - Подробная документация деплоя в GCS
- [🔧 CLOUDFLARE_SETUP.md](./CLOUDFLARE_SETUP.md) - Настройка Cloudflare DNS и Worker
- [📝 FRONTEND_TECH_SPEC.md](./FRONTEND_TECH_SPEC.md) - Техническая спецификация
- [👨‍💻 FRONTEND_DEV_GUIDE.md](./FRONTEND_DEV_GUIDE.md) - Руководство разработчика

## Команды Make

```bash
# Локальная разработка
make dev

# Сборка приложения
make build

# Настройка GCS bucket (один раз)
make setup-bucket

# Деплой в production
make deploy-gcs

# Просмотр содержимого bucket
make bucket-ls

# Информация о bucket
make bucket-info

# Очистка
make clean
```

## Переменные окружения

Создай файл `.env` для локальной разработки:

```bash
REACT_APP_API_BASE_URL=https://dolina-flower-order-backend-373154353561.europe-west1.run.app/api/v1
```

Для production используется `.env.production` (уже настроен).

## Troubleshooting

### Проблема: 404 на роутах React

**Решение**: Убедись что Cloudflare Worker настроен правильно.  
См. [CLOUDFLARE_SETUP.md](./CLOUDFLARE_SETUP.md) → "Настройка Cloudflare Worker"

### Проблема: CORS ошибки

**Решение**: Проверь что backend возвращает правильные CORS headers для домена `order.dolinaflo.com`

### Проблема: Старая версия кэшируется

**Решение**: Очисти кэш Cloudflare:

```bash
# В Cloudflare Dashboard:
# Caching → Configuration → Purge Everything
```

## Мониторинг

- **Cloudflare Analytics**: https://dash.cloudflare.com/ → Analytics
- **GCS Metrics**: https://console.cloud.google.com/storage/browser/order.dolinaflo.com
- **Backend Logs**: Cloud Run logs в GCP Console

## Стоимость

### С CNAME (текущее решение):

- Google Cloud Storage: ~$1-2/месяц
- Cloudflare CDN: $0 (Free plan)
- Backend Cloud Run: ~$5-10/месяц

**Итого**: ~$6-12/месяц ⭐

### С Load Balancer (альтернатива):

- Google Cloud Storage: ~$1-2/месяц
- Cloud CDN: ~$1-3/месяц
- Load Balancer: ~$18/месяц (фиксированная стоимость)
- Backend Cloud Run: ~$5-10/месяц

**Итого**: ~$25-33/месяц

## Поддержка

Если возникли проблемы, проверь:

1. [DEPLOYMENT_COMPLETE.md](./DEPLOYMENT_COMPLETE.md) - частые проблемы и решения
2. Cloudflare Dashboard - проверь DNS и Worker
3. GCS bucket - убедись что файлы загружены
4. Backend health - проверь что API отвечает

## Лицензия

Proprietary - Dolina Flower Company
