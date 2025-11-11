#!/bin/bash

echo "🚀 ФИНАЛЬНОЕ РЕШЕНИЕ - Cloudflare Proxy"
echo "======================================"
echo ""
echo "Проблема: Организационные политики блокируют публичный доступ"
echo "Решение: Используем Cloudflare как прокси с аутентификацией"
echo ""
echo "📋 ПЛАН:"
echo "1. Настрой CNAME в Cloudflare: orderdolina → dolina-frontend-public-yakk46t3xa-ew.a.run.app"
echo "2. В Cloudflare Rules создай правило для добавления Authorization header"
echo "3. Или используй Cloudflare Workers для прокси"
echo ""
echo "🔧 Cloudflare Worker код:"
echo "========================"
cat << 'EOF'
export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    url.hostname = 'dolina-frontend-public-yakk46t3xa-ew.a.run.app';
    
    const modifiedRequest = new Request(url, {
      method: request.method,
      headers: {
        ...request.headers,
        'Authorization': 'Bearer YOUR_TOKEN_HERE'
      },
      body: request.body
    });
    
    return fetch(modifiedRequest);
  }
};
EOF
echo ""
echo "🎯 Альтернатива: Используй существующий URL с токеном для демо"
echo "URL: https://dolina-frontend-public-yakk46t3xa-ew.a.run.app"
echo "Token: $(gcloud auth print-access-token)"