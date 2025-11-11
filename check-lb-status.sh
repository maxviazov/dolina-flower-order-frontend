#!/bin/bash

PROJECT_ID="dolina-flower-order"
gcloud config set project $PROJECT_ID >/dev/null 2>&1

echo "=========================================="
echo "🔍 Load Balancer Status Check"
echo "=========================================="
echo ""

# Static IP
echo "📍 Static IP Address:"
IP=$(gcloud compute addresses describe order-static-ip --global --format="value(address)" 2>/dev/null)
if [ -n "$IP" ]; then
    echo "   ✅ $IP"
else
    echo "   ❌ Not found"
fi
echo ""

# SSL Certificate
echo "🔒 SSL Certificate Status:"
SSL_STATUS=$(gcloud compute ssl-certificates describe order-ssl-cert --global --format="value(managed.status)" 2>/dev/null)
if [ -n "$SSL_STATUS" ]; then
    if [ "$SSL_STATUS" = "ACTIVE" ]; then
        echo "   ✅ ACTIVE - Certificate is ready!"
    elif [ "$SSL_STATUS" = "PROVISIONING" ]; then
        echo "   🔄 PROVISIONING - Wait 5-15 minutes..."
    elif [[ "$SSL_STATUS" == "FAILED"* ]]; then
        echo "   ❌ $SSL_STATUS"
        echo "   Check DNS points to $IP"
    else
        echo "   ⏳ $SSL_STATUS"
    fi

    # Show domains
    DOMAINS=$(gcloud compute ssl-certificates describe order-ssl-cert --global --format="value(managed.domains)" 2>/dev/null)
    echo "   Domain: $DOMAINS"
else
    echo "   ❌ Certificate not found"
fi
echo ""

# Backend Bucket
echo "🪣 Backend Bucket:"
BACKEND=$(gcloud compute backend-buckets describe order-backend-bucket --global --format="value(bucketName)" 2>/dev/null)
if [ -n "$BACKEND" ]; then
    echo "   ✅ gs://$BACKEND"
else
    echo "   ❌ Not found"
fi
echo ""

# URL Map
echo "🗺️  URL Map:"
URL_MAP=$(gcloud compute url-maps describe order-lb --format="value(name)" 2>/dev/null)
if [ -n "$URL_MAP" ]; then
    echo "   ✅ $URL_MAP"
else
    echo "   ❌ Not found"
fi
echo ""

# Forwarding Rules
echo "📡 Forwarding Rules:"
RULES=$(gcloud compute forwarding-rules list --global --filter="name~order-lb" --format="table[no-heading](name,IPAddress,target)" 2>/dev/null)
if [ -n "$RULES" ]; then
    echo "$RULES" | while read line; do
        echo "   ✅ $line"
    done
else
    echo "   ❌ No rules found"
fi
echo ""

# DNS Check
echo "🌐 DNS Check for order.dolinaflo.com:"
DNS_IP=$(dig +short order.dolinaflo.com | tail -1)
if [ -n "$DNS_IP" ]; then
    if [ "$DNS_IP" = "$IP" ]; then
        echo "   ✅ Correct: $DNS_IP"
    else
        echo "   ⚠️  Points to: $DNS_IP (expected: $IP)"
    fi
else
    echo "   ❌ Not configured yet"
    echo "   Configure in Cloudflare:"
    echo "   Type: A, Name: order, IPv4: $IP, Proxy: OFF"
fi
echo ""

# Files in bucket
echo "📦 Files in Storage Bucket:"
FILE_COUNT=$(gsutil ls gs://order.dolinaflo.com/** 2>/dev/null | wc -l | tr -d ' ')
if [ "$FILE_COUNT" -gt 0 ]; then
    echo "   ✅ $FILE_COUNT files uploaded"
else
    echo "   ❌ No files found - run: ./upload-to-gcs.sh"
fi
echo ""

echo "=========================================="
echo "📋 Summary"
echo "=========================================="

if [ -n "$IP" ] && [ "$SSL_STATUS" = "ACTIVE" ] && [ "$DNS_IP" = "$IP" ]; then
    echo "✅ Everything is ready!"
    echo "🌍 Your site: https://order.dolinaflo.com"
elif [ -n "$IP" ] && [ "$SSL_STATUS" = "PROVISIONING" ]; then
    echo "⏳ SSL certificate is provisioning..."
    echo "Wait 5-15 minutes and check again"
elif [ -z "$DNS_IP" ] || [ "$DNS_IP" != "$IP" ]; then
    echo "⚠️  Configure DNS in Cloudflare:"
    echo "   Type: A"
    echo "   Name: order"
    echo "   IPv4: $IP"
    echo "   Proxy: OFF (grey cloud)"
else
    echo "⚠️  Some components need attention"
    echo "Check the details above"
fi
echo ""

