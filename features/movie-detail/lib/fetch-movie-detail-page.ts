import { headers } from "next/headers";
import type {
  MovieCreditsResponse,
  MovieDetailResponse,
  MovieReviewsResponse,
  MovieVideosResponse,
} from "@/shared/lib/movie-detail-adapter";

type MovieDetailSection = "detail" | "credits" | "videos" | "reviews";

type MovieDetailSectionErrors = Partial<Record<MovieDetailSection, string>>;

interface SettledRequest<T> {
  data: T | null;
  errorMessage: string | null;
}

export interface MovieDetailPageData {
  detail: MovieDetailResponse | null;
  credits: MovieCreditsResponse | null;
  videos: MovieVideosResponse | null;
  reviews: MovieReviewsResponse | null;
  errors: MovieDetailSectionErrors;
}

function resolveErrorMessage(error: unknown, fallbackMessage: string): string {
  if (error instanceof Error && error.message.trim()) {
    return error.message;
  }

  return fallbackMessage;
}

function resolveApiErrorMessage(payload: unknown): string | null {
  if (!payload || typeof payload !== "object" || !("message" in payload)) {
    return null;
  }

  const message = Reflect.get(payload, "message");
  if (typeof message !== "string" || !message.trim()) {
    return null;
  }

  return message;
}

/**
 * 详情页在服务端渲染阶段请求内部 API，需要先拿到当前请求的站点域名。
 * 优先使用显式配置，未配置时回退到请求头中的 host/proto。
 */
async function resolveInternalApiBaseUrl(): Promise<string> {
  const envBaseUrl = process.env.NEXT_PUBLIC_API_URL?.trim();
  if (envBaseUrl) {
    return envBaseUrl;
  }

  const requestHeaders = await headers();
  const host =
    requestHeaders.get("x-forwarded-host") ?? requestHeaders.get("host");
  const protocol = requestHeaders.get("x-forwarded-proto") ?? "http";

  if (host) {
    return `${protocol}://${host}`;
  }

  return `http://127.0.0.1:${process.env.PORT ?? "3000"}`;
}

async function fetchInternalApi<T>(
  baseUrl: string,
  path: string,
  fallbackMessage: string,
): Promise<T> {
  /**
   * 这里保持 no-store：
   * - 避免页面层和 TMDB 层出现双重缓存，导致调试与问题定位困难
   * - 避免把错误响应缓存到页面层
   */
  const response = await fetch(new URL(path, baseUrl), {
    method: "GET",
    cache: "no-store",
  });

  const payload: unknown = await response.json();

  if (!response.ok) {
    throw new Error(resolveApiErrorMessage(payload) ?? fallbackMessage);
  }

  return payload as T;
}

/**
 * 将单个请求包装为“总是成功返回”的结构，避免一个接口失败导致整页不可用。
 */
async function settleRequest<T>(
  requestPromise: Promise<T>,
  fallbackMessage: string,
): Promise<SettledRequest<T>> {
  try {
    const data = await requestPromise;
    return {
      data,
      errorMessage: null,
    };
  } catch (error) {
    return {
      data: null,
      errorMessage: resolveErrorMessage(error, fallbackMessage),
    };
  }
}

/**
 * 详情页数据聚合：
 * - 四个接口并行请求，降低首屏等待时间
 * - 允许局部失败（例如评论失败但详情成功）
 * - 返回统一错误信息，供页面按区块降级展示
 */
export async function fetchMovieDetailPage(
  movieId: number,
): Promise<MovieDetailPageData> {
  const baseUrl = await resolveInternalApiBaseUrl();

  const detailTask = settleRequest(
    fetchInternalApi<MovieDetailResponse>(
      baseUrl,
      `/api/movie/${movieId}`,
      "加载电影详情失败，请稍后重试。",
    ),
    "加载电影详情失败，请稍后重试。",
  );

  const creditsTask = settleRequest(
    fetchInternalApi<MovieCreditsResponse>(
      baseUrl,
      `/api/movie/${movieId}/credits`,
      "加载演职员信息失败，请稍后重试。",
    ),
    "加载演职员信息失败，请稍后重试。",
  );

  const videosTask = settleRequest(
    fetchInternalApi<MovieVideosResponse>(
      baseUrl,
      `/api/movie/${movieId}/videos`,
      "加载预告片信息失败，请稍后重试。",
    ),
    "加载预告片信息失败，请稍后重试。",
  );

  const reviewsTask = settleRequest(
    fetchInternalApi<MovieReviewsResponse>(
      baseUrl,
      `/api/movie/${movieId}/reviews?page=1`,
      "加载评论失败，请稍后重试。",
    ),
    "加载评论失败，请稍后重试。",
  );

  const [detailResult, creditsResult, videosResult, reviewsResult] =
    await Promise.all([detailTask, creditsTask, videosTask, reviewsTask]);

  return {
    detail: detailResult.data,
    credits: creditsResult.data,
    videos: videosResult.data,
    reviews: reviewsResult.data,
    errors: {
      detail: detailResult.errorMessage ?? undefined,
      credits: creditsResult.errorMessage ?? undefined,
      videos: videosResult.errorMessage ?? undefined,
      reviews: reviewsResult.errorMessage ?? undefined,
    },
  };
}
