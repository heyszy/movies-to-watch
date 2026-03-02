import type { MovieListItem } from "@/shared/lib/movie-adapter";

export type HomeSearchSortKey =
  | "relevance"
  | "voteAverage-desc"
  | "releaseDate-desc";

export const HOME_SEARCH_SORT_OPTIONS = [
  { value: "relevance", label: "相关度（默认）" },
  { value: "voteAverage-desc", label: "评分（高到低）" },
  { value: "releaseDate-desc", label: "上映日期（最新优先）" },
] as const satisfies ReadonlyArray<{
  value: HomeSearchSortKey;
  label: string;
}>;

/**
 * Base UI Select 的回调值是 unknown，这里做一次统一类型守卫，
 * 避免在业务组件里散落字符串字面量判断。
 */
export function isHomeSearchSortKey(
  value: unknown,
): value is HomeSearchSortKey {
  return HOME_SEARCH_SORT_OPTIONS.some((option) => option.value === value);
}

/**
 * 统一把日期字符串转换为时间戳：
 * - 空值、非法值统一降级为 0，方便排序阶段稳定比较
 * - 保证排序规则在脏数据下也能给出可预期结果
 */
function toTimestamp(value: string | null): number {
  if (!value) {
    return 0;
  }

  const time = Date.parse(value);
  return Number.isNaN(time) ? 0 : time;
}

function compareByTitle(left: MovieListItem, right: MovieListItem): number {
  return left.title.localeCompare(right.title, "zh-CN", {
    sensitivity: "base",
  });
}

function compareByVoteAverageDesc(
  left: MovieListItem,
  right: MovieListItem,
): number {
  const voteDiff = right.voteAverage - left.voteAverage;
  if (voteDiff !== 0) {
    return voteDiff;
  }

  const voteCountDiff = right.voteCount - left.voteCount;
  if (voteCountDiff !== 0) {
    return voteCountDiff;
  }

  return compareByTitle(left, right);
}

function compareByReleaseDateDesc(
  left: MovieListItem,
  right: MovieListItem,
): number {
  const releaseDiff =
    toTimestamp(right.releaseDate) - toTimestamp(left.releaseDate);
  if (releaseDiff !== 0) {
    return releaseDiff;
  }

  const voteDiff = right.voteAverage - left.voteAverage;
  if (voteDiff !== 0) {
    return voteDiff;
  }

  return compareByTitle(left, right);
}

/**
 * 仅对“搜索结果”做前端排序：
 * - `relevance` 直接保留接口返回顺序（TMDB 相关度）
 * - 其他排序返回拷贝数组，避免修改上层缓存数据
 */
export function sortHomeSearchMovies(
  movies: MovieListItem[],
  sortKey: HomeSearchSortKey,
): MovieListItem[] {
  if (sortKey === "relevance") {
    return movies;
  }

  const sorted = [...movies];

  sorted.sort((left, right) => {
    if (sortKey === "voteAverage-desc") {
      return compareByVoteAverageDesc(left, right);
    }

    return compareByReleaseDateDesc(left, right);
  });

  return sorted;
}
