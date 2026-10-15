import type { z } from "zod";
// import {
//   AppError,
//   isAppError,
//   isSystemErrorMessage,
//   resolveApiErrorStatus,
//   toUserFacingError,
// } from "@/lib/app-error";
// import type { ApiResponse } from "@/types";
export interface ApiResponse<T = unknown> {
  success: boolean;
  data: T | null;
  error: string | null;
}

export function apiSuccess<T>(data: T, status = 200): Response {
  const body: ApiResponse<T> = {
    success: true,
    data,
    error: null,
  };

  return Response.json(body, { status });
}

export function apiError(error: unknown, fallbackMessage: string): Response {
  const message = error instanceof Error ? error.message : fallbackMessage;
  const status = message.startsWith("Validation failed:") ? 400 : 500;

  const body: ApiResponse = { success: false, data: null, error: message };
  return Response.json(body, { status });
}

// export async function parseJsonBody<T extends z.ZodType>(
//   schema: T,
//   request: Request,
// ): Promise<z.infer<T>> {
//   const result = schema.safeParse(await request.json());

//   if (!result.success) {
//     throw new AppError(`Validation failed: ${result.error.message}`);
//   }

//   return result.data;
// }
