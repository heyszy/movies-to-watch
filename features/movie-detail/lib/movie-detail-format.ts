const zhDateFormatter = new Intl.DateTimeFormat("zh-CN", {
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
});

/**
 * 将 TMDB 日期字符串统一格式化为中文日期，非法值回退为占位文案。
 */
export function formatMovieDate(rawDate: string | null): string {
  if (!rawDate) {
    return "待定";
  }

  const date = new Date(rawDate);
  if (Number.isNaN(date.getTime())) {
    return "待定";
  }

  return zhDateFormatter.format(date);
}

/**
 * 评分字段统一保留一位小数；缺失或异常值时返回占位符。
 */
export function formatMovieVote(voteAverage: number): string {
  if (!Number.isFinite(voteAverage) || voteAverage <= 0) {
    return "--";
  }

  return voteAverage.toFixed(1);
}

/**
 * 将时长（分钟）转成更易读的“X小时Y分钟”。
 */
export function formatRuntime(runtime: number | null): string {
  if (!runtime || runtime <= 0) {
    return "未知";
  }

  const hours = Math.floor(runtime / 60);
  const minutes = runtime % 60;

  if (hours <= 0) {
    return `${minutes}分钟`;
  }

  if (minutes <= 0) {
    return `${hours}小时`;
  }

  return `${hours}小时${minutes}分钟`;
}

/**
 * 评论内容可能较长，按字符长度裁切，保持详情页首屏可读性。
 */
export function truncateReviewContent(
  content: string,
  maxLength = 280,
): string {
  const normalized = content.trim();
  if (!normalized) {
    return "暂无评论内容。";
  }

  if (normalized.length <= maxLength) {
    return normalized;
  }

  return `${normalized.slice(0, maxLength).trim()}...`;
}

export function formatMovieCount(value: number): string {
  if (!Number.isFinite(value) || value < 0) {
    return "0";
  }

  return Math.floor(value).toLocaleString("zh-CN");
}
