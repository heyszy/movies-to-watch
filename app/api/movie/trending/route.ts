import { type NextRequest, NextResponse } from "next/server";

import { createApiErrorResponse, normalizePage } from "@/shared/lib/api-route";
import { adaptMovieListResponse } from "@/shared/lib/movie-adapter";
import { TMDB_CACHE_SECONDS } from "@/shared/lib/movie-cache-policy";
import { tmdbGet } from "@/shared/lib/tmdb";

export async function GET(request: NextRequest): Promise<NextResponse> {
  const page = normalizePage(request.nextUrl.searchParams.get("page"));

  try {
    /**
     * 选择周趋势数据作为首页默认内容，进站就有可浏览清单，不会出现空白页。
     * 若你后续偏好“长期热门”而非“短期趋势”，可改成 /movie/popular。
     */
    const rawResponse = await tmdbGet<unknown>({
      path: "/trending/movie/week",
      query: {
        page,
        language: "zh-CN",
      },
      revalidateSeconds: TMDB_CACHE_SECONDS.trending,
    });

    const response = adaptMovieListResponse(rawResponse, {
      source: "trending",
      pageFallback: page,
    });

    return NextResponse.json(response);
  } catch (error) {
    return createApiErrorResponse(error, "加载热门电影时发生未预期错误。");
  }
}
