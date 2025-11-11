#!/bin/bash
echo '🌐 Проверка домена orderdolina.viazov.dev'
echo '======================================='
echo ''
echo '🔍 DNS проверка:'
nslookup orderdolina.viazov.dev
echo ''
echo '🚀 HTTP проверка:'
curl -I https://orderdolina.viazov.dev/health 2>/dev/null || echo 'Домен еще не готов, подожди 1-2 минуты'
echo ''
echo '✅ Если видишь HTTP/2 200 - все готово!'
