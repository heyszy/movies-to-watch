"use client";

import { Button } from "@base-ui/react/button";
import { Dialog } from "@base-ui/react/dialog";
import { Field } from "@base-ui/react/field";
import { Select } from "@base-ui/react/select";
import { Garage } from "iconoir-react";
import Link from "next/link";
import { type ComponentProps, useMemo, useState } from "react";

import { FallbackImage } from "@/shared/components/fallback-image";
import { WatchLotteryDialog } from "./components/watch-lottery-dialog";
import { WatchlistToggleButton } from "./components/watchlist-toggle-button";
import {
  sortWatchlistMovies,
  WATCHLIST_SORT_OPTIONS,
  type WatchlistSortKey,
} from "./lib/watchlist-movie";
import { useWatchlistStore } from "./store/use-watchlist-store";

const DATE_FORMATTER = new Intl.DateTimeFormat("zh-CN");

function formatDate(value: string | null): string {
  if (!value) {
    return "未知日期";
  }

  const time = Date.parse(value);
  return Number.isNaN(time) ? "未知日期" : DATE_FORMATTER.format(time);
}

function formatVote(voteAverage: number): string {
  return voteAverage > 0 ? voteAverage.toFixed(1) : "--";
}

function isWatchlistSortKey(value: unknown): value is WatchlistSortKey {
  return WATCHLIST_SORT_OPTIONS.some((option) => option.value === value);
}

function ChevronUpDownIcon(props: ComponentProps<"svg">) {
  return (
    <svg
      width="8"
      height="12"
      viewBox="0 0 8 12"
      fill="none"
      stroke="currentcolor"
      strokeWidth="1.5"
      aria-hidden
      focusable="false"
      {...props}
    >
      <title>展开收起</title>
      <path d="M0.5 4.5L4 1.5L7.5 4.5" />
      <path d="M0.5 7.5L4 10.5L7.5 7.5" />
    </svg>
  );
}

function CheckIcon(props: ComponentProps<"svg">) {
  return (
    <svg
      fill="currentcolor"
      width="10"
      height="10"
      viewBox="0 0 10 10"
      aria-hidden
      focusable="false"
      {...props}
    >
      <title>已选中</title>
      <path d="M9.1603 1.12218C9.50684 1.34873 9.60427 1.81354 9.37792 2.16038L5.13603 8.66012C5.01614 8.8438 4.82192 8.96576 4.60451 8.99384C4.3871 9.02194 4.1683 8.95335 4.00574 8.80615L1.24664 6.30769C0.939709 6.02975 0.916013 5.55541 1.19372 5.24822C1.47142 4.94102 1.94536 4.91731 2.2523 5.19524L4.36085 7.10461L8.12299 1.33999C8.34934 0.993152 8.81376 0.895638 9.1603 1.12218Z" />
    </svg>
  );
}

export function WatchlistPage() {
  const [sortKey, setSortKey] = useState<WatchlistSortKey>("addedAt-desc");
  const [isClearDialogOpen, setIsClearDialogOpen] = useState(false);
  const movies = useWatchlistStore((state) => state.items);
  const hasHydrated = useWatchlistStore((state) => state.hasHydrated);
  const storageError = useWatchlistStore((state) => state.storageError);
  const clearMovies = useWatchlistStore((state) => state.clearMovies);

  /**
   * 排序只在原始清单或排序键变化时重新计算，避免每次渲染重复处理列表。
   */
  const sortedMovies = useMemo(
    () => sortWatchlistMovies(movies, sortKey),
    [movies, sortKey],
  );

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-300 flex-col px-4 pb-14 pt-8 sm:px-6 lg:px-10">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-4xl font-bold tracking-tight text-slate-900 sm:text-5xl">
          待看清单
        </h1>
        <Link
          href="/"
          className="inline-flex min-h-11 items-center rounded-2xl border border-slate-200 bg-white px-4 text-sm font-medium text-slate-700 hover:bg-slate-100 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-slate-200"
        >
          <Garage className="mr-2" />
          返回首页
        </Link>
      </header>

      {!hasHydrated ? (
        <section className="mt-8 rounded-3xl bg-white px-6 py-10 text-sm text-slate-600">
          正在读取本地待看清单...
        </section>
      ) : null}

      {hasHydrated && storageError ? (
        <section className="mt-8 rounded-3xl border border-rose-200 bg-rose-50 px-6 py-5 text-sm text-rose-700">
          {storageError}
        </section>
      ) : null}

      {hasHydrated && sortedMovies.length === 0 ? (
        <section className="mt-8 rounded-3xl bg-white px-6 py-10">
          <h2 className="text-2xl font-semibold text-slate-900">清单为空</h2>
          <p className="mt-3 text-sm leading-7 text-slate-600">
            先去首页挑几部电影加入待看，之后可以在这里统一排序和管理。
          </p>
          <Link
            href="/"
            className="mt-5 inline-flex min-h-11 items-center rounded-2xl bg-slate-900 px-5 text-sm font-medium text-white hover:bg-slate-700 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-slate-200"
          >
            去首页挑电影
          </Link>
        </section>
      ) : null}

      {hasHydrated && sortedMovies.length > 0 ? (
        <section className="mt-8">
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-3xl bg-white">
            <Field.Root className="flex min-w-56 flex-col gap-1">
              <Select.Root
                items={WATCHLIST_SORT_OPTIONS}
                value={sortKey}
                onValueChange={(value) => {
                  if (isWatchlistSortKey(value)) {
                    setSortKey(value);
                  }
                }}
              >
                <Select.Trigger className="inline-flex min-h-10 min-w-56 items-center justify-between gap-3 rounded-xl border border-slate-300 bg-white px-3 text-sm text-slate-900 outline-none hover:bg-slate-50 focus-visible:ring-4 focus-visible:ring-slate-200">
                  <Select.Value
                    className="data-placeholder:opacity-60"
                    placeholder="选择排序方式"
                  />
                  <Select.Icon className="flex text-slate-500">
                    <ChevronUpDownIcon />
                  </Select.Icon>
                </Select.Trigger>
                <Select.Portal>
                  <Select.Positioner
                    className="z-10 select-none outline-none"
                    sideOffset={8}
                  >
                    <Select.Popup className="rounded-xl border border-slate-200 bg-white">
                      <Select.ScrollUpArrow className="flex h-4 w-full cursor-default items-center justify-center text-xs text-slate-500" />
                      <Select.List className="max-h-60 overflow-y-auto py-1">
                        {WATCHLIST_SORT_OPTIONS.map((option) => (
                          <Select.Item
                            key={option.value}
                            value={option.value}
                            className="grid cursor-default grid-cols-[0.75rem_1fr] items-center gap-2 py-2 pl-2.5 pr-4 text-sm text-slate-700 outline-none data-[highlighted]:bg-slate-900 data-[highlighted]:text-slate-50"
                          >
                            <Select.ItemIndicator className="col-start-1">
                              <CheckIcon className="size-3" />
                            </Select.ItemIndicator>
                            <Select.ItemText className="col-start-2">
                              {option.label}
                            </Select.ItemText>
                          </Select.Item>
                        ))}
                      </Select.List>
                      <Select.ScrollDownArrow className="flex h-4 w-full cursor-default items-center justify-center text-xs text-slate-500" />
                    </Select.Popup>
                  </Select.Positioner>
                </Select.Portal>
              </Select.Root>
            </Field.Root>

            <div className="flex items-center gap-2">
              <WatchLotteryDialog movies={sortedMovies} />

              <Dialog.Root
                open={isClearDialogOpen}
                onOpenChange={setIsClearDialogOpen}
              >
                <Dialog.Trigger className="min-h-10 rounded-xl border border-rose-200 bg-rose-50 px-4 text-sm font-medium text-rose-700 hover:bg-rose-100 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-rose-100">
                  清空清单
                </Dialog.Trigger>
                <Dialog.Portal>
                  <Dialog.Backdrop className="fixed inset-0 z-40 bg-slate-900/30" />
                  <Dialog.Popup className="fixed left-1/2 top-1/2 z-50 w-[min(92vw,420px)] -translate-x-1/2 -translate-y-1/2 rounded-2xl border border-slate-200 bg-white p-5 outline-none">
                    <Dialog.Title className="text-lg font-semibold text-slate-900">
                      确认清空待看清单？
                    </Dialog.Title>
                    <Dialog.Description className="mt-2 text-sm leading-6 text-slate-600">
                      该操作会移除所有待看电影，且无法撤销。
                    </Dialog.Description>

                    <div className="mt-5 flex justify-end gap-2">
                      <Dialog.Close className="inline-flex min-h-10 items-center rounded-xl border border-slate-300 bg-white px-4 text-sm font-medium text-slate-700 hover:bg-slate-100 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-slate-200">
                        取消
                      </Dialog.Close>
                      <Button
                        type="button"
                        onClick={() => {
                          clearMovies();
                          setIsClearDialogOpen(false);
                        }}
                        className="inline-flex min-h-10 items-center rounded-xl bg-rose-600 px-4 text-sm font-medium text-white hover:bg-rose-700 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-rose-100"
                      >
                        确认清空
                      </Button>
                    </div>
                  </Dialog.Popup>
                </Dialog.Portal>
              </Dialog.Root>
            </div>
          </div>

          <ul className="mt-5 flex flex-col gap-3 sm:grid sm:grid-cols-3 sm:gap-4 md:gap-5 lg:grid-cols-4">
            {sortedMovies.map((movie) => (
              <li
                key={movie.id}
                className="overflow-hidden rounded-2xl border border-slate-200 bg-white sm:rounded-3xl"
              >
                <article className="flex sm:h-full sm:flex-col">
                  <Link
                    href={`/movie/${movie.id}`}
                    className="block w-24 shrink-0 outline-none hover:opacity-95 sm:w-full"
                  >
                    <div className="relative aspect-2/3 w-full overflow-hidden bg-slate-100">
                      <FallbackImage
                        src={movie.posterUrl}
                        alt={`${movie.title} 海报`}
                        sizes="(max-width: 640px) 96px, (max-width: 1024px) 33vw, 25vw"
                        imageClassName="object-cover"
                        fallbackClassName="flex h-full items-center justify-center px-4 text-center text-sm font-medium tracking-wide text-slate-500"
                        emptyText="暂无海报"
                      />
                    </div>
                  </Link>

                  <div className="flex min-w-0 flex-1 flex-col justify-between gap-3 p-3 sm:p-4">
                    <div className="min-w-0">
                      <Link
                        href={`/movie/${movie.id}`}
                        className="block outline-none hover:opacity-95"
                      >
                        <h2
                          className="text-base font-semibold text-slate-900 sm:truncate"
                          title={movie.title}
                        >
                          {movie.title}
                        </h2>
                      </Link>
                      <div className="mt-2 hidden space-y-1 sm:block">
                        <p className="text-xs text-slate-600">
                          上映日期：{formatDate(movie.releaseDate)}
                        </p>
                        <p className="text-xs text-slate-600">
                          TMDB 评分：{formatVote(movie.voteAverage)}
                        </p>
                        <p className="text-xs text-slate-600">
                          加入时间：{formatDate(movie.addedAt)}
                        </p>
                      </div>
                    </div>

                    <WatchlistToggleButton
                      movie={movie}
                      className="inline-flex min-h-9 w-fit items-center rounded-xl border border-slate-300 bg-white px-3 text-sm font-medium text-slate-700 hover:bg-slate-100 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-slate-200 sm:min-h-10 sm:w-full sm:justify-center"
                    />
                  </div>
                </article>
              </li>
            ))}
          </ul>
        </section>
      ) : null}
    </main>
  );
}
