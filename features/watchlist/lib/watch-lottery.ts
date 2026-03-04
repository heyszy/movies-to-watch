import type { WatchlistMovie } from "./watchlist-movie";

// 三个滚轴
export const LOTTERY_SLOT_COUNT = 3;
// 每帧间隔 ms
export const LOTTERY_TICK_MS = 120;
// 统一停止帧
export const LOTTERY_STOP_TICK = 24;

type RandomFunction = () => number;

/**
 * 随机抽取电影
 */
export function pickRandomMovie(
  movies: WatchlistMovie[],
  random: RandomFunction = Math.random,
): WatchlistMovie | null {
  if (movies.length === 0) {
    return null;
  }

  const index = Math.floor(random() * movies.length);
  return movies[Math.min(index, movies.length - 1)];
}

/**
 * 构建三个滚轴在每一帧要展示的电影
 * - 每个滚轴在统一停止帧前随机滚动
 * - 到达停止帧后固定为同一部电影
 */
export function buildLotteryFrames(
  movies: WatchlistMovie[],
  winner: WatchlistMovie,
  stopTick: number = LOTTERY_STOP_TICK,
  random: RandomFunction = Math.random,
): WatchlistMovie[][] {
  return Array.from({ length: LOTTERY_SLOT_COUNT }, () => {
    const frames: WatchlistMovie[] = [];

    for (let tick = 0; tick <= stopTick; tick += 1) {
      if (tick >= stopTick) {
        frames.push(winner);
        continue;
      }

      const frameMovie = pickRandomMovie(movies, random) ?? winner;
      frames.push(frameMovie);
    }

    return frames;
  });
}
