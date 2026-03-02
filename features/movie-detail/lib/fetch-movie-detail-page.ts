import {
  adaptMovieCreditsResponse,
  adaptMovieDetailResponse,
  adaptMovieReviewsResponse,
  adaptMovieVideosResponse,
  type MovieCreditsResponse,
  type MovieDetailResponse,
  type MovieReviewsResponse,
  type MovieVideosResponse,
} from "@/shared/lib/movie-detail-adapter";
import { tmdbGet } from "@/shared/lib/tmdb";

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
  const detailTask = settleRequest(
    tmdbGet<unknown>({
      path: `/movie/${movieId}`,
      query: {
        language: "zh-CN",
      },
    }).then((rawResponse) => adaptMovieDetailResponse(rawResponse, movieId)),
    "加载电影详情失败，请稍后重试。",
  );

  const creditsTask = settleRequest(
    tmdbGet<unknown>({
      path: `/movie/${movieId}/credits`,
      query: {
        language: "zh-CN",
      },
    }).then((rawResponse) => adaptMovieCreditsResponse(rawResponse, movieId)),
    "加载演职员信息失败，请稍后重试。",
  );

  const videosTask = settleRequest(
    tmdbGet<unknown>({
      path: `/movie/${movieId}/videos`,
    }).then((rawResponse) => adaptMovieVideosResponse(rawResponse, movieId)),
    "加载预告片信息失败，请稍后重试。",
  );

  const reviewsTask = settleRequest(
    tmdbGet<unknown>({
      path: `/movie/${movieId}/reviews`,
      query: {
        language: "zh-CN",
        page: 1,
      },
    }).then((rawResponse) =>
      adaptMovieReviewsResponse(rawResponse, {
        movieIdFallback: movieId,
        pageFallback: 1,
      }),
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
