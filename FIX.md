# 🎯 БЫСТРОЕ РЕШЕНИЕ

## Проблема

Safari Can't Find the Server - order.dolinaflo.com не открывается

## Причина

CNAME на c.storage.googleapis.com не работает правильно

## Решение

Google Cloud Load Balancer настроен!

---

## ⚡ ЧТО ДЕЛАТЬ СЕЙЧАС

### В Cloudflare Dashboard:

1. https://dash.cloudflare.com/ → **dolinaflo.com** → **DNS**

2. **Удали** запись `order` (если есть CNAME)

3. **Создай** A запись:
   ```
   Type: A
   Name: order
   IPv4: 34.128.141.177
   Proxy: OFF (☁️ серое)
   ```

4. **Save**

### Подожди 15 минут

SSL сертификат создастся автоматически.

---

## ✅ Проверка

```bash
# DNS (через 5 мин)
dig order.dolinaflo.com +short
# → 34.128.141.177

# SSL (через 15 мин)
gcloud compute ssl-certificates describe order-ssl-cert --global
# → status: ACTIVE

# Сайт
curl -I https://order.dolinaflo.com
# → HTTP/2 200
```

---

## 🌍 Готово!

https://order.dolinaflo.com

---

## 📚 Подробнее

- `LOAD_BALANCER_SETUP.md` - детали
- `./check-lb-status.sh` - проверка статуса

