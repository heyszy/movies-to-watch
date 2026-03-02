"use client";

import { Button } from "@base-ui/react/button";
import { MediaVideoList } from "iconoir-react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { useInView } from "react-intersection-observer";
import { BackToTopButton } from "./components/back-to-top-button";
import { HomeFeedback } from "./components/home-feedback";
import { HomeSearchBar } from "./components/home-search-bar";
import { HomeSortSelect } from "./components/home-sort-select";
import { MovieGrid, MovieGridSkeleton } from "./components/movie-grid";
import { useHomeMovies } from "./hooks/use-home-movies";
import {
  type HomeSearchSortKey,
  sortHomeSearchMovies,
} from "./lib/home-movie-sort";

export function HomePage() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const initialKeyword = searchParams.get("q")?.trim() ?? "";
  const [keyword, setKeyword] = useState(initialKeyword);
  const [searchSortKey, setSearchSortKey] =
    useState<HomeSearchSortKey>("relevance");
  const { ref: loadMoreRef, inView } = useInView({
    rootMargin: "560px 0px",
  });

  const {
    keyword: debouncedKeyword,
    movies,
    totalResults,
    source,
    hasNextPage,
    isPending,
    isFetching,
    isFetchingNextPage,
    isError,
    errorMessage,
    fetchNextPage,
    refetch,
  } = useHomeMovies(keyword);

  /**
   * URL 变化时同步输入框：
   * 支持用户通过前进/后退或直接带 query 链接进入页面。
   */
  useEffect(() => {
    const nextKeyword = searchParams.get("q")?.trim() ?? "";
    setKeyword((currentKeyword) => {
      return currentKeyword === nextKeyword ? currentKeyword : nextKeyword;
    });
  }, [searchParams]);

  /**
   * 把“当前已生效的关键词”写回 URL：
   * - 使用 replace 避免每次输入都新增历史记录
   * - scroll: false 避免更新 query 时页面跳动
   */
  useEffect(() => {
    const currentKeywordInUrl = searchParams.get("q")?.trim() ?? "";
    if (currentKeywordInUrl === debouncedKeyword) {
      return;
    }

    const nextSearchParams = new URLSearchParams(searchParams.toString());

    if (debouncedKeyword) {
      nextSearchParams.set("q", debouncedKeyword);
    } else {
      nextSearchParams.delete("q");
    }

    const nextQuery = nextSearchParams.toString();
    const nextUrl = nextQuery ? `${pathname}?${nextQuery}` : pathname;
    router.replace(nextUrl, { scroll: false });
  }, [debouncedKeyword, pathname, router, searchParams]);

  useEffect(() => {
    /**
     * 当“加载更多”锚点进入可视区时自动拉取下一页。
     * 为避免重复触发，这里显式拦截正在请求、无下一页、或当前整体报错的场景。
     */
    if (!inView || !hasNextPage || isFetchingNextPage || isError) {
      return;
    }

    void fetchNextPage();
  }, [fetchNextPage, hasNextPage, inView, isError, isFetchingNextPage]);

  /**
   * 排序仅作用于“搜索结果”：
   * - 相关度保持 TMDB 返回顺序
   */
  const displayMovies = useMemo(() => {
    if (source !== "search") {
      return movies;
    }

    return sortHomeSearchMovies(movies, searchSortKey);
  }, [movies, searchSortKey, source]);

  const hasMovies = movies.length > 0;
  const showSkeleton = isPending && !hasMovies;
  const showError = isError && !hasMovies;
  const showEmpty = !isPending && !isError && !hasMovies;

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-300 flex-col px-4 pb-14 pt-8 sm:px-6 lg:px-10">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-4xl font-bold tracking-tight text-slate-900 sm:text-5xl">
          Movies To Watch
        </h1>
        <Link
          href="/watchlist"
          className="inline-flex min-h-11 items-center rounded-2xl border border-slate-200 bg-white px-4 text-sm font-medium text-slate-700 hover:bg-slate-100 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-slate-200"
        >
          <MediaVideoList className="mr-2" />
          待看清单
        </Link>
      </header>

      <div className="mt-8">
        <HomeSearchBar
          keyword={keyword}
          totalResults={totalResults}
          source={source}
          isLoading={isFetching && !isFetchingNextPage}
          onKeywordChange={setKeyword}
          onKeywordClear={() => {
            setKeyword("");
          }}
        />
      </div>

      {source === "search" && hasMovies ? (
        <div className="mt-4">
          <HomeSortSelect
            value={searchSortKey}
            onValueChange={setSearchSortKey}
          />
        </div>
      ) : null}

      <section className="mt-8" aria-label="电影列表区域">
        {showSkeleton ? <MovieGridSkeleton /> : null}

        {showError ? (
          <HomeFeedback
            title="电影列表加载失败"
            description={errorMessage}
            actionLabel="重新加载"
            onAction={() => {
              void refetch();
            }}
          />
        ) : null}

        {showEmpty ? (
          <HomeFeedback
            title="没有找到匹配结果"
            description={
              debouncedKeyword
                ? `当前关键词“${debouncedKeyword}”暂无结果。`
                : "暂时没有可展示数据，请稍后刷新重试。"
            }
          />
        ) : null}

        {!showSkeleton && !showError && !showEmpty ? (
          <>
            <MovieGrid movies={displayMovies} />

            <div className="mt-8 flex justify-center">
              <output
                ref={loadMoreRef}
                className="inline-flex min-h-11 items-center rounded-2xl border border-slate-200 bg-white px-4 text-sm text-slate-600 shadow-sm"
                aria-live="polite"
              >
                {isFetchingNextPage
                  ? "正在加载更多电影..."
                  : hasNextPage
                    ? "继续下滑即可加载下一页"
                    : "已经到底了，去待看清单挑一部吧"}
              </output>
            </div>

            {isError ? (
              <div className="mt-4 flex justify-center">
                <Button
                  type="button"
                  onClick={() => {
                    void refetch();
                  }}
                  className="min-h-11 rounded-2xl border border-slate-300 bg-slate-100 px-5 text-sm font-medium text-slate-700 transition hover:bg-slate-200 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-slate-200"
                >
                  加载更多失败，点击重试
                </Button>
              </div>
            ) : null}
          </>
        ) : null}
      </section>

      <BackToTopButton />
    </main>
  );
}
