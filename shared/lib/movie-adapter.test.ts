import { describe, expect, it } from "vitest";

import { adaptMovieListResponse } from "./movie-adapter";

describe("adaptMovieListResponse", () => {
  it("顶层结构非法时返回兜底响应", () => {
    const response = adaptMovieListResponse(null, {
      source: "trending",
      pageFallback: 3,
    });

    expect(response).toEqual({
      source: "trending",
      query: "",
      page: 3,
      totalPages: 0,
      totalResults: 0,
      invalidCount: 0,
      results: [],
    });
  });

  it("会跳过数组中的不合法条目，并累计 invalidCount", () => {
    const response = adaptMovieListResponse(
      {
        page: "2",
        total_pages: "9",
        total_results: "3",
        results: [
          {
            id: "101",
            title: "  测试电影 A  ",
            overview: "  电影简介  ",
            poster_path: "/poster-a.jpg",
            backdrop_path: "/backdrop-a.jpg",
            release_date: " 2025-01-01 ",
            vote_average: 7.8,
            vote_count: 123,
            popularity: 88.6,
            genre_ids: [28, 12],
            original_language: "zh",
            adult: true,
          },
          {
            title: "没有 id 的脏数据",
          },
          {
            id: 103,
            name: "  备用片名  ",
          },
        ],
      },
      {
        source: "search",
        query: "  星际穿越  ",
        pageFallback: 1,
      },
    );

    expect(response.source).toBe("search");
    expect(response.query).toBe("星际穿越");
    expect(response.page).toBe(2);
    expect(response.totalPages).toBe(9);
    expect(response.totalResults).toBe(3);
    expect(response.invalidCount).toBe(1);
    expect(response.results).toHaveLength(2);

    expect(response.results[0]).toMatchObject({
      id: 101,
      title: "测试电影 A",
      overview: "电影简介",
      posterPath: "/poster-a.jpg",
      backdropPath: "/backdrop-a.jpg",
      releaseDate: "2025-01-01",
      voteAverage: 7.8,
      voteCount: 123,
      popularity: 88.6,
      genreIds: [28, 12],
      originalLanguage: "zh",
      adult: true,
    });
    expect(response.results[0].posterUrl).toContain("/w500/poster-a.jpg");
    expect(response.results[0].backdropUrl).toContain("/w780/backdrop-a.jpg");

    expect(response.results[1]).toMatchObject({
      id: 103,
      title: "备用片名",
      overview: "",
      releaseDate: null,
      voteAverage: 0,
      voteCount: 0,
      popularity: 0,
      genreIds: [],
      originalLanguage: "",
      adult: false,
    });
  });

  it("results 不是数组时按空数据处理", () => {
    const response = adaptMovieListResponse(
      {
        page: 1,
        total_results: 5,
        results: {
          first: {
            id: 1,
            title: "不会被读取",
          },
        },
      },
      {
        source: "trending",
        pageFallback: 1,
      },
    );

    expect(response.page).toBe(1);
    expect(response.totalResults).toBe(5);
    expect(response.invalidCount).toBe(0);
    expect(response.results).toEqual([]);
  });

  it("genre_ids 非数组时适配为空数组，且不影响该条电影保留", () => {
    const response = adaptMovieListResponse(
      {
        results: [
          {
            id: 201,
            title: "保留条目",
            genre_ids: {
              a: 1,
            },
          },
        ],
      },
      {
        source: "trending",
        pageFallback: 1,
      },
    );

    expect(response.invalidCount).toBe(0);
    expect(response.results).toHaveLength(1);
    expect(response.results[0]).toMatchObject({
      id: 201,
      genreIds: [],
    });
  });

  it("genre_ids 数组中的脏值会被过滤，仅保留可转数字项", () => {
    const response = adaptMovieListResponse(
      {
        results: [
          {
            id: 202,
            title: "过滤条目",
            genre_ids: ["12", 28, "bad-value", {}, null, true, "", []],
          },
        ],
      },
      {
        source: "search",
        query: "test",
        pageFallback: 1,
      },
    );

    expect(response.invalidCount).toBe(0);
    expect(response.results).toHaveLength(1);
    expect(response.results[0].genreIds).toEqual([12, 28]);
  });
});
