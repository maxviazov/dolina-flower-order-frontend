#!/bin/bash
set -x

cd /Users/maximviazov/Developer/Golang/GoLandWorkspace/dolina-flower-order-frontend

echo "=== Checking build directory ==="
ls -la build/

echo "=== Uploading files to GCS ==="
gsutil -o "GSUtil:parallel_process_count=1" -m cp -r build/* gs://order.dolinaflo.com/

echo "=== Setting cache headers ==="
gsutil setmeta -h "Cache-Control:no-cache" gs://order.dolinaflo.com/index.html
gsutil -m setmeta -h "Cache-Control:public, max-age=31536000" gs://order.dolinaflo.com/static/**

echo "=== Verifying upload ==="
gsutil ls -r gs://order.dolinaflo.com/

echo "=== Done! ==="

