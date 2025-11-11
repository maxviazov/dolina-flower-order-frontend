# Code Review & Recommendations - Dolina Flower Order Frontend

## ✅ Что сделано хорошо

### Architecture & Structure
- ✅ Чистая структура проекта с разделением на components, pages, services, store
- ✅ Использование TypeScript для type safety
- ✅ Zustand для state management - хороший выбор для такого размера проекта
- ✅ Централизованный API layer в `services/api.ts`
- ✅ Разделение concerns: UI components отдельно от бизнес-логики

### Code Quality
- ✅ Хорошая типизация в `types/index.ts`
- ✅ Чистые и понятные названия переменных и функций
- ✅ Логика фильтрации и сортировки вынесена в store
- ✅ Использование React Router для навигации

### TypeScript Types
- ✅ Правильно определены интерфейсы `Flower`, `Order`, `OrderItem`
- ✅ Union type для `OrderStatus`
- ✅ Правильные optional properties (`?`)

## 🔴 Критические проблемы (нужно исправить)

### 1. API Configuration
**Файл:** `src/services/api.ts:4`

```typescript
// ❌ ПРОБЛЕМА: Hardcoded localhost URL
const API_BASE_URL = 'http://localhost:8080/api/v1';
```

**Решение:**
```typescript
// ✅ ПРАВИЛЬНО: Использовать environment variables
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080/api/v1';
```

**Почему важно:**
- В production нужен другой URL (GCP Cloud Run)
- Сейчас приложение не будет работать после деплоя
- Нарушается принцип 12-factor app

**Action items:**
1. Создать `.env` файл:
```env
VITE_API_BASE_URL=http://localhost:8080/api/v1
```

2. Создать `.env.production`:
```env
VITE_API_BASE_URL=https://dolina-flower-order-backend-yakk46t3xa-ew.a.run.app/api/v1
```

3. Обновить `api.ts`

### 2. Error Handling
**Файл:** `src/store/useFlowersStore.ts:43-44`

```typescript
// ❌ ПРОБЛЕМА: Generic error message, нет логирования
catch (error) {
  set({ error: 'Ошибка загрузки цветов', loading: false });
}
```

**Решение:**
```typescript
// ✅ ПРАВИЛЬНО
catch (error) {
  console.error('Failed to fetch flowers:', error);
  const errorMessage = error instanceof Error
    ? error.message
    : 'Ошибка загрузки цветов';
  set({ error: errorMessage, loading: false });
}
```

**Аналогично в:** `src/store/useOrderStore.ts:80-83,91-93`

### 3. Missing Authentication
**Файл:** `src/services/api.ts`

```typescript
// ❌ ПРОБЛЕМА: Нет authentication для production API
const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 5000,
});
```

**Решение:**
```typescript
// ✅ ПРАВИЛЬНО: Add interceptor для токенов
api.interceptors.request.use(async (config) => {
  // В production нужен Bearer token
  if (import.meta.env.PROD) {
    const token = localStorage.getItem('gcp_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  }
  return config;
});

// Response interceptor для обработки 401
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Redirect to login or show auth modal
      console.error('Unauthorized - need to authenticate');
    }
    return Promise.reject(error);
  }
);
```

### 4. Package.json Issues
**Файл:** `package.json`

```json
// ❌ ПРОБЛЕМА: Используется react-scripts, но должен быть Vite
"scripts": {
  "start": "react-scripts start",
  "build": "react-scripts build"
}
```

**Решение:**
```json
// ✅ ПРАВИЛЬНО: Vite scripts (согласно документации)
{
  "name": "dolina-flower-order-frontend",
  "version": "1.0.0",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "tsc && vite build",
    "preview": "vite preview",
    "lint": "eslint . --ext ts,tsx --report-unused-disable-directives --max-warnings 0"
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
    "@typescript-eslint/eslint-plugin": "^6.14.0",
    "@typescript-eslint/parser": "^6.14.0",
    "@vitejs/plugin-react": "^4.2.1",
    "autoprefixer": "^10.4.16",
    "eslint": "^8.55.0",
    "eslint-plugin-react-hooks": "^4.6.0",
    "eslint-plugin-react-refresh": "^0.4.5",
    "postcss": "^8.4.32",
    "tailwindcss": "^3.4.0",
    "typescript": "^5.3.3",
    "vite": "^5.0.8"
  }
}
```

## 🟡 Важные улучшения

### 5. Missing Validation
**Файлы:** Все store файлы

**Проблема:** Нет Zod validation schemas

**Решение:** Создать `src/utils/validation.ts`:
```typescript
import { z } from 'zod';

export const orderItemSchema = z.object({
  variety: z.string().min(1, 'Variety обязателен'),
  length: z.number().min(1, 'Length должен быть > 0'),
  box_count: z.number().min(0.01, 'Box count должен быть > 0'),
  pack_rate: z.number().min(1, 'Pack rate должен быть >= 1'),
  total_stems: z.number().min(1, 'Total stems должен быть >= 1'),
  farm_name: z.string().min(1, 'Farm name обязателен'),
  truck_name: z.string().min(1, 'Truck name обязателен'),
  comments: z.string().optional(),
  price: z.number().min(0).optional(),
});

export const createOrderSchema = z.object({
  mark_box: z.string().min(1, 'Mark box обязателен'),
  customer_id: z.string().min(1, 'Customer ID обязателен'),
  items: z.array(orderItemSchema).min(1, 'Добавьте хотя бы один товар'),
  notes: z.string().optional(),
});

export type CreateOrderFormData = z.infer<typeof createOrderSchema>;
```

Использовать с React Hook Form:
```typescript
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { createOrderSchema, CreateOrderFormData } from '../utils/validation';

const { register, handleSubmit, formState: { errors } } = useForm<CreateOrderFormData>({
  resolver: zodResolver(createOrderSchema),
});
```

### 6. Missing Loading States
**Файл:** `src/store/useOrderStore.ts:77-79`

```typescript
// ❌ ПРОБЛЕМА: Возвращается order.id как string, но в типах id: string
const order = await ordersApi.createOrder(orderData);
set({ currentOrder: order, loading: false });
return order.id;
```

**Проблема:** Если API вернет числовой id, TypeScript не поймает ошибку

**Решение:**
```typescript
const order = await ordersApi.createOrder(orderData);
set({ currentOrder: order, loading: false });
return String(order.id); // Явное преобразование
```

### 7. Console Errors Not Logged
Добавить proper error logging:

```typescript
// src/utils/logger.ts
export const logger = {
  error: (message: string, error: unknown) => {
    console.error(`[ERROR] ${message}:`, error);
    // В production можно отправлять в Sentry/LogRocket
    if (import.meta.env.PROD) {
      // Send to error tracking service
    }
  },
  warn: (message: string) => {
    console.warn(`[WARN] ${message}`);
  },
  info: (message: string) => {
    console.info(`[INFO] ${message}`);
  },
};
```

Использовать:
```typescript
import { logger } from '../utils/logger';

try {
  const flowers = await flowersApi.getFlowers();
  set({ flowers, loading: false });
} catch (error) {
  logger.error('Failed to fetch flowers', error);
  set({ error: 'Ошибка загрузки цветов', loading: false });
}
```

### 8. Missing Environment Variables Config

Создать `src/config/env.ts`:
```typescript
interface EnvConfig {
  apiBaseUrl: string;
  isDevelopment: boolean;
  isProduction: boolean;
  apiTimeout: number;
}

const getEnvVar = (key: string, defaultValue?: string): string => {
  const value = import.meta.env[key];
  if (!value && !defaultValue) {
    throw new Error(`Missing environment variable: ${key}`);
  }
  return value || defaultValue!;
};

export const env: EnvConfig = {
  apiBaseUrl: getEnvVar('VITE_API_BASE_URL', 'http://localhost:8080/api/v1'),
  isDevelopment: import.meta.env.DEV,
  isProduction: import.meta.env.PROD,
  apiTimeout: 10000,
};
```

Использовать:
```typescript
import { env } from '../config/env';

const api = axios.create({
  baseURL: env.apiBaseUrl,
  timeout: env.apiTimeout,
});
```

### 9. Missing Toast Notifications

**В package.json добавлен `sonner`, но не используется!**

Создать wrapper:
```typescript
// src/utils/toast.ts
import { toast as sonnerToast } from 'sonner';

export const toast = {
  success: (message: string) => {
    sonnerToast.success(message, {
      duration: 3000,
      position: 'top-right',
    });
  },
  error: (message: string) => {
    sonnerToast.error(message, {
      duration: 5000,
      position: 'top-right',
    });
  },
  loading: (message: string) => {
    return sonnerToast.loading(message);
  },
};
```

В `App.tsx`:
```typescript
import { Toaster } from 'sonner';

function App() {
  return (
    <Router>
      <div className="min-h-screen bg-gray-50">
        <Toaster richColors />
        <Routes>
          {/* routes */}
        </Routes>
      </div>
    </Router>
  );
}
```

Использовать в stores:
```typescript
import { toast } from '../utils/toast';

createOrder: async () => {
  // ...
  try {
    const order = await ordersApi.createOrder(orderData);
    toast.success('Заказ успешно создан!');
    return String(order.id);
  } catch (error) {
    toast.error('Не удалось создать заказ');
    return null;
  }
}
```

### 10. API Response Type Mismatch
**Файл:** `src/services/api.ts:19-22`

```typescript
// ⚠️ ПРОБЛЕМА: Backend может вернуть другую структуру
createOrder: async (orderData: CreateOrderRequest): Promise<Order> => {
  const response = await api.post<Order>('/orders', orderData);
  return response.data;
},
```

**Решение:** Add runtime validation:
```typescript
import { z } from 'zod';

const orderResponseSchema = z.object({
  id: z.union([z.string(), z.number()]),
  mark_box: z.string(),
  customer_id: z.string(),
  status: z.enum(['pending', 'processing', 'farm_order', 'completed', 'cancelled']),
  created_at: z.string(),
  items: z.array(z.any()),
  notes: z.string().optional(),
  total_amount: z.number(),
});

createOrder: async (orderData: CreateOrderRequest): Promise<Order> => {
  const response = await api.post('/orders', orderData);
  const validated = orderResponseSchema.parse(response.data);
  return {
    ...validated,
    id: String(validated.id), // Ensure string
  } as Order;
},
```

## 🟢 Рекомендации для улучшения

### 11. Add Error Boundary

```typescript
// src/components/ErrorBoundary.tsx
import React, { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('ErrorBoundary caught:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-red-600 mb-4">
              Что-то пошло не так
            </h1>
            <p className="text-gray-600 mb-4">
              {this.state.error?.message}
            </p>
            <button
              onClick={() => window.location.reload()}
              className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
            >
              Перезагрузить страницу
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
```

В `App.tsx`:
```typescript
<ErrorBoundary>
  <Router>
    {/* ... */}
  </Router>
</ErrorBoundary>
```

### 12. Add Loading Spinner Component

```typescript
// src/components/Spinner.tsx
export const Spinner = ({ size = 'md' }: { size?: 'sm' | 'md' | 'lg' }) => {
  const sizeClasses = {
    sm: 'h-4 w-4',
    md: 'h-8 w-8',
    lg: 'h-12 w-12',
  };

  return (
    <div className="flex items-center justify-center">
      <div
        className={`${sizeClasses[size]} animate-spin rounded-full border-2 border-gray-300 border-t-green-500`}
      />
    </div>
  );
};
```

### 13. Add Constants File

```typescript
// src/constants/index.ts
export const API_TIMEOUT = 10000;
export const DEBOUNCE_DELAY = 300;

export const MARK_BOX_OPTIONS = ['VVA'] as const;

export const ORDER_STATUS = {
  PENDING: 'pending',
  PROCESSING: 'processing',
  FARM_ORDER: 'farm_order',
  COMPLETED: 'completed',
  CANCELLED: 'cancelled',
} as const;

export const ORDER_STATUS_LABELS: Record<string, string> = {
  pending: 'В ожидании',
  processing: 'В обработке',
  farm_order: 'Заказ на ферме',
  completed: 'Завершен',
  cancelled: 'Отменен',
};

export const ORDER_STATUS_COLORS: Record<string, string> = {
  pending: 'bg-yellow-100 text-yellow-800',
  processing: 'bg-blue-100 text-blue-800',
  farm_order: 'bg-purple-100 text-purple-800',
  completed: 'bg-green-100 text-green-800',
  cancelled: 'bg-red-100 text-red-800',
};
```

### 14. Add Debounce Hook for Search

```typescript
// src/hooks/useDebounce.ts
import { useEffect, useState } from 'react';

export function useDebounce<T>(value: T, delay: number = 300): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}
```

Использовать:
```typescript
const searchTerm = useFlowersStore((state) => state.searchTerm);
const debouncedSearchTerm = useDebounce(searchTerm, 300);

useEffect(() => {
  // Fetch только после debounce
  fetchFlowers(debouncedSearchTerm);
}, [debouncedSearchTerm]);
```

### 15. Add React Query (опционально, но рекомендуется)

React Query упростит работу с API и кешированием:

```bash
npm install @tanstack/react-query
```

```typescript
// src/hooks/useFlowers.ts
import { useQuery } from '@tanstack/react-query';
import { flowersApi } from '../services/api';

export const useFlowers = () => {
  return useQuery({
    queryKey: ['flowers'],
    queryFn: () => flowersApi.getFlowers(),
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: 3,
  });
};
```

Использование:
```typescript
const { data: flowers, isLoading, error, refetch } = useFlowers();
```

## 📋 Checklist перед деплоем

### Must Have (Критично)
- [ ] Fix API_BASE_URL to use environment variables
- [ ] Add authentication interceptor for production API
- [ ] Fix package.json to use Vite instead of react-scripts
- [ ] Add proper error handling and logging
- [ ] Create .env and .env.production files
- [ ] Add Zod validation schemas
- [ ] Fix TypeScript any types (если есть)
- [ ] Add toast notifications using Sonner
- [ ] Create Dockerfile
- [ ] Create nginx.conf
- [ ] Create cloudbuild.yaml
- [ ] Test locally with Docker

### Should Have (Важно)
- [ ] Add Error Boundary
- [ ] Add loading states for all async operations
- [ ] Add debounce for search inputs
- [ ] Create constants file
- [ ] Add logger utility
- [ ] Add env config
- [ ] Add runtime API response validation
- [ ] Create reusable Spinner component
- [ ] Add proper TypeScript types (no 'any')
- [ ] Add ESLint configuration
- [ ] Add Prettier configuration

### Nice to Have (Желательно)
- [ ] Add React Query for API caching
- [ ] Add unit tests (Jest + React Testing Library)
- [ ] Add E2E tests (Playwright)
- [ ] Add Storybook for component documentation
- [ ] Add bundle size analysis
- [ ] Add performance monitoring
- [ ] Add Lighthouse CI
- [ ] Add pre-commit hooks (Husky + lint-staged)

## 🎯 Priority Action Items

### High Priority (Сделать сегодня)
1. **Fix API configuration** - без этого не будет работать в production
2. **Fix package.json** - проект не соберется правильно
3. **Add environment variables** - нужно для разных окружений
4. **Add authentication** - backend требует auth в production

### Medium Priority (Сделать на этой неделе)
5. **Add validation** - критично для quality
6. **Add proper error handling** - улучшит UX
7. **Add toast notifications** - feedback для пользователя
8. **Create deployment files** - нужно для GCP

### Low Priority (После MVP)
9. **Add tests** - для поддерживаемости
10. **Add React Query** - улучшит performance
11. **Add monitoring** - для production insights

## 📝 Summary

### Оценка текущего кода: 7/10

**Плюсы:**
- Хорошая базовая архитектура
- Правильное использование TypeScript
- Чистый код
- Zustand хорошо подходит для этого проекта

**Минусы:**
- Нет proper configuration management
- Отсутствует authentication
- Слабая обработка ошибок
- package.json не соответствует документации (Vite)

**Время на исправление критических проблем:** 4-6 часов

**Готовность к production:** 60% (после исправления критических проблем: 90%)

---

**Next Steps:**
1. Исправить критические проблемы (раздел 🔴)
2. Создать deployment files
3. Протестировать локально
4. Деплой на GCP
5. Мониторинг и оптимизация
