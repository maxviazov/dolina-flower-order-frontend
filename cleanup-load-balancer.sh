ение серьезноео#!/bin/bash
set -e

PROJECT_ID="dolina-flower-order"

echo "🧹 Cleaning up Load Balancer resources..."
echo ""
echo "⚠️  This will delete:"
echo "   - Forwarding rules"
echo "   - Target proxies"
echo "   - URL maps"
echo "   - SSL certificate"
echo "   - Backend bucket"
echo "   - Static IP address"
echo ""
read -p "Continue? (y/N) " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "Cancelled."
    exit 0
fi

gcloud config set project $PROJECT_ID

echo ""
echo "🗑️  Deleting forwarding rules..."
gcloud compute forwarding-rules delete order-lb-https-rule --global -q 2>/dev/null || echo "   Already deleted or not found"
gcloud compute forwarding-rules delete order-lb-http-rule --global -q 2>/dev/null || echo "   Already deleted or not found"

echo "🗑️  Deleting target proxies..."
gcloud compute target-https-proxies delete order-lb-https-proxy -q 2>/dev/null || echo "   Already deleted or not found"
gcloud compute target-http-proxies delete order-lb-http-proxy -q 2>/dev/null || echo "   Already deleted or not found"

echo "🗑️  Deleting URL maps..."
gcloud compute url-maps delete order-lb -q 2>/dev/null || echo "   Already deleted or not found"
gcloud compute url-maps delete order-lb-redirect -q 2>/dev/null || echo "   Already deleted or not found"

echo "🗑️  Deleting SSL certificate..."
gcloud compute ssl-certificates delete order-ssl-cert --global -q 2>/dev/null || echo "   Already deleted or not found"

echo "🗑️  Deleting backend bucket..."
gcloud compute backend-buckets delete order-backend-bucket --global -q 2>/dev/null || echo "   Already deleted or not found"

echo "🗑️  Releasing static IP..."
read -p "Delete static IP address (34.128.141.177)? (y/N) " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    gcloud compute addresses delete order-static-ip --global -q 2>/dev/null || echo "   Already deleted or not found"
else
    echo "   Keeping static IP (will be billed ~$8/month if not in use)"
fi

echo ""
echo "✅ Cleanup complete!"
echo ""
echo "💰 Savings: ~$18-20/month"
echo ""
echo "📋 What's still running:"
echo "   - Cloud Storage bucket (order.dolinaflo.com) - needed for site"
echo "   - Backend Cloud Run service - needed for API"
echo ""
echo "🌍 Your site still works via CNAME:"
echo "   https://order.dolinaflo.com"
echo ""

