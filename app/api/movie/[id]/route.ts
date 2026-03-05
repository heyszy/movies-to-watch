import { type NextRequest, NextResponse } from "next/server";

import {
  createApiErrorResponse,
  normalizeMovieId,
} from "@/shared/lib/api-route";
import { TMDB_CACHE_SECONDS } from "@/shared/lib/movie-cache-policy";
import { adaptMovieDetailResponse } from "@/shared/lib/movie-detail-adapter";
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
      path: `/movie/${movieId}`,
      query: {
        language: "zh-CN",
      },
      revalidateSeconds: TMDB_CACHE_SECONDS.movieDetail,
    });

    return NextResponse.json(adaptMovieDetailResponse(rawResponse, movieId));
  } catch (error) {
    return createApiErrorResponse(error, "加载电影详情时发生未预期错误。");
  }
}
