import { ApiError, ErrorCode } from "@repo/api-client"

const CODES = new Set<string>(Object.values(ErrorCode))

/** The API's machine-readable error code (see `Error.code` in the spec), if any. */
export function apiErrorCode(error: unknown): ErrorCode | undefined {
  if (!(error instanceof ApiError) || typeof error.body !== "object" || error.body === null) {
    return undefined
  }
  const code = (error.body as { code?: unknown }).code
  return typeof code === "string" && CODES.has(code) ? (code as ErrorCode) : undefined
}
