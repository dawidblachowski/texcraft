#!/bin/bash
cd /app
npx prisma migrate deploy
node index.js