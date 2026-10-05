import { db } from "@/db";
import { sql } from "drizzle-orm";

export async function GET() {
  try {
    const result = await db.execute(sql`SELECT 1`);

    return Response.json({
      success: true,
      result,
    });
  } catch (error) {
    console.error("❌ FULL DATABASE ERROR:", error);

    if (error instanceof Error) {
      console.error("message:", error.message);
      console.error("cause:", error.cause);
      console.error("stack:", error.stack);
    }

    return Response.json(
      {
        success: false,
        message: error instanceof Error ? error.message : String(error),
        cause:
          error instanceof Error && error.cause ? String(error.cause) : null,
      },
      { status: 500 },
    );
  }
}
