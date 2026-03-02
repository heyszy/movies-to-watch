import Link from "next/link";

import type { MovieReviewsResponse } from "@/shared/lib/movie-detail-adapter";
import {
  formatMovieCount,
  formatMovieDate,
  truncateReviewContent,
} from "../lib/movie-detail-format";

interface MovieReviewPanelProps {
  reviews: MovieReviewsResponse | null;
  errorMessage?: string;
}

function ReviewError({ message }: { message: string }) {
  return (
    <section className="rounded-3xl bg-white p-6 shadow-sm">
      <h2 className="text-xl font-semibold text-slate-900">用户评论</h2>
      <p className="mt-3 text-sm leading-7 text-slate-600">{message}</p>
    </section>
  );
}

function formatReviewRating(rating: number | null): string {
  if (typeof rating !== "number") {
    return "未评分";
  }

  return `${rating.toFixed(1)} / 10`;
}

export function MovieReviewPanel({
  reviews,
  errorMessage,
}: MovieReviewPanelProps) {
  if (errorMessage) {
    return <ReviewError message={errorMessage} />;
  }

  if (!reviews) {
    return <ReviewError message="暂无评论数据。" />;
  }

  /**
   * 评论区默认展示前 6 条，避免单页内容过长导致首屏可读性下降。
   */
  const reviewList = reviews.results.slice(0, 6);

  return (
    <section>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-xl font-semibold text-slate-900">用户评论</h2>
        <p className="text-sm text-slate-600">
          共 {formatMovieCount(reviews.totalResults)} 条评论
        </p>
      </div>

      {reviewList.length > 0 ? (
        <ul className="mt-5 space-y-4">
          {reviewList.map((review) => (
            <li
              key={review.id}
              className="rounded-2xl border border-slate-200 bg-slate-50 p-4"
            >
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="text-sm font-semibold text-slate-900">
                  {review.author}
                </p>
                <div className="flex items-center gap-2 text-xs text-slate-500">
                  <span>{formatReviewRating(review.rating)}</span>
                  <span>{formatMovieDate(review.createdAt)}</span>
                </div>
              </div>

              <p className="mt-3 text-sm leading-7 text-slate-700">
                {truncateReviewContent(review.content)}
              </p>

              {review.url ? (
                <Link
                  href={review.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-3 inline-flex text-xs font-medium text-slate-700 underline underline-offset-3 transition hover:text-slate-900"
                >
                  查看原文
                </Link>
              ) : null}
            </li>
          ))}
        </ul>
      ) : (
        <p className="mt-4 text-sm text-slate-600">暂无评论。</p>
      )}
    </section>
  );
}
