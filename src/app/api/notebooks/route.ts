import { db } from "@/db";
import { notebooks } from "@/db/schema";
import { createNotebookSchema } from "@/types/notebook.type";
import { desc } from "drizzle-orm";
import { NextRequest } from "next/server";

export async function GET(request: NextRequest) {
  console.log("🚀 ~ GET ~ request:", request);
  try {
    const notebookRes = await db
      .select({
        id: notebooks.id,
        title: notebooks.title,
        description: notebooks.description,
        createdAt: notebooks.createdAt,
      })
      .from(notebooks)
      .orderBy(desc(notebooks));
    return Response.json({
      status: true,
      data: notebookRes.map((nb) => ({
        ...nb,
        createdAt: nb.createdAt.toISOString(),
      })),
      error: null,
    });
  } catch (error) {
    const message =
      error instanceof Error ? error?.message : "Failed to get the notebooks";
    return Response.json(
      {
        status: false,
        error: message,
        data: null,
      },
      { status: 500 },
    );
  }
}
export async function POST(request: NextRequest) {
  try {
    const body = createNotebookSchema.safeParse(
      await request.json().catch(() => ({})),
    );

    if (!body.success) {
      throw new Error(`Validation failed: ${body.error.message}`);
    }
    const [newNotebook] = await db
      .insert(notebooks)
      .values({
        title: body.data.title ?? "Untitled Notebook",
      })
      .returning({
        id: notebooks.id,
        title: notebooks.title,
        description: notebooks.description,
        createdAt: notebooks.createdAt,
      });
    return Response.json({
      success: true,
      data: {
        ...newNotebook,
        createdAt: newNotebook.createdAt.toISOString(),
      },
      error: null,
    });
  } catch (error) {
    console.error("❌ CREATE NOTEBOOK ERROR:", error);

    const message =
      error instanceof Error ? error.message : "Failed to create Notebook";

    return Response.json(
      {
        success: false,
        data: null,
        error: message,
      },
      { status: 500 },
    );
  }
}
