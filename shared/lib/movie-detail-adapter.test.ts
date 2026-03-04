import { describe, expect, it } from "vitest";

import {
  adaptMovieCreditsResponse,
  adaptMovieDetailResponse,
  adaptMovieReviewsResponse,
  adaptMovieVideosResponse,
} from "./movie-detail-adapter";

describe("adaptMovieDetailResponse", () => {
  it("顶层结构非法时返回 fallback 详情数据", () => {
    const response = adaptMovieDetailResponse("invalid", 42);

    expect(response.isFallbackData).toBe(true);
    expect(response.movie).toMatchObject({
      id: 42,
      title: "未知片名",
      posterUrl: null,
      backdropUrl: null,
      releaseDate: null,
      voteAverage: 0,
      genres: [],
    });
  });

  it("会对合法详情数据做字段映射和裁剪", () => {
    const response = adaptMovieDetailResponse(
      {
        id: "11",
        name: "  电影标题  ",
        original_title: "  Original Title  ",
        overview: "  这里是简介  ",
        poster_path: "/poster.jpg",
        backdrop_path: "/backdrop.jpg",
        release_date: " 2025-06-01 ",
        vote_average: 8.2,
        vote_count: 560,
        popularity: 96.5,
        runtime: 132,
        tagline: "  标语  ",
        status: " Released ",
        genres: [{ id: "28", name: " 动作 " }],
        original_language: "zh",
        adult: true,
      },
      1,
    );

    expect(response.isFallbackData).toBe(false);
    expect(response.movie).toMatchObject({
      id: 11,
      title: "电影标题",
      originalTitle: "Original Title",
      overview: "这里是简介",
      posterPath: "/poster.jpg",
      backdropPath: "/backdrop.jpg",
      releaseDate: "2025-06-01",
      voteAverage: 8.2,
      voteCount: 560,
      popularity: 96.5,
      runtime: 132,
      tagline: "标语",
      status: "Released",
      genres: [{ id: 28, name: "动作" }],
      originalLanguage: "zh",
      adult: true,
    });
    expect(response.movie.posterUrl).toContain("/w500/poster.jpg");
    expect(response.movie.backdropUrl).toContain("/w780/backdrop.jpg");
  });

  it("genres 不是数组时会适配为空数组，而不是整包 fallback", () => {
    const response = adaptMovieDetailResponse(
      {
        id: 88,
        title: "测试电影",
        genres: {
          a: {
            id: 1,
            name: "动作",
          },
        },
      },
      1,
    );

    expect(response.isFallbackData).toBe(false);
    expect(response.movie.id).toBe(88);
    expect(response.movie.genres).toEqual([]);
  });

  it("genres 数组中存在脏项时会跳过脏项，保留合法项", () => {
    const response = adaptMovieDetailResponse(
      {
        id: 99,
        title: "测试电影",
        genres: [
          {
            id: "12",
            name: "  冒险  ",
          },
          {
            name: "缺少 id 的脏项",
          },
          {
            id: true,
            name: "会被过滤",
          },
          {
            id: null,
            name: "会被过滤",
          },
        ],
      },
      1,
    );

    expect(response.isFallbackData).toBe(false);
    expect(response.movie.genres).toEqual([{ id: 12, name: "冒险" }]);
  });
});

describe("adaptMovieCreditsResponse", () => {
  it("顶层结构非法时返回空演职员数据", () => {
    const response = adaptMovieCreditsResponse(null, 99);

    expect(response).toEqual({
      movieId: 99,
      cast: [],
      crew: [],
      directors: [],
      invalidCastCount: 0,
      invalidCrewCount: 0,
    });
  });

  it("会处理 cast/crew 数组并统计无效数据，同时筛选导演", () => {
    const response = adaptMovieCreditsResponse(
      {
        cast: [
          {
            id: "1",
            cast_id: "101",
            name: "  演员甲  ",
            original_name: "  Actor A  ",
            character: "  主角  ",
            profile_path: "/cast-a.jpg",
            order: "2",
          },
          {
            name: "缺少 id",
          },
        ],
        crew: [
          {
            id: 2,
            name: " 导演乙 ",
            original_name: " Director B ",
            department: " Directing ",
            job: "Director",
            profile_path: "/crew-b.jpg",
          },
          {
            id: 3,
            name: " 编剧丙 ",
            department: " Writing ",
            job: "Writer",
          },
          {
            department: "Directing",
          },
        ],
      },
      77,
    );

    expect(response.movieId).toBe(77);
    expect(response.invalidCastCount).toBe(1);
    expect(response.invalidCrewCount).toBe(1);
    expect(response.cast).toHaveLength(1);
    expect(response.crew).toHaveLength(2);
    expect(response.directors).toHaveLength(1);

    expect(response.cast[0]).toMatchObject({
      id: 1,
      castId: 101,
      name: "演员甲",
      originalName: "Actor A",
      character: "主角",
      profilePath: "/cast-a.jpg",
      order: 2,
    });
    expect(response.cast[0].profileUrl).toContain("/w185/cast-a.jpg");

    expect(response.directors[0]).toMatchObject({
      id: 2,
      name: "导演乙",
      department: "Directing",
      job: "Director",
      profilePath: "/crew-b.jpg",
    });
    expect(response.directors[0].profileUrl).toContain("/w185/crew-b.jpg");
  });

  it("cast 或 crew 不是数组时会适配为空数组", () => {
    const response = adaptMovieCreditsResponse(
      {
        id: 101,
        cast: {
          a: {
            id: 1,
            name: "不会被读取",
          },
        },
        crew: "invalid-crew",
      },
      77,
    );

    expect(response.movieId).toBe(101);
    expect(response.cast).toEqual([]);
    expect(response.crew).toEqual([]);
    expect(response.directors).toEqual([]);
    expect(response.invalidCastCount).toBe(0);
    expect(response.invalidCrewCount).toBe(0);
  });
});

describe("adaptMovieVideosResponse", () => {
  it("顶层结构非法时返回空视频数据", () => {
    const response = adaptMovieVideosResponse(undefined, 501);

    expect(response).toEqual({
      movieId: 501,
      results: [],
      trailer: null,
      invalidCount: 0,
    });
  });

  it("会处理视频数组、跳过无效条目并优先选择官方 Trailer", () => {
    const response = adaptMovieVideosResponse(
      {
        id: 66,
        results: [
          {
            id: "v1",
            key: "key-unofficial",
            name: " 非官方预告 ",
            site: "YouTube",
            type: "Trailer",
            official: false,
            published_at: " 2025-01-01 ",
          },
          {
            id: "v2",
            key: "key-official",
            name: " 官方预告 ",
            site: "YouTube",
            type: "Trailer",
            official: true,
          },
          {
            id: "v3",
            key: "vimeo-1",
            name: " Vimeo Teaser ",
            site: "Vimeo",
            type: "Teaser",
          },
          {
            name: "缺少 id 和 key",
          },
        ],
      },
      1,
    );

    expect(response.movieId).toBe(66);
    expect(response.invalidCount).toBe(1);
    expect(response.results).toHaveLength(3);
    expect(response.trailer?.id).toBe("v2");
    expect(response.trailer?.url).toBe(
      "https://www.youtube.com/watch?v=key-official",
    );

    const vimeoVideo = response.results.find((item) => item.id === "v3");
    expect(vimeoVideo?.url).toBe("https://vimeo.com/vimeo-1");
  });

  it("results 不是数组时会适配为空数组", () => {
    const response = adaptMovieVideosResponse(
      {
        id: 70,
        results: {
          a: {
            id: "v1",
            key: "key1",
          },
        },
      },
      1,
    );

    expect(response.movieId).toBe(70);
    expect(response.results).toEqual([]);
    expect(response.trailer).toBeNull();
    expect(response.invalidCount).toBe(0);
  });
});

describe("adaptMovieReviewsResponse", () => {
  it("顶层结构非法时返回空评论数据", () => {
    const response = adaptMovieReviewsResponse(1, {
      movieIdFallback: 90,
      pageFallback: 3,
    });

    expect(response).toEqual({
      movieId: 90,
      page: 3,
      totalPages: 0,
      totalResults: 0,
      invalidCount: 0,
      results: [],
    });
  });

  it("会处理评论数组、头像 URL 规则并跳过无效条目", () => {
    const response = adaptMovieReviewsResponse(
      {
        page: "2",
        total_pages: "5",
        results: [
          {
            id: "r1",
            author: "  张三  ",
            content: "  第一条评论  ",
            created_at: " 2025-01-01 ",
            updated_at: " 2025-01-02 ",
            url: "https://example.com/r1",
            author_details: {
              username: "  user1  ",
              avatar_path: "/http://avatar.example/a.png",
              rating: 8,
            },
          },
          {
            id: "r2",
            author_details: {
              username: "user2",
              avatar_path: "https://avatar.example/b.png",
              rating: null,
            },
          },
          {
            id: "r3",
            author_details: {
              avatar_path: "/avatar-c.jpg",
            },
          },
          {
            author: "缺少 id",
          },
        ],
      },
      {
        movieIdFallback: 77,
        pageFallback: 1,
      },
    );

    expect(response.movieId).toBe(77);
    expect(response.page).toBe(2);
    expect(response.totalPages).toBe(5);
    expect(response.totalResults).toBe(3);
    expect(response.invalidCount).toBe(1);
    expect(response.results).toHaveLength(3);

    expect(response.results[0]).toMatchObject({
      id: "r1",
      author: "张三",
      username: "user1",
      content: "第一条评论",
      createdAt: "2025-01-01",
      updatedAt: "2025-01-02",
      url: "https://example.com/r1",
      rating: 8,
      avatarPath: "/http://avatar.example/a.png",
      avatarUrl: "http://avatar.example/a.png",
    });

    expect(response.results[1]).toMatchObject({
      id: "r2",
      author: "匿名用户",
      username: "user2",
      rating: null,
      avatarPath: "https://avatar.example/b.png",
      avatarUrl: "https://avatar.example/b.png",
    });

    expect(response.results[2]).toMatchObject({
      id: "r3",
      avatarPath: "/avatar-c.jpg",
    });
    expect(response.results[2].avatarUrl).toContain("/w185/avatar-c.jpg");
  });

  it("results 不是数组时会适配为空数组", () => {
    const response = adaptMovieReviewsResponse(
      {
        id: 301,
        page: 2,
        total_pages: 4,
        total_results: 9,
        results: {
          a: {
            id: "r1",
            author: "不会被读取",
          },
        },
      },
      {
        movieIdFallback: 77,
        pageFallback: 1,
      },
    );

    expect(response.movieId).toBe(301);
    expect(response.page).toBe(2);
    expect(response.totalPages).toBe(4);
    expect(response.totalResults).toBe(9);
    expect(response.results).toEqual([]);
    expect(response.invalidCount).toBe(0);
  });
});
