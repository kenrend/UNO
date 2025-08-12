import { NextResponse } from "next/server";
import { db } from '@/lib/db';

export async function GET() {
  try {
    console.log("Health check: Testing database connection...");
    console.log("DATABASE_URL:", process.env.DATABASE_URL);
    
    // Test database connection
    const result = await db.$queryRaw`SELECT 1 as test`;
    console.log("Health check: Database query result:", result);
    
    return NextResponse.json({ 
      status: "healthy", 
      database: "connected",
      message: "Database connection successful",
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Health check failed:', error);
    console.error('Error details:', {
      message: error.message,
      stack: error.stack,
      code: error.code,
      meta: error.meta
    });
    
    return NextResponse.json({ 
      status: "unhealthy", 
      database: "disconnected",
      error: error.message,
      timestamp: new Date().toISOString(),
      databaseUrl: process.env.DATABASE_URL ? "set" : "not set"
    }, { status: 500 });
  }
}