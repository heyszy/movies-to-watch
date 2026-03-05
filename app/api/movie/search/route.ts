import { type NextRequest, NextResponse } from "next/server";

import { createApiErrorResponse, normalizePage } from "@/shared/lib/api-route";
import { adaptMovieListResponse } from "@/shared/lib/movie-adapter";
import { tmdbGet } from "@/shared/lib/tmdb";

export async function GET(request: NextRequest): Promise<NextResponse> {
  const query = request.nextUrl.searchParams.get("q")?.trim() ?? "";
  const page = normalizePage(request.nextUrl.searchParams.get("page"));

  if (!query) {
    return NextResponse.json(
      {
        message: "请提供搜索关键词，例如：/api/movie/search?q=inception",
        code: "INVALID_QUERY",
      },
      { status: 400 },
    );
  }

  try {
    /**
     * 只保留必要查询参数，避免路由层直接把前端任意参数透传到 TMDB。
     * 搜索接口不启用服务端缓存，避免高基数关键词造成缓存膨胀。
     */
    const rawResponse = await tmdbGet<unknown>({
      path: "/search/movie",
      query: {
        query,
        page,
        include_adult: false,
        language: "zh-CN",
      },
    });

    const response = adaptMovieListResponse(rawResponse, {
      source: "search",
      query,
      pageFallback: page,
    });

    return NextResponse.json(response);
  } catch (error) {
    return createApiErrorResponse(error, "搜索电影时发生未预期错误。");
  }
}
