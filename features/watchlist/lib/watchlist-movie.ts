import type { MovieListItem } from "@/shared/lib/movie-adapter";
import type { MovieDetailItem } from "@/shared/lib/movie-detail-adapter";

export interface WatchlistMovieInput {
  id: number;
  title: string;
  posterUrl: string | null;
  releaseDate: string | null;
  voteAverage: number;
}

export interface WatchlistMovie extends WatchlistMovieInput {
  addedAt: string;
}

export type WatchlistSortKey =
  | "addedAt-desc"
  | "title-asc"
  | "voteAverage-desc"
  | "releaseDate-desc";

export const WATCHLIST_SORT_OPTIONS = [
  { value: "addedAt-desc", label: "按加入时间（最新优先）" },
  { value: "title-asc", label: "按标题（A-Z）" },
  { value: "voteAverage-desc", label: "按评分（高到低）" },
  { value: "releaseDate-desc", label: "按上映日期（最新优先）" },
] as const satisfies ReadonlyArray<{ value: WatchlistSortKey; label: string }>;

/**
 * 待看清单里只保留渲染与排序所需字段，避免把详情页的大对象直接写入本地存储。
 */
export function createWatchlistMovieInputFromListItem(
  movie: MovieListItem,
): WatchlistMovieInput {
  return {
    id: movie.id,
    title: movie.title,
    posterUrl: movie.posterUrl,
    releaseDate: movie.releaseDate,
    voteAverage: movie.voteAverage,
  };
}

/**
 * 详情页和首页都可以复用同一个待看模型，确保写入结构一致。
 */
export function createWatchlistMovieInputFromDetailItem(
  movie: MovieDetailItem,
): WatchlistMovieInput {
  return {
    id: movie.id,
    title: movie.title,
    posterUrl: movie.posterUrl,
    releaseDate: movie.releaseDate,
    voteAverage: movie.voteAverage,
  };
}

function toTimestamp(value: string | null): number {
  if (!value) {
    return 0;
  }

  const time = Date.parse(value);
  return Number.isNaN(time) ? 0 : time;
}

export function sortWatchlistMovies(
  movies: WatchlistMovie[],
  sortKey: WatchlistSortKey,
): WatchlistMovie[] {
  const sorted = [...movies];

  sorted.sort((left, right) => {
    if (sortKey === "title-asc") {
      return left.title.localeCompare(right.title, "zh-CN", {
        sensitivity: "base",
      });
    }

    if (sortKey === "voteAverage-desc") {
      const voteDiff = right.voteAverage - left.voteAverage;
      return voteDiff !== 0
        ? voteDiff
        : left.title.localeCompare(right.title, "zh-CN", {
            sensitivity: "base",
          });
    }

    if (sortKey === "releaseDate-desc") {
      return toTimestamp(right.releaseDate) - toTimestamp(left.releaseDate);
    }

    return toTimestamp(right.addedAt) - toTimestamp(left.addedAt);
  });

  return sorted;
}
