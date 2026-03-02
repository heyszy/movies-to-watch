import { describe, expect, it } from "vitest";

import type { MovieListItem } from "../../../shared/lib/movie-adapter";
import { sortHomeSearchMovies } from "./home-movie-sort";

function createMovie(
  overrides: Partial<MovieListItem> & Pick<MovieListItem, "id" | "title">,
): MovieListItem {
  return {
    id: overrides.id,
    title: overrides.title,
    overview: overrides.overview ?? "",
    posterPath: overrides.posterPath ?? null,
    posterUrl: overrides.posterUrl ?? null,
    backdropPath: overrides.backdropPath ?? null,
    backdropUrl: overrides.backdropUrl ?? null,
    releaseDate: overrides.releaseDate ?? null,
    voteAverage: overrides.voteAverage ?? 0,
    voteCount: overrides.voteCount ?? 0,
    popularity: overrides.popularity ?? 0,
    genreIds: overrides.genreIds ?? [],
    originalLanguage: overrides.originalLanguage ?? "zh",
    adult: overrides.adult ?? false,
  };
}

describe("sortHomeSearchMovies", () => {
  it("相关度排序保持接口原始顺序", () => {
    const movies = [
      createMovie({ id: 3, title: "C" }),
      createMovie({ id: 1, title: "A" }),
      createMovie({ id: 2, title: "B" }),
    ];

    const sorted = sortHomeSearchMovies(movies, "relevance");

    expect(sorted.map((movie) => movie.id)).toEqual([3, 1, 2]);
  });

  it("评分排序先按评分，再按票数，最后按标题", () => {
    const movies = [
      createMovie({ id: 1, title: "乙", voteAverage: 8, voteCount: 120 }),
      createMovie({ id: 2, title: "甲", voteAverage: 8, voteCount: 120 }),
      createMovie({ id: 3, title: "丙", voteAverage: 8.6, voteCount: 5 }),
      createMovie({ id: 4, title: "丁", voteAverage: 8, voteCount: 300 }),
    ];

    const sorted = sortHomeSearchMovies(movies, "voteAverage-desc");

    expect(sorted.map((movie) => movie.id)).toEqual([3, 4, 2, 1]);
  });

  it("上映日期排序会把空值和非法日期放到后面", () => {
    const movies = [
      createMovie({
        id: 1,
        title: "A",
        releaseDate: "2023-10-01",
        voteAverage: 6,
      }),
      createMovie({ id: 2, title: "B", releaseDate: null, voteAverage: 9 }),
      createMovie({
        id: 3,
        title: "C",
        releaseDate: "invalid-date",
        voteAverage: 7.8,
      }),
      createMovie({
        id: 4,
        title: "D",
        releaseDate: "2025-02-15",
        voteAverage: 5,
      }),
    ];

    const sorted = sortHomeSearchMovies(movies, "releaseDate-desc");

    expect(sorted.map((movie) => movie.id)).toEqual([4, 1, 2, 3]);
  });

  it("非相关度排序不会修改原数组顺序", () => {
    const movies = [
      createMovie({ id: 1, title: "A", voteAverage: 7 }),
      createMovie({ id: 2, title: "B", voteAverage: 8 }),
      createMovie({ id: 3, title: "C", voteAverage: 6 }),
    ];
    const originalOrder = movies.map((movie) => movie.id);

    void sortHomeSearchMovies(movies, "voteAverage-desc");

    expect(movies.map((movie) => movie.id)).toEqual(originalOrder);
  });
});
