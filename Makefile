# Dolina Flower Order Frontend Makefile

.PHONY: build deploy dev clean

# Build React app
build:
	npm install && npm run build

# Deploy to AWS S3
deploy: build
	cd terraform && terraform init && terraform apply -auto-approve
	$(eval BUCKET := $(shell cd terraform && terraform output -raw s3_bucket))
	aws s3 sync build/ s3://$(BUCKET)/ --delete

# Local development
dev:
	npm start

# Clean up
clean:
	cd terraform && terraform destroy -auto-approve
	rm -rf build node_modules