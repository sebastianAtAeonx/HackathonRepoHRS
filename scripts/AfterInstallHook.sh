#!/bin/bash
set -e
cd /home/ubuntu/supplierx
npm install -f
pm2 start src/index.js 
