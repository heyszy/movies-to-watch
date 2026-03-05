import { type NextRequest, NextResponse } from "next/server";

import {
  createApiErrorResponse,
  normalizeMovieId,
} from "@/shared/lib/api-route";
import { TMDB_CACHE_SECONDS } from "@/shared/lib/movie-cache-policy";
import { adaptMovieCreditsResponse } from "@/shared/lib/movie-detail-adapter";
import { tmdbGet } from "@/shared/lib/tmdb";

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function GET(
  _request: NextRequest,
  context: RouteContext,
): Promise<NextResponse> {
  const { id } = await context.params;
  const movieId = normalizeMovieId(id);

  if (!movieId) {
    return NextResponse.json(
      {
        message: "电影 ID 无效，请传入正整数。",
        code: "INVALID_MOVIE_ID",
      },
      { status: 400 },
    );
  }

  try {
    const rawResponse = await tmdbGet<unknown>({
      path: `/movie/${movieId}/credits`,
      query: {
        language: "zh-CN",
      },
      revalidateSeconds: TMDB_CACHE_SECONDS.movieCredits,
    });

    return NextResponse.json(adaptMovieCreditsResponse(rawResponse, movieId));
  } catch (error) {
    return createApiErrorResponse(error, "加载电影演职员时发生未预期错误。");
  }
}
