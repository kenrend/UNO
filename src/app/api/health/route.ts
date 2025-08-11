import { NextResponse } from "next/server";
import { db } from '@/lib/db';

export async function GET() {
  try {
    // Test database connection
    await db.$queryRaw`SELECT 1`;
    
    return NextResponse.json({ 
      status: "healthy", 
      database: "connected",
      message: "Good!" 
    });
  } catch (error) {
    console.error('Health check failed:', error);
    return NextResponse.json({ 
      status: "unhealthy", 
      database: "disconnected",
      error: error.message 
    }, { status: 500 });
  }
}