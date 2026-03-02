import type { MovieListResponse } from "@/shared/lib/movie-adapter";

interface ApiErrorPayload {
  message?: string;
}

interface FetchMovieListPageParams {
  keyword: string;
  page: number;
  signal?: AbortSignal;
}

/**
 * 统一首页列表请求：关键词为空走 trending，非空走 search。
 */
export async function fetchMovieListPage({
  keyword,
  page,
  signal,
}: FetchMovieListPageParams): Promise<MovieListResponse> {
  const endpoint = keyword ? "/api/movie/search" : "/api/movie/trending";
  const searchParams = new URLSearchParams({ page: String(page) });

  if (keyword) {
    searchParams.set("q", keyword);
  }

  const response = await fetch(`${endpoint}?${searchParams.toString()}`, {
    signal,
  });

  const data: unknown = await response.json();

  if (!response.ok) {
    const payload = data as ApiErrorPayload;
    throw new Error(payload.message ?? "加载电影列表失败，请稍后重试。");
  }

  return data as MovieListResponse;
}
