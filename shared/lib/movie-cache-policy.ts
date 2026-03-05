/**
 * TMDB 接口缓存策略（单位：秒）。
 * 这些值用于服务端调用 TMDB 时的 revalidate 配置，减少重复请求并降低限流风险。
 */
export const TMDB_CACHE_SECONDS = {
  trending: 10 * 60,
  movieDetail: 30 * 60,
  movieCredits: 6 * 60 * 60,
  movieVideos: 30 * 60,
  movieReviews: 5 * 60,
} as const;
