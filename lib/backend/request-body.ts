import "server-only";
import { ApiError } from "@/lib/backend/errors";

export async function readRequestBytes(request: Request, maxBytes: number, emptyMessage: string) {
  if (!request.body) throw new ApiError(400, "EMPTY_BODY", emptyMessage);
  const reader = request.body.getReader();
  const chunks: Uint8Array[] = [];
  let total = 0;
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      total += value.byteLength;
      if (total > maxBytes) {
        await reader.cancel();
        throw new ApiError(413, "PAYLOAD_TOO_LARGE", "The request is too large.");
      }
      chunks.push(value);
    }
  } finally {
    reader.releaseLock();
  }

  const bytes = new Uint8Array(total);
  let offset = 0;
  for (const chunk of chunks) {
    bytes.set(chunk, offset);
    offset += chunk.byteLength;
  }
  return bytes;
}

export async function readJsonRequest(request: Request, maxBytes: number) {
  const bytes = await readRequestBytes(request, maxBytes, "Send a JSON request body.");
  try {
    return JSON.parse(new TextDecoder().decode(bytes)) as unknown;
  } catch {
    throw new ApiError(400, "INVALID_JSON", "Send valid JSON.");
  }
}
