"use client";

import { useInfiniteQuery } from "@tanstack/react-query";
import { useMemo } from "react";

import type {
  MovieListItem,
  MovieListResponse,
} from "@/shared/lib/movie-adapter";
import { fetchMovieListPage } from "../lib/fetch-movie-list-page";
import { useDebouncedValue } from "./use-debounced-value";

const FIRST_PAGE = 1;

interface UseHomeMoviesResult {
  keyword: string;
  movies: MovieListItem[];
  totalResults: number;
  source: MovieListResponse["source"];
  hasNextPage: boolean;
  isPending: boolean;
  isFetching: boolean;
  isFetchingNextPage: boolean;
  isError: boolean;
  errorMessage: string;
  fetchNextPage: () => Promise<unknown>;
  refetch: () => Promise<unknown>;
}

function mergeMoviePages(
  pages: MovieListResponse[] | undefined,
): MovieListItem[] {
  if (!pages?.length) {
    return [];
  }

  const seenIds = new Set<number>();
  const merged: MovieListItem[] = [];

  for (const page of pages) {
    for (const movie of page.results) {
      if (seenIds.has(movie.id)) {
        continue;
      }

      seenIds.add(movie.id);
      merged.push(movie);
    }
  }

  return merged;
}

/**
 * 管理首页列表数据：
 * - 默认趋势列表
 * - 搜索结果切换
 * - 无限滚动分页
 */
export function useHomeMovies(rawKeyword: string): UseHomeMoviesResult {
  const keyword = rawKeyword.trim();
  const debouncedKeyword = useDebouncedValue(keyword, 350);

  const query = useInfiniteQuery({
    queryKey: ["home-movies", debouncedKeyword],
    initialPageParam: FIRST_PAGE,
    queryFn: ({ pageParam, signal }) =>
      fetchMovieListPage({
        keyword: debouncedKeyword,
        page: pageParam,
        signal,
      }),
    getNextPageParam: (lastPage) => {
      if (lastPage.page >= lastPage.totalPages) {
        return undefined;
      }

      return lastPage.page + 1;
    },
  });

  const movies = useMemo(
    () => mergeMoviePages(query.data?.pages),
    [query.data?.pages],
  );
  const firstPage = query.data?.pages[0];

  return {
    keyword: debouncedKeyword,
    movies,
    totalResults: firstPage?.totalResults ?? 0,
    source: firstPage?.source ?? (debouncedKeyword ? "search" : "trending"),
    hasNextPage: Boolean(query.hasNextPage),
    isPending: query.isPending,
    isFetching: query.isFetching,
    isFetchingNextPage: query.isFetchingNextPage,
    isError: query.isError,
    errorMessage:
      query.error instanceof Error
        ? query.error.message
        : "请求失败，请稍后重试。",
    fetchNextPage: query.fetchNextPage,
    refetch: query.refetch,
  };
}
