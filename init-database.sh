#!/bin/sh

echo "Starting database initialization..."

# Create data directory with proper permissions
mkdir -p /app/data
chown -R nextjs:nodejs /app/data

# Set DATABASE_URL environment variable
export DATABASE_URL="file:/app/data/dev.db"

echo "DATABASE_URL set to: $DATABASE_URL"

# Change to app directory
cd /app

# Generate Prisma client
echo "Generating Prisma client..."
npx prisma generate

# Push database schema to create the database file
echo "Pushing database schema..."
npx prisma db push

# Check if database file was created
if [ -f "/app/data/dev.db" ]; then
    echo "Database file created successfully"
    # Set proper permissions for database file
    chown nextjs:nodejs /app/data/dev.db
    chmod 644 /app/data/dev.db
    echo "Database permissions set"
    
    # Test database connection
    echo "Testing database connection..."
    npx prisma db execute --stdin --url="$DATABASE_URL" <<EOF
SELECT 1;
EOF
    
    if [ $? -eq 0 ]; then
        echo "Database connection test successful"
    else
        echo "Database connection test failed"
    fi
else
    echo "Error: Database file was not created"
    exit 1
fi

echo "Database initialization completed successfully"