"use client";

import { Button } from "@base-ui/react/button";
import { Dialog } from "@base-ui/react/dialog";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";

import {
  buildLotteryFrames,
  LOTTERY_SLOT_COUNT,
  LOTTERY_TICK_MS,
  pickRandomMovie,
} from "../lib/watch-lottery";
import type { WatchlistMovie } from "../lib/watchlist-movie";

interface WatchLotteryDialogProps {
  movies: WatchlistMovie[];
}

const REEL_SLOTS = ["left", "middle", "right"] as const;

function LotteryPoster({ movie }: { movie: WatchlistMovie | null }) {
  if (movie?.posterUrl) {
    return (
      <Image
        src={movie.posterUrl}
        alt={`${movie.title} 海报`}
        fill
        sizes="(max-width: 640px) 26vw, 110px"
        loading="eager"
        className="object-cover"
      />
    );
  }

  return (
    <div className="flex h-full items-center justify-center px-2 text-center text-xs font-medium text-slate-500">
      暂无海报
    </div>
  );
}

/**
 * 待看清单抽签弹框：
 * - 通过三个滚轴展示动画过程
 * - 结束时三个格子固定为同一部中奖电影
 */
export function WatchLotteryDialog({ movies }: WatchLotteryDialogProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isRolling, setIsRolling] = useState(false);
  const [currentTick, setCurrentTick] = useState(0);
  const [winner, setWinner] = useState<WatchlistMovie | null>(null);
  const [reelFrames, setReelFrames] = useState<WatchlistMovie[][]>([]);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  function clearRollingTimer() {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }

  function resetLotteryState() {
    clearRollingTimer();
    setIsRolling(false);
    setCurrentTick(0);
    setWinner(null);
    setReelFrames([]);
  }

  function startLottery() {
    if (isRolling || movies.length === 0) {
      return;
    }

    const selectedMovie = pickRandomMovie(movies);
    if (!selectedMovie) {
      return;
    }

    const frames = buildLotteryFrames(movies, selectedMovie);

    resetLotteryState();
    setIsRolling(true);
    setReelFrames(frames);

    let tick = 0;
    timerRef.current = setInterval(() => {
      tick += 1;
      setCurrentTick(tick);

      // 到达最后一帧
      if (tick >= frames[0].length - 1) {
        clearRollingTimer();
        setIsRolling(false);
        setWinner(selectedMovie);
      }
    }, LOTTERY_TICK_MS);
  }

  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, []);

  const displayMovies = useMemo(() => {
    return Array.from({ length: LOTTERY_SLOT_COUNT }, (_, index) => {
      return movies[index % movies.length] ?? null;
    });
  }, [movies]);

  return (
    <Dialog.Root
      open={isOpen}
      onOpenChange={(nextOpen) => {
        setIsOpen(nextOpen);

        if (!nextOpen) {
          resetLotteryState();
        }
      }}
    >
      <Dialog.Trigger className="min-h-10 rounded-xl border border-sky-200 bg-sky-50 px-4 text-sm font-medium text-sky-700 hover:bg-sky-100 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-sky-100">
        Lottery
      </Dialog.Trigger>

      <Dialog.Portal>
        <Dialog.Backdrop className="fixed inset-0 z-40 bg-slate-900/30" />
        <Dialog.Popup className="fixed left-1/2 top-1/2 z-50 w-[min(94vw,460px)] -translate-x-1/2 -translate-y-1/2 rounded-2xl border border-slate-200 bg-white p-5 outline-none">
          <Dialog.Title className="text-lg font-semibold text-slate-900">
            Watch Lottery
          </Dialog.Title>
          <Dialog.Description className="mt-2 text-sm leading-6 text-slate-600">
            点击开始，随机抽取一部待看电影。
          </Dialog.Description>

          <section className="mt-4 rounded-2xl border border-slate-200 bg-slate-50 p-3">
            <div className="grid grid-cols-3 gap-2">
              {REEL_SLOTS.map((slot, slotIndex) => {
                const frames = reelFrames[slotIndex] ?? [];
                const staticMovie = displayMovies[slotIndex] ?? null;

                if (frames.length === 0) {
                  return (
                    <div
                      key={slot}
                      className="relative aspect-2/3 overflow-hidden rounded-xl border border-slate-200 bg-slate-100"
                    >
                      <LotteryPoster movie={staticMovie} />
                    </div>
                  );
                }

                const safeTick = Math.min(currentTick, frames.length - 1);
                const framePercent = 100 / frames.length;
                const trackPercent = frames.length * 100;
                const translatePercent = (safeTick * 100) / frames.length;

                return (
                  <div
                    key={slot}
                    className="relative aspect-2/3 overflow-hidden rounded-xl border border-slate-200 bg-slate-100"
                  >
                    <div
                      className="relative w-full"
                      style={{
                        height: `${trackPercent}%`,
                        transform: `translateY(-${translatePercent}%)`,
                        transition: isRolling
                          ? `transform ${LOTTERY_TICK_MS}ms linear`
                          : "none",
                      }}
                    >
                      {frames.map((movie, frameIndex) => (
                        <div
                          key={`${slot}-${movie.id}-${frameIndex}`}
                          className="absolute left-0 w-full"
                          style={{
                            top: `${frameIndex * framePercent}%`,
                            height: `${framePercent}%`,
                          }}
                        >
                          <LotteryPoster movie={movie} />
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </section>

          {winner ? (
            <section className="mt-4 rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2">
              <p className="text-sm font-medium text-emerald-800">
                抽中电影：{winner.title}
              </p>
              <Link
                href={`/movie/${winner.id}`}
                className="mt-2 inline-flex min-h-9 items-center rounded-lg border border-emerald-300 bg-white px-3 text-xs font-medium text-emerald-700 hover:bg-emerald-100 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-emerald-100"
              >
                查看详情
              </Link>
            </section>
          ) : null}

          <div className="mt-5 flex items-center justify-end gap-2">
            <Dialog.Close className="inline-flex min-h-10 items-center rounded-xl border border-slate-300 bg-white px-4 text-sm font-medium text-slate-700 hover:bg-slate-100 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-slate-200">
              关闭
            </Dialog.Close>
            <Button
              type="button"
              disabled={isRolling || movies.length === 0}
              onClick={startLottery}
              className="inline-flex min-h-10 items-center rounded-xl bg-slate-900 px-4 text-sm font-medium text-white hover:bg-slate-700 disabled:cursor-not-allowed disabled:bg-slate-400 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-slate-200"
            >
              {isRolling ? "滚动中..." : "开始"}
            </Button>
          </div>
        </Dialog.Popup>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
