#!/bin/sh

# Create data directory with proper permissions
mkdir -p /app/data
chown -R nextjs:nodejs /app/data

# Generate Prisma client
npx prisma generate

# Push database schema to create the database file
npx prisma db push

# Set proper permissions for database file
if [ -f "/app/data/dev.db" ]; then
    chown nextjs:nodejs /app/data/dev.db
    chmod 644 /app/data/dev.db
fi

echo "Database initialization completed"