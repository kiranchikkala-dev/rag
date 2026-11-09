import { db } from "@/db";
import { notebooks } from "@/db/schema";
import { createNotebookSchema } from "@/types/notebook.type";
import { desc } from "drizzle-orm";
import { NextRequest } from "next/server";
import { eq } from "drizzle-orm";
export async function GET(request: NextRequest) {
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
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");
    if (!id) {
      return Response.json(
        {
          success: false,
          data: null,
          error: "Notebook ID is required",
        },
        { status: 400 },
      );
    }
    const result = await db
      .delete(notebooks)
      .where(eq(notebooks.id, id))
      .returning();
    if (result.length === 0) {
      return Response.json(
        {
          success: false,
          data: null,
          error: "Notebook not found",
        },
        { status: 404 },
      );
    }
    return Response.json({
      success: true,
      data: result[0],
      error: null,
    });
  } catch (error) {
    console.error("❌ DELETE NOTEBOOK ERROR:", error);

    const message =
      error instanceof Error ? error.message : "Failed to delete Notebook";

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

export async function PATCH(request: NextRequest) {
  try {
    // 1. Get notebook ID from URL
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return Response.json(
        {
          success: false,
          data: null,
          error: "Notebook ID is required",
        },
        { status: 400 },
      );
    }

    // 2. Get and validate request body
    const body = createNotebookSchema.safeParse(
      await request.json().catch(() => ({})),
    );
    console.log("🚀 ~ PATCH ~ body:", body);

    if (!body.success) {
      return Response.json(
        {
          success: false,
          data: null,
          error: `Validation failed: ${body.error.message}`,
        },
        { status: 400 },
      );
    }

    // 3. Update notebook in database
    const updatedNotebook = await db
      .update(notebooks)
      .set({
        title: body.data.title,
        description: body.data?.description,
      })
      .where(eq(notebooks.id, id))
      .returning();
    console.log("🚀 ~ PATCH ~ updatedNotebook:", updatedNotebook);

    // 4. Check if notebook exists
    if (updatedNotebook.length === 0) {
      return Response.json(
        {
          success: false,
          data: null,
          error: "Notebook not found",
        },
        { status: 404 },
      );
    }

    // 5. Return updated notebook
    return Response.json({
      success: true,
      data: updatedNotebook[0],
      error: null,
    });
  } catch (error) {
    console.error("❌ UPDATE NOTEBOOK ERROR:", error);

    const message =
      error instanceof Error ? error.message : "Failed to update Notebook";

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
