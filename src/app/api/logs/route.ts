import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthUser } from "@/lib/auth";

export async function GET() {
  try {
    await getAuthUser(); // Verify authentication
    
    const logs = await prisma.aiLog.findMany({
      orderBy: {
        createdAt: "desc",
      },
      take: 50, // Limit to last 50 logs
    });

    return NextResponse.json({ logs });
  } catch (error) {
    console.error("Failed to fetch logs:", error);
    return NextResponse.json(
      { error: "Failed to fetch logs" },
      { status: 500 }
    );
  }
}

export async function DELETE() {
  try {
    await getAuthUser(); // Verify authentication
    
    const deletedLogs = await prisma.aiLog.deleteMany({});
    
    return NextResponse.json({ 
      message: "All logs cleared successfully",
      deletedCount: deletedLogs.count 
    });
  } catch (error) {
    console.error("Failed to clear logs:", error);
    return NextResponse.json(
      { error: "Failed to clear logs" },
      { status: 500 }
    );
  }
}