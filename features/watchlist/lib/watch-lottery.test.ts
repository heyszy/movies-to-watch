import { describe, expect, it } from "vitest";
import { buildLotteryFrames, pickRandomMovie } from "./watch-lottery";
import type { WatchlistMovie } from "./watchlist-movie";

function createMovie(
  id: number,
  title: string,
  posterUrl: string | null = `https://example.com/${id}.jpg`,
): WatchlistMovie {
  return {
    id,
    title,
    posterUrl,
    releaseDate: "2024-01-01",
    voteAverage: 7.5,
    addedAt: "2026-03-03T00:00:00.000Z",
  };
}

describe("pickRandomMovie", () => {
  it("清单为空时返回 null", () => {
    expect(pickRandomMovie([])).toBeNull();
  });

  it("随机值为 0 时命中首个元素", () => {
    const movies = [
      createMovie(1, "A"),
      createMovie(2, "B"),
      createMovie(3, "C"),
    ];
    const selected = pickRandomMovie(movies, () => 0);

    expect(selected?.id).toBe(1);
  });

  it("随机值接近 1 时命中最后一个元素", () => {
    const movies = [
      createMovie(1, "A"),
      createMovie(2, "B"),
      createMovie(3, "C"),
    ];
    const selected = pickRandomMovie(movies, () => 0.999999);

    expect(selected?.id).toBe(3);
  });
});

describe("buildLotteryFrames", () => {
  it("三个滚轴的最后一帧都会收敛到同一部电影", () => {
    const movies = [
      createMovie(1, "A"),
      createMovie(2, "B"),
      createMovie(3, "C"),
    ];
    const winner = movies[1];
    const frames = buildLotteryFrames(movies, winner, 6, () => 0);

    expect(frames).toHaveLength(3);
    expect(frames[0].at(-1)?.id).toBe(winner.id);
    expect(frames[1].at(-1)?.id).toBe(winner.id);
    expect(frames[2].at(-1)?.id).toBe(winner.id);
  });

  it("每个滚轴的每一帧都来自待看清单", () => {
    const movies = [
      createMovie(1, "A"),
      createMovie(2, "B"),
      createMovie(3, "C"),
    ];
    const winner = movies[0];
    const frames = buildLotteryFrames(movies, winner, 7, () => 0.5);
    const ids = new Set(movies.map((movie) => movie.id));

    for (const reelFrames of frames) {
      for (const frameMovie of reelFrames) {
        expect(ids.has(frameMovie.id)).toBe(true);
      }
    }
  });
});
