#!/bin/bash
set -e

PROJECT_ID="dolina-flower-order"
BUCKET_NAME="order.dolinaflo.com"
BACKEND_BUCKET_NAME="order-backend-bucket"
LB_NAME="order-lb"
IP_NAME="order-static-ip"
SSL_CERT_NAME="order-ssl-cert"

echo "🚀 Setting up Load Balancer for $BUCKET_NAME..."

# Set project
gcloud config set project $PROJECT_ID

# 1. Reserve static IP
echo "📍 Reserving static IP..."
if ! gcloud compute addresses describe $IP_NAME --global 2>/dev/null; then
    gcloud compute addresses create $IP_NAME --global
fi
STATIC_IP=$(gcloud compute addresses describe $IP_NAME --global --format="get(address)")
echo "✅ Static IP: $STATIC_IP"

# 2. Create backend bucket
echo "🪣 Creating backend bucket..."
if ! gcloud compute backend-buckets describe $BACKEND_BUCKET_NAME --global 2>/dev/null; then
    gcloud compute backend-buckets create $BACKEND_BUCKET_NAME \
        --gcs-bucket-name=$BUCKET_NAME \
        --enable-cdn \
        --cache-mode=CACHE_ALL_STATIC \
        --default-ttl=3600 \
        --max-ttl=86400 \
        --client-ttl=3600
fi
echo "✅ Backend bucket created"

# 3. Create URL map
echo "🗺️  Creating URL map..."
if ! gcloud compute url-maps describe $LB_NAME 2>/dev/null; then
    gcloud compute url-maps create $LB_NAME \
        --default-backend-bucket=$BACKEND_BUCKET_NAME
fi
echo "✅ URL map created"

# 4. Create managed SSL certificate
echo "🔒 Creating SSL certificate..."
if ! gcloud compute ssl-certificates describe $SSL_CERT_NAME --global 2>/dev/null; then
    gcloud compute ssl-certificates create $SSL_CERT_NAME \
        --domains=order.dolinaflo.com \
        --global
fi
echo "✅ SSL certificate created (will be provisioned after DNS setup)"

# 5. Create HTTPS proxy
echo "🔐 Creating HTTPS proxy..."
HTTPS_PROXY_NAME="$LB_NAME-https-proxy"
if ! gcloud compute target-https-proxies describe $HTTPS_PROXY_NAME 2>/dev/null; then
    gcloud compute target-https-proxies create $HTTPS_PROXY_NAME \
        --url-map=$LB_NAME \
        --ssl-certificates=$SSL_CERT_NAME
fi
echo "✅ HTTPS proxy created"

# 6. Create forwarding rule
echo "📡 Creating forwarding rule..."
FORWARDING_RULE_NAME="$LB_NAME-https-rule"
if ! gcloud compute forwarding-rules describe $FORWARDING_RULE_NAME --global 2>/dev/null; then
    gcloud compute forwarding-rules create $FORWARDING_RULE_NAME \
        --global \
        --target-https-proxy=$HTTPS_PROXY_NAME \
        --address=$IP_NAME \
        --ports=443
fi
echo "✅ Forwarding rule created"

# 7. Create HTTP to HTTPS redirect (optional but recommended)
echo "🔄 Setting up HTTP to HTTPS redirect..."
HTTP_PROXY_NAME="$LB_NAME-http-proxy"
HTTP_FORWARDING_RULE="$LB_NAME-http-rule"

# Create URL map for redirect
URL_MAP_REDIRECT="$LB_NAME-redirect"
if ! gcloud compute url-maps describe $URL_MAP_REDIRECT 2>/dev/null; then
    gcloud compute url-maps import $URL_MAP_REDIRECT --global --source /dev/stdin <<EOF
defaultUrlRedirect:
  httpsRedirect: true
  redirectResponseCode: MOVED_PERMANENTLY_DEFAULT
name: $URL_MAP_REDIRECT
EOF
fi

# Create HTTP proxy
if ! gcloud compute target-http-proxies describe $HTTP_PROXY_NAME 2>/dev/null; then
    gcloud compute target-http-proxies create $HTTP_PROXY_NAME \
        --url-map=$URL_MAP_REDIRECT
fi

# Create HTTP forwarding rule
if ! gcloud compute forwarding-rules describe $HTTP_FORWARDING_RULE --global 2>/dev/null; then
    gcloud compute forwarding-rules create $HTTP_FORWARDING_RULE \
        --global \
        --target-http-proxy=$HTTP_PROXY_NAME \
        --address=$IP_NAME \
        --ports=80
fi
echo "✅ HTTP redirect configured"

echo ""
echo "=========================================="
echo "✅ Load Balancer setup complete!"
echo "=========================================="
echo ""
echo "📋 Configuration:"
echo "   Static IP: $STATIC_IP"
echo "   Domain: order.dolinaflo.com"
echo "   Backend: gs://$BUCKET_NAME"
echo ""
echo "🔧 Next steps:"
echo ""
echo "1. Update Cloudflare DNS:"
echo "   - Remove CNAME record if exists"
echo "   - Add A record:"
echo "     Type: A"
echo "     Name: order"
echo "     IPv4: $STATIC_IP"
echo "     Proxy: OFF (grey cloud) - важно!"
echo ""
echo "2. Wait 10-15 minutes for:"
echo "   - DNS propagation"
echo "   - SSL certificate provisioning"
echo ""
echo "3. Check SSL certificate status:"
echo "   gcloud compute ssl-certificates describe $SSL_CERT_NAME --global"
echo ""
echo "4. Test the site:"
echo "   curl -I https://order.dolinaflo.com"
echo ""
echo "🌍 Your site will be available at: https://order.dolinaflo.com"
echo ""

