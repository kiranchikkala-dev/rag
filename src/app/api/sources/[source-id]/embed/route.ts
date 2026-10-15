import { embedNextSourceBatch } from "@/utils/sources/ingest-source";
import { NextRequest } from "next/server";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ "source-id": string }> },
) {
  const { "source-id": sourceId } = await params;
  embedNextSourceBatch(sourceId);
}
