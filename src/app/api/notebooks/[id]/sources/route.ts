import { listNotebookSources } from "@/app/lib/sources/source.service";
import { apiSuccess } from "@/utils/api-route";
import { NextRequest } from "next/server";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id: notebookId } = await params;
    const notebookSources = await listNotebookSources(notebookId);
    return apiSuccess(notebookSources);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
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
