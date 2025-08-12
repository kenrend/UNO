import { PrismaClient } from '@prisma/client'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

export const db =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: ['query', 'info', 'warn', 'error'],
  })

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = db

// Add connection error handling
db.$connect()
  .then(() => {
    console.log('Database connected successfully')
  })
  .catch((error) => {
    console.error('Database connection failed:', error)
    console.error('DATABASE_URL:', process.env.DATABASE_URL)
  })