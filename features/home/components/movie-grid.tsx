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
      <article className="flex h-full flex-col overflow-hidden rounded-md bg-white shadow-sm transition duration-300 hover:shadow-md">
        <div className="relative aspect-2/3 w-full overflow-hidden">
          <Link
            href={`/movie/${movie.id}`}
            className="block h-full outline-none"
          >
            {movie.posterUrl ? (
              <Image
                src={movie.posterUrl}
                alt={`${movie.title} 海报`}
                fill
                sizes="(max-width: 640px) 48vw, (max-width: 1024px) 33vw, 25vw"
                className="object-cover"
              />
            ) : (
              <div className="flex h-full items-center justify-center px-4 text-center text-sm font-medium tracking-wide text-slate-500">
                暂无海报
              </div>
            )}
          </Link>

          <span className="absolute left-3 top-3 inline-flex min-h-9 min-w-9 items-center justify-center rounded-full bg-slate-900/82 px-2 text-xs font-semibold text-white">
            {formatVote(movie.voteAverage)}
          </span>
        </div>

        <div className="p-4 flex items-start justify-between gap-2">
          <div>
            <Link href={`/movie/${movie.id}`} className="flex-1 outline-none">
              <h3 className="line-clamp-2 text-base font-semibold text-slate-900">
                {movie.title}
              </h3>
            </Link>
            <p className="mt-2 text-xs font-medium tracking-wide text-slate-600">
              {movie.releaseDate}
            </p>
          </div>

          <WatchlistToggleButton
            movie={watchlistMovie}
            className="min-h-8 min-w-20 rounded-lg border border-slate-300 bg-white px-3 text-xs font-medium text-slate-700 hover:bg-slate-100"
          />
        </div>
      </article>
    </li>
  );
}

export function MovieGrid({ movies }: MovieGridProps) {
  return (
    <ul className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:gap-5 lg:grid-cols-4">
      {movies.map((movie) => (
        <MovieCard key={movie.id} movie={movie} />
      ))}
    </ul>
  );
}

export function MovieGridSkeleton() {
  return (
    <ul
      className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:gap-5 lg:grid-cols-4"
      aria-hidden
    >
      {SKELETON_KEYS.map((key) => (
        <li
          key={key}
          className="h-full overflow-hidden rounded-3xl border border-slate-200 bg-white"
        >
          <div className="movie-skeleton aspect-2/3 w-full" />
          <div className="space-y-3 p-4">
            <div className="movie-skeleton h-4 w-3/4 rounded-full" />
            <div className="movie-skeleton h-3 w-1/2 rounded-full" />
            <div className="movie-skeleton h-3 w-full rounded-full" />
          </div>
        </li>
      ))}
    </ul>
  );
}
