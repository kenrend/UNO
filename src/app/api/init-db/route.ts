import { NextResponse } from "next/server";
import { db } from '@/lib/db';
import { PrismaClient } from '@prisma/client';

export async function POST() {
  try {
    // Try to connect to the database
    await db.$queryRaw`SELECT 1`;
    
    // Try to create a test table to ensure database is writable
    const testResult = await db.$queryRaw`SELECT name FROM sqlite_master WHERE type='table' AND name='Game'`;
    
    return NextResponse.json({ 
      status: "success", 
      message: "Database initialized successfully",
      tables: testResult 
    });
  } catch (error) {
    console.error('Database initialization failed:', error);
    
    // Try to get more detailed error information
    let errorMessage = error.message;
    if (error.code === 'ENOENT') {
      errorMessage = 'Database file not found or directory not writable';
    } else if (error.code === 'EACCES') {
      errorMessage = 'Permission denied when accessing database file';
    } else if (error.code === 'SQLITE_CANTOPEN') {
      errorMessage = 'Cannot open database file';
    }
    
    return NextResponse.json({ 
      status: "error", 
      message: "Database initialization failed",
      error: errorMessage,
      code: error.code 
    }, { status: 500 });
  }
}