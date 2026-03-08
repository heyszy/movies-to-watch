"use client";

import { useWindowVirtualizer } from "@tanstack/react-virtual";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { WatchlistToggleButton } from "@/features/watchlist/components/watchlist-toggle-button";
import { createWatchlistMovieInputFromListItem } from "@/features/watchlist/lib/watchlist-movie";
import { FallbackImage } from "@/shared/components/fallback-image";
import type { MovieListItem } from "@/shared/lib/movie-adapter";

interface VirtualListProps {
  movies: MovieListItem[];
  hasNextPage: boolean;
  isFetchingNextPage: boolean;
  onLoadMore: () => void;
}

const LOAD_MORE_THRESHOLD_PX = 640;
const SCROLL_CALC_THROTTLE_MS = 120;

const SKELETON_KEYS = [
  "skeleton-1",
  "skeleton-2",
  "skeleton-3",
  "skeleton-4",
  "skeleton-5",
  "skeleton-6",
  "skeleton-7",
  "skeleton-8",
  "skeleton-9",
  "skeleton-10",
  "skeleton-11",
  "skeleton-12",
] as const;

function formatVote(voteAverage: number): string {
  return voteAverage > 0 ? voteAverage.toFixed(1) : "--";
}

function calcColumns(width: number): number {
  if (width >= 1024) {
    return 4;
  }

  if (width >= 640) {
    return 3;
  }

  return 1;
}

function getGridColsClass(columns: number): string {
  if (columns >= 4) {
    return "grid-cols-4";
  }

  if (columns >= 3) {
    return "grid-cols-3";
  }

  return "grid-cols-1";
}

function chunkMovies(movies: MovieListItem[], size: number): MovieListItem[][] {
  if (movies.length === 0) {
    return [];
  }

  const safeSize = size > 0 ? size : 1;
  const result: MovieListItem[][] = [];

  for (let index = 0; index < movies.length; index += safeSize) {
    result.push(movies.slice(index, index + safeSize));
  }

  return result;
}

/**
 * 监听容器宽度变化，统一驱动列数切换与虚拟列表重测量。
 */
function useResizeObserver<T extends Element>(
  targetRef: { current: T | null },
  onResize: () => void,
): void {
  useEffect(() => {
    const element = targetRef.current;
    if (!element) {
      return;
    }

    const observer = new ResizeObserver(() => {
      onResize();
    });

    observer.observe(element);

    return () => {
      observer.disconnect();
    };
  }, [onResize, targetRef]);
}

function MovieCard({
  movie,
  shouldEagerLoadImage = false,
}: {
  movie: MovieListItem;
  shouldEagerLoadImage?: boolean;
}) {
  const watchlistMovie = createWatchlistMovieInputFromListItem(movie);

  return (
    <article className="group flex overflow-hidden rounded-2xl border border-slate-200 bg-white sm:h-full sm:flex-col sm:rounded-md">
      <div className="relative aspect-2/3 w-24 shrink-0 overflow-hidden bg-slate-100 sm:w-full">
        <Link
          href={`/movie/${movie.id}`}
          className="relative block h-full outline-none"
        >
          <FallbackImage
            src={movie.posterUrl}
            alt={`${movie.title} 海报`}
            sizes="(max-width: 640px) 96px, (max-width: 1024px) 33vw, 25vw"
            loading={shouldEagerLoadImage ? "eager" : "lazy"}
            imageClassName="object-cover"
            fallbackClassName="flex h-full items-center justify-center px-4 text-center text-sm font-medium tracking-wide text-slate-500"
            emptyText="暂无海报"
          />
        </Link>

        <span className="absolute left-2 top-2 inline-flex min-h-8 min-w-8 items-center justify-center rounded-full bg-slate-900/85 px-2 text-xs font-semibold text-white backdrop-blur-sm sm:left-3 sm:top-3 sm:min-h-9 sm:min-w-9">
          {formatVote(movie.voteAverage)}
        </span>
      </div>

      <div className="flex min-w-0 flex-1 flex-col justify-between gap-3 p-3 sm:p-4">
        <div className="min-w-0">
          <Link href={`/movie/${movie.id}`} className="block outline-none">
            <h3
              className="line-clamp-2 text-base font-semibold leading-6 text-slate-900 sm:line-clamp-1"
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
              <div className="movie-skeleton h-9 w-20 rounded-lg sm:h-10" />
            </div>
          </div>
        </li>
      ))}
    </ul>
  );
}

export function VirtualList({
  movies,
  hasNextPage,
  isFetchingNextPage,
  onLoadMore,
}: VirtualListProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [columns, setColumns] = useState(1);

  const rows = useMemo(() => {
    return chunkMovies(movies, columns);
  }, [movies, columns]);
  const totalRows = rows.length + 1;

  const rowVirtualizer = useWindowVirtualizer({
    count: totalRows,
    estimateSize: () => {
      return columns === 1 ? 176 : 476;
    },
    overscan: 6,
    scrollMargin: containerRef.current?.offsetTop ?? 0,
    measureElement: (element) => element.getBoundingClientRect().height,
  });

  const syncColumns = useCallback(() => {
    const container = containerRef.current;
    if (!container) {
      return;
    }

    const nextColumns = calcColumns(container.clientWidth);
    setColumns((previousColumns) => {
      return previousColumns === nextColumns ? previousColumns : nextColumns;
    });
  }, []);

  useResizeObserver(containerRef, syncColumns);

  useEffect(() => {
    syncColumns();
  }, [syncColumns]);

  /**
   * 计算“是否应加载下一页”：
   * - 基于列表容器底部到视口底部的距离判断
   * - 距离足够近时触发 onLoadMore
   */
  const checkShouldLoadMore = useCallback(() => {
    if (!hasNextPage || isFetchingNextPage) {
      return;
    }

    const container = containerRef.current;
    if (!container) {
      return;
    }

    const containerRect = container.getBoundingClientRect();
    const distanceToViewportBottom = containerRect.bottom - window.innerHeight;

    if (distanceToViewportBottom <= LOAD_MORE_THRESHOLD_PX) {
      onLoadMore();
    }
  }, [hasNextPage, isFetchingNextPage, onLoadMore]);

  /**
   * 对滚动计算做节流：
   * - 高频 scroll/resize 事件统一进入 requestAnimationFrame
   * - 使用时间窗口控制计算频率，避免短时间重复触发
   */
  useEffect(() => {
    let animationFrameId: number | null = null;
    let lastCalculatedAt = 0;

    const runCalculation = () => {
      animationFrameId = null;
      lastCalculatedAt = Date.now();
      checkShouldLoadMore();
    };

    const handleScrollOrResize = () => {
      const now = Date.now();
      const throttleWindowNotPassed =
        now - lastCalculatedAt < SCROLL_CALC_THROTTLE_MS;

      if (throttleWindowNotPassed && animationFrameId !== null) {
        return;
      }

      if (animationFrameId !== null) {
        window.cancelAnimationFrame(animationFrameId);
      }

      animationFrameId = window.requestAnimationFrame(runCalculation);
    };

    window.addEventListener("scroll", handleScrollOrResize, { passive: true });
    window.addEventListener("resize", handleScrollOrResize);

    handleScrollOrResize();

    return () => {
      window.removeEventListener("scroll", handleScrollOrResize);
      window.removeEventListener("resize", handleScrollOrResize);

      if (animationFrameId !== null) {
        window.cancelAnimationFrame(animationFrameId);
      }
    };
  }, [checkShouldLoadMore]);

  const scrollMargin = rowVirtualizer.options.scrollMargin ?? 0;
  const virtualItems = rowVirtualizer.getVirtualItems();

  return (
    <div ref={containerRef} className="relative">
      <div
        className="relative w-full"
        style={{ height: rowVirtualizer.getTotalSize() }}
      >
        {virtualItems.map((virtualRow) => {
          const isStatusRow = virtualRow.index === rows.length;
          const rowItems = rows[virtualRow.index] ?? [];
          const emptySlotCount = Math.max(columns - rowItems.length, 0);

          return (
            <div
              key={virtualRow.key}
              data-index={virtualRow.index}
              ref={rowVirtualizer.measureElement}
              className="absolute left-0 top-0 w-full py-1.5 sm:py-2"
              style={{
                transform: `translateY(${virtualRow.start - scrollMargin}px)`,
              }}
            >
              {isStatusRow ? (
                <div className="rounded-2xl border border-slate-200 bg-white px-4 py-4 text-center text-sm text-slate-600">
                  {isFetchingNextPage
                    ? "正在加载更多电影..."
                    : hasNextPage
                      ? "继续下滑即可加载下一页"
                      : "已经到底了，去待看清单挑一部吧"}
                </div>
              ) : (
                <div
                  className={`grid gap-3 sm:gap-4 md:gap-5 ${getGridColsClass(columns)}`}
                >
                  {rowItems.map((movie, itemIndex) => (
                    <MovieCard
                      key={movie.id}
                      movie={movie}
                      shouldEagerLoadImage={
                        virtualRow.index === 0 && itemIndex < 4
                      }
                    />
                  ))}

                  {Array.from({ length: emptySlotCount }).map((_, index) => (
                    <div
                      key={`spacer-${virtualRow.index}-${index}`}
                      className="pointer-events-none opacity-0"
                    />
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
