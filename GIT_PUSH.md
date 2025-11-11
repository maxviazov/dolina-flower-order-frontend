# 🚀 Git Push Instructions

## Git репозиторий готов!

Все файлы закоммичены в локальный git репозиторий.

---

## Чтобы запушить на GitHub:

### Вариант 1: Создать новый репозиторий на GitHub

1. **Зайди на GitHub**: https://github.com/new
2. **Repository name**: `dolina-flower-order-frontend`
3. **Description**: `React frontend for Dolina Flower Order system`
4. **Public** или **Private** (на твой выбор)
5. **НЕ добавляй** README, .gitignore, license (уже есть локально)
6. **Create repository**

### Вариант 2: Использовать существующий репозиторий

Если у тебя уже есть репозиторий на GitHub.

---

## После создания репозитория на GitHub:

GitHub покажет команды. Используй эти:

```bash
cd /Users/maximviazov/Developer/Golang/GoLandWorkspace/dolina-flower-order-frontend

# Добавь remote (замени YOUR_USERNAME на свой username)
git remote add origin https://github.com/YOUR_USERNAME/dolina-flower-order-frontend.git

# Или если используешь SSH:
git remote add origin git@github.com:YOUR_USERNAME/dolina-flower-order-frontend.git

# Запуш в main ветку
git push -u origin main
```

---

## Быстрая команда (после добавления remote):

```bash
git push -u origin main
```

---

## Если нужно изменить remote URL:

```bash
# Посмотреть текущий remote
git remote -v

# Изменить remote URL
git remote set-url origin https://github.com/YOUR_USERNAME/dolina-flower-order-frontend.git

# Запушить
git push -u origin main
```

---

## Что закоммичено:

✅ **Source Code**:

- `src/` - React компоненты, страницы, сервисы
- `public/` - публичные файлы
- `package.json` - зависимости

✅ **Deployment Scripts**:

- `deploy-to-gcs.sh` - полный деплой
- `upload-to-gcs.sh` - быстрая загрузка
- `setup-load-balancer.sh` - настройка LB
- `check-lb-status.sh` - проверка статуса
- `cleanup-load-balancer.sh` - очистка LB
- `Makefile` - команды для работы

✅ **Configuration**:

- `.env.production` - production переменные
- `nginx.conf` - nginx конфигурация
- `Dockerfile` - Docker образ
- `tailwind.config.js` - Tailwind настройки
- `tsconfig.json` - TypeScript настройки

✅ **Documentation**:

- `README.md` - основная документация
- `FIX.md` - быстрое решение проблем
- `CNAME_SOLUTION.md` - CNAME настройка
- `LOAD_BALANCER_SETUP.md` - Load Balancer гайд
- `GCS_DEPLOYMENT.md` - GCS деплой
- `CLOUDFLARE_SETUP.md` - Cloudflare настройка
- `DEPLOYMENT_COMPLETE.md` - полный деплой гайд
- `QUICK_START.md` - быстрый старт
- `FRONTEND_TECH_SPEC.md` - техническая спецификация
- `FRONTEND_DEV_GUIDE.md` - гайд разработчика
- `cloudflare-worker.js` - Worker для SPA routing

✅ **Excluded** (.gitignore):

- `node_modules/` - зависимости (переустанавливаются)
- `build/` - собранные файлы (пересобираются)
- `.env` - локальные переменные (секретные)
- `.DS_Store` - системные файлы

---

## После пуша на GitHub:

### Включи GitHub Actions (опционально)

Можно настроить автоматический деплой при push:

Создай `.github/workflows/deploy.yml`:

```yaml
name: Deploy to GCS

on:
  push:
    branches: [ main ]

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

---

## Полезные git команды:

```bash
# Посмотреть статус
git status

# Посмотреть историю
git log --oneline

# Создать новую ветку
git checkout -b feature/new-feature

# Вернуться в main
git checkout main

# Обновить с remote
git pull origin main

# Запушить изменения
git push origin main
```

---

## 🎯 Summary

1. ✅ **Git репозиторий инициализирован**
2. ✅ **Все файлы закоммичены**
3. ✅ **Ветка main создана**
4. 🔴 **Нужно**: Создать репозиторий на GitHub
5. 🔴 **Нужно**: Добавить remote URL
6. 🔴 **Нужно**: Запушить с `git push -u origin main`

---

## Готово! 🎉

После настройки GitHub remote, выполни:

```bash
git push -u origin main
```

И весь код будет на GitHub!

