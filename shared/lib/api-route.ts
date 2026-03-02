import { NextResponse } from "next/server";

import { TmdbConfigError, TmdbRequestError } from "@/shared/lib/tmdb";

/**
 * 解析并校验电影 ID，确保只接受正整数。
 */
export function normalizeMovieId(rawId: string): number | null {
  const movieId = Number(rawId);
  if (!Number.isInteger(movieId) || movieId <= 0) {
    return null;
  }
  return movieId;
}

/**
 * 解析分页参数，非法值统一回退到默认页码。
 */
export function normalizePage(rawPage: string | null, fallback = 1): number {
  const page = Number(rawPage);
  if (!Number.isFinite(page) || page <= 0) {
    return fallback;
  }
  return Math.floor(page);
}

/**
 * 统一处理路由层错误，避免每个路由重复写错误映射逻辑。
 */
export function createApiErrorResponse(
  error: unknown,
  fallbackMessage: string,
): NextResponse {
  if (error instanceof TmdbConfigError) {
    return NextResponse.json(
      {
        message: error.message,
        code: "TMDB_CONFIG_ERROR",
      },
      { status: 500 },
    );
  }

  if (error instanceof TmdbRequestError) {
    return NextResponse.json(
      {
        message: error.message,
        code: "TMDB_REQUEST_ERROR",
        details: error.details,
      },
      { status: error.statusCode },
    );
  }

  return NextResponse.json(
    {
      message: fallbackMessage,
      code: "INTERNAL_SERVER_ERROR",
    },
    { status: 500 },
  );
}
