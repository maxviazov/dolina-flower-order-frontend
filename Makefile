# Dolina Flower Order Frontend Makefile

.PHONY: build deploy deploy-gcs dev clean

# Configuration
PROJECT_ID=dolina-flower-order
BUCKET_NAME=order.dolinaflo.com
BACKEND_URL=https://dolina-flower-order-backend-373154353561.europe-west1.run.app/api/v1

# Build React app
build:
	REACT_APP_API_BASE_URL=$(BACKEND_URL) npm install && npm run build

# Deploy to Google Cloud Storage
deploy-gcs: build
	@echo "🚀 Deploying to Google Cloud Storage..."
	gcloud config set project $(PROJECT_ID)
	gsutil -m rsync -r -d build/ gs://$(BUCKET_NAME)
	gsutil -m setmeta -h "Cache-Control:public, max-age=31536000" gs://$(BUCKET_NAME)/static/**
	gsutil -m setmeta -h "Cache-Control:no-cache" gs://$(BUCKET_NAME)/index.html
	@echo "✅ Deployment complete! Site available at: https://order.dolinaflo.com"

# Quick deploy (alias)
deploy: deploy-gcs

# Setup GCS bucket (run once)
setup-bucket:
	@echo "🪣 Setting up Google Cloud Storage bucket..."
	gcloud config set project $(PROJECT_ID)
	-gsutil mb -p $(PROJECT_ID) -l europe-west1 gs://$(BUCKET_NAME)
	gsutil web set -m index.html -e index.html gs://$(BUCKET_NAME)
	gsutil iam ch allUsers:objectViewer gs://$(BUCKET_NAME)
	@echo "✅ Bucket setup complete!"

# Local development
dev:
	REACT_APP_API_BASE_URL=$(BACKEND_URL) npm start

# Clean up
clean:
	rm -rf build node_modules

# View bucket contents
bucket-ls:
	gsutil ls -r gs://$(BUCKET_NAME)

# Bucket info
bucket-info:
	gsutil du -sh gs://$(BUCKET_NAME)
	@echo ""
	gsutil stat gs://$(BUCKET_NAME)/index.html
