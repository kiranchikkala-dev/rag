// import { AppError } from "@/lib/app-error";
import type { NextRequest } from "next/server";
import { apiError, apiSuccess } from "@/utils/api-route";
import { uploadSourceFile } from "@/app/lib/sources/source.service";
import { uploadSourceRequestSchema } from "@/types";
// import { getAuthenticatedUserOrThrow } from "@/utils/auth-helpers";

export const maxDuration = 600;
export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  try {
    // const user = await getAuthenticatedUserOrThrow();
    const formData = await request.formData();
    const file = formData.get("file");
    const notebookId = formData.get("notebookId");
    const title = formData.get("title");

    if (!(file instanceof File)) {
      throw new Error("Validation failed: No file provided");
    }

    const parsedFields = uploadSourceRequestSchema.safeParse({
      notebookId,
      title: typeof title === "string" && title.trim() ? title : undefined,
    });
    if (!parsedFields.success) {
      throw new Error(`Validation failed: ${parsedFields.error.message}`);
    }

    const result = await uploadSourceFile(
      //   user,
      parsedFields.data.notebookId,
      file,
      parsedFields.data.title,
    );
    console.log("🚀 ~ POST ~ result:", result);
    return apiSuccess(result);
  } catch (error) {
    return apiError(error, "Failed to upload source");
  }
}
