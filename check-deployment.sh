#!/bin/bash

echo "🚀 Проверка деплоя Dolina Flower Order Frontend"
echo "=============================================="
echo ""

echo "📍 Cloud Run URL:"
gcloud run services describe dolina-frontend-public --region=europe-west1 --format='value(status.url)' 2>/dev/null || echo "Сервис не найден"
echo ""

echo "🔍 Проверка доступности:"
URL=$(gcloud run services describe dolina-frontend-public --region=europe-west1 --format='value(status.url)' 2>/dev/null)
if [ ! -z "$URL" ]; then
    echo "Health check: $URL/health"
    curl -s -o /dev/null -w "Status: %{http_code}\n" "$URL/health"
    echo ""
    echo "Main page: $URL/"
    curl -s -o /dev/null -w "Status: %{http_code}\n" "$URL/"
else
    echo "❌ Сервис недоступен"
fi

echo ""
echo "🌐 Настройка Cloudflare:"
echo "Domain: https://orderdolina.viazov.dev"
echo "CNAME: dolina-frontend-public-yakk46t3xa-ew.a.run.app"
echo ""
echo "✅ Готово к презентации!"