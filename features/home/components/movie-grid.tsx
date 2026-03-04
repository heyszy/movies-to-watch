"use client";

import Image from "next/image";
import Link from "next/link";

import { WatchlistToggleButton } from "@/features/watchlist/components/watchlist-toggle-button";
import { createWatchlistMovieInputFromListItem } from "@/features/watchlist/lib/watchlist-movie";
import type { MovieListItem } from "@/shared/lib/movie-adapter";

interface MovieGridProps {
  movies: MovieListItem[];
}

const SKELETON_KEYS = [
  "skeleton-1",
  "skeleton-2",
  "skeleton-3",
  "skeleton-4",
  "skeleton-5",
  "skeleton-6",
  "skeleton-7",
  "skeleton-8",
] as const;

function formatVote(voteAverage: number): string {
  return voteAverage > 0 ? voteAverage.toFixed(1) : "--";
}

function MovieCard({ movie }: { movie: MovieListItem }) {
  const watchlistMovie = createWatchlistMovieInputFromListItem(movie);

  return (
    <li className="group">
      <article className="flex overflow-hidden rounded-2xl border border-slate-200 bg-white sm:h-full sm:flex-col sm:rounded-md sm:border-0 sm:shadow-sm sm:transition sm:duration-300 sm:hover:shadow-md">
        <div className="relative aspect-2/3 w-24 shrink-0 overflow-hidden bg-slate-100 sm:w-full">
          <Link
            href={`/movie/${movie.id}`}
            className="block h-full outline-none"
          >
            {movie.posterUrl ? (
              <Image
                src={movie.posterUrl}
                alt={`${movie.title} 海报`}
                fill
                sizes="(max-width: 640px) 96px, (max-width: 1024px) 33vw, 25vw"
                className="object-cover"
              />
            ) : (
              <div className="flex h-full items-center justify-center px-4 text-center text-sm font-medium tracking-wide text-slate-500">
                暂无海报
              </div>
            )}
          </Link>

          <span className="absolute left-2 top-2 inline-flex min-h-8 min-w-8 items-center justify-center rounded-full bg-slate-900/82 px-2 text-xs font-semibold text-white sm:left-3 sm:top-3 sm:min-h-9 sm:min-w-9">
            {formatVote(movie.voteAverage)}
          </span>
        </div>

        <div className="flex min-w-0 flex-1 flex-col justify-between gap-3 p-3 sm:p-4">
          <div className="min-w-0">
            <Link href={`/movie/${movie.id}`} className="block outline-none">
              <h3
                className="text-base font-semibold text-slate-900 sm:truncate"
                title={movie.title}
              >
                {movie.title}
              </h3>
            </Link>
            <p className="mt-2 text-xs font-medium tracking-wide text-slate-600">
              {movie.releaseDate || "上映日期未知"}
            </p>
          </div>

          <WatchlistToggleButton
            movie={watchlistMovie}
            className="min-h-9 w-fit rounded-lg border border-slate-300 bg-white px-3 text-xs font-medium text-slate-700 hover:bg-slate-100 sm:min-h-8 sm:min-w-20"
          />
        </div>
      </article>
    </li>
  );
}

export function MovieGrid({ movies }: MovieGridProps) {
  return (
    <ul className="flex flex-col gap-3 sm:grid sm:grid-cols-3 sm:gap-4 md:gap-5 lg:grid-cols-4">
      {movies.map((movie) => (
        <MovieCard key={movie.id} movie={movie} />
      ))}
    </ul>
  );
}

export function MovieGridSkeleton() {
  return (
    <ul
      className="flex flex-col gap-3 sm:grid sm:grid-cols-3 sm:gap-4 md:gap-5 lg:grid-cols-4"
      aria-hidden
    >
      {SKELETON_KEYS.map((key) => (
        <li
          key={key}
          className="h-full overflow-hidden rounded-2xl border border-slate-200 bg-white sm:rounded-3xl"
        >
          <div className="flex sm:block">
            <div className="movie-skeleton aspect-2/3 w-24 shrink-0 sm:w-full" />
            <div className="flex flex-1 flex-col justify-between gap-3 p-3 sm:space-y-3 sm:p-4">
              <div className="space-y-2">
                <div className="movie-skeleton h-4 w-3/4 rounded-full" />
                <div className="movie-skeleton h-3 w-1/2 rounded-full" />
              </div>
              <div className="movie-skeleton h-9 w-20 rounded-lg sm:h-8" />
            </div>
          </div>
        </li>
      ))}
    </ul>
  );
}
