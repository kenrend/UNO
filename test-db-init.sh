#!/bin/bash

# Test script to verify database initialization works locally
echo "Testing database initialization locally..."

# Create data directory
mkdir -p data

# Set DATABASE_URL
export DATABASE_URL="file:./data/dev.db"

# Generate Prisma client
echo "Generating Prisma client..."
npx prisma generate

# Push database schema
echo "Pushing database schema..."
npx prisma db push

# Test database connection
echo "Testing database connection..."
npx prisma db execute --stdin --url="$DATABASE_URL" <<EOF
SELECT 1 as test;
EOF

if [ $? -eq 0 ]; then
    echo "Database connection test successful"
else
    echo "Database connection test failed"
fi

echo "Local test completed"