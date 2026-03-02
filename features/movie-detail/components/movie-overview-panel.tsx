import { Youtube } from "iconoir-react";
import Image from "next/image";
import Link from "next/link";
import type { MovieDetailItem } from "@/shared/lib/movie-detail-adapter";
import {
  formatMovieDate,
  formatMovieVote,
  formatRuntime,
} from "../lib/movie-detail-format";

interface MovieOverviewPanelProps {
  movie: MovieDetailItem;
  directors?: string[];
  trailerUrl?: string | null;
}

function MoviePoster({ movie }: { movie: MovieDetailItem }) {
  return (
    <div className="relative aspect-2/3 overflow-hidden rounded-2xl bg-slate-100 shadow-lg shadow-lime-900/15">
      {movie.posterUrl ? (
        <Image
          src={movie.posterUrl}
          alt={`${movie.title} 海报`}
          fill
          sizes="(max-width: 768px) 100vw, 280px"
          className="object-cover"
          priority
        />
      ) : (
        <div className="flex h-full items-center justify-center px-6 text-center text-sm font-medium tracking-wide text-slate-500">
          暂无海报
        </div>
      )}
    </div>
  );
}

function MovieRatingRing({ voteAverage }: { voteAverage: number }) {
  // 将评分限制在 0-10，避免异常值导致圆环渲染错误。
  const safeVote = Number.isFinite(voteAverage)
    ? Math.min(Math.max(voteAverage, 0), 10)
    : 0;
  const score = formatMovieVote(voteAverage);
  const progress = `${(safeVote / 10) * 100}%`;

  return (
    <div className="inline-flex h-10 items-center gap-2.5 rounded-xl bg-slate-100/80 px-3">
      <div
        className="relative h-8 w-8 shrink-0 rounded-full"
        // 使用 conic-gradient 直接生成评分进度圆环，减少额外 DOM 结构。
        style={{
          background: `conic-gradient(#0f172a 0 ${progress}, #cbd5e1 ${progress} 100%)`,
        }}
        aria-hidden
      >
        <div className="absolute inset-[3px] flex items-center justify-center rounded-full bg-white text-[10px] font-semibold text-slate-900">
          {score}
        </div>
      </div>
      <div className="leading-tight">
        <p className="text-[10px] font-medium tracking-wide text-slate-500">
          TMDB 评分
        </p>
        <p className="text-xs font-semibold text-slate-900">{score} / 10</p>
      </div>
    </div>
  );
}

export function MovieOverviewPanel({
  movie,
  directors = [],
  trailerUrl,
}: MovieOverviewPanelProps) {
  return (
    <section className="relative overflow-hidden">
      <div className="relative grid gap-6 md:grid-cols-[minmax(0,280px)_minmax(0,1fr)] lg:gap-8">
        <MoviePoster movie={movie} />

        <div className="flex flex-col gap-5">
          <header className="space-y-3">
            <h1 className="text-3xl font-bold tracking-tight text-slate-900 sm:text-5xl">
              {movie.title}
            </h1>
            <p className="text-sm font-medium text-slate-700">
              {formatMovieDate(movie.releaseDate)}
              {movie.genres.length > 0
                ? ` · ${movie.genres.map((gre) => gre.name).join(", ")}`
                : ""}
              {movie.runtime ? ` · ${formatRuntime(movie.runtime)}` : ""}
            </p>
          </header>

          <div className="flex flex-wrap items-center gap-3">
            <MovieRatingRing voteAverage={movie.voteAverage} />
            {trailerUrl ? (
              <Link
                href={trailerUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex min-h-10 w-fit items-center rounded-xl bg-slate-900 px-4 text-sm font-semibold text-white transition hover:bg-slate-700 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-slate-200"
              >
                <Youtube className="mr-2" />
                播放预告片
              </Link>
            ) : null}
          </div>

          {movie.tagline ? (
            <p className="text-2xl/7 italic text-slate-700">{movie.tagline}</p>
          ) : null}

          <div>
            <h2 className="text-2xl font-bold text-slate-900">简介</h2>
            <p className="mt-3 text-sm leading-7 text-slate-800">
              {movie.overview || "暂无剧情简介。"}
            </p>
          </div>

          {directors.length > 0 ? (
            <div>
              <h3 className="text-base font-semibold text-slate-900">导演</h3>
              <p className="mt-1 text-sm font-medium text-slate-800">
                {directors.join("、")}
              </p>
            </div>
          ) : null}
        </div>
      </div>
    </section>
  );
}
