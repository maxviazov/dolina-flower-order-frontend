#!/bin/bash
set -e

# Configuration
PROJECT_ID="dolina-flower-order"
BUCKET_NAME="order.dolinaflo.com"
BACKEND_URL="https://dolina-flower-order-backend-373154353561.europe-west1.run.app/api/v1"
LOCATION="europe-west1"

echo "🚀 Starting deployment to Google Cloud Storage..."

# Check if gcloud is installed
if ! command -v gcloud &> /dev/null; then
    echo "❌ gcloud CLI is not installed. Please install it first."
    exit 1
fi

# Set the project
echo "📦 Setting GCP project to $PROJECT_ID..."
gcloud config set project $PROJECT_ID

# Build the React app
echo "🔨 Building React app..."
export REACT_APP_API_BASE_URL=$BACKEND_URL
npm install
npm run build

# Create bucket if it doesn't exist
echo "🪣 Creating/checking bucket $BUCKET_NAME..."
if ! gsutil ls -b gs://$BUCKET_NAME &> /dev/null; then
    gsutil mb -p $PROJECT_ID -l $LOCATION gs://$BUCKET_NAME
    echo "✅ Bucket created"
else
    echo "✅ Bucket already exists"
fi

# Configure bucket for website hosting
echo "🌐 Configuring bucket for static website hosting..."
gsutil web set -m index.html -e index.html gs://$BUCKET_NAME

# Set bucket to public access
echo "🔓 Making bucket publicly accessible..."
gsutil iam ch allUsers:objectViewer gs://$BUCKET_NAME

# Upload files to bucket
echo "📤 Uploading files to bucket..."
gsutil -m rsync -r -d build/ gs://$BUCKET_NAME

# Set cache control for static assets
echo "⚡ Setting cache control headers..."
gsutil -m setmeta -h "Cache-Control:public, max-age=31536000" gs://$BUCKET_NAME/static/**
gsutil -m setmeta -h "Cache-Control:no-cache" gs://$BUCKET_NAME/index.html

echo "✅ Deployment complete!"
echo ""
echo "📋 Next steps:"
echo "1. Go to Cloudflare DNS settings"
echo "2. Add a CNAME record:"
echo "   Name: order"
echo "   Target: c.storage.googleapis.com"
echo "   Proxy status: Proxied (orange cloud)"
echo ""
echo "3. If you need HTTPS, configure Cloudflare SSL/TLS settings:"
echo "   - SSL/TLS mode: Full or Flexible"
echo "   - Enable 'Always Use HTTPS'"
echo ""
echo "🌍 Your site will be available at: https://order.dolinaflo.com"

