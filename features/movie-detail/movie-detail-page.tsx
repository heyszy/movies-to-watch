import { Garage, MediaVideoList } from "iconoir-react";
import Link from "next/link";
import { MovieCreditPanel } from "./components/movie-credit-panel";
import { MovieOverviewPanel } from "./components/movie-overview-panel";
import { MovieReviewPanel } from "./components/movie-review-panel";
import { fetchMovieDetailPage } from "./lib/fetch-movie-detail-page";

interface MovieDetailPageProps {
  movieId: number;
}

function FullPageError({
  movieId,
  message,
}: {
  movieId: number;
  message: string;
}) {
  return (
    <main className="mx-auto flex min-h-screen w-full max-w-300 flex-col px-4 pb-14 pt-8 sm:px-6 lg:px-10">
      <header className="flex flex-wrap items-center gap-3">
        <Link
          href="/"
          className="inline-flex min-h-10 w-fit items-center rounded-2xl border border-slate-200 bg-white px-4 text-sm font-medium text-slate-700 shadow-sm transition hover:bg-slate-100 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-slate-200"
        >
          <Garage className="mr-2" />
          返回首页
        </Link>
        <Link
          href="/watchlist"
          className="inline-flex min-h-10 w-fit items-center rounded-2xl border border-slate-200 bg-white px-4 text-sm font-medium text-slate-700 hover:bg-slate-100 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-slate-200"
        >
          <MediaVideoList className="mr-2" />
          待看清单
        </Link>
      </header>

      <section className="mt-8 rounded-3xl bg-white px-6 py-10 shadow-sm">
        <h1 className="text-2xl font-semibold text-slate-900">详情加载失败</h1>
        <p className="mt-4 text-sm leading-7 text-slate-600">{message}</p>
        <p className="mt-2 text-xs text-slate-500">电影 ID：{movieId}</p>
      </section>
    </main>
  );
}

export async function MovieDetailPage({ movieId }: MovieDetailPageProps) {
  /**
   * 页面首屏并行拉取四块数据；即使局部失败，也能用可用数据先完成渲染。
   */
  const detailData = await fetchMovieDetailPage(movieId);
  const detailMessage = detailData.errors.detail;

  if (!detailData.detail) {
    return (
      <FullPageError
        movieId={movieId}
        message={detailMessage ?? "电影详情暂时不可用，请稍后重试。"}
      />
    );
  }

  const movie = detailData.detail.movie;
  const trailerUrl = detailData.videos?.trailer?.url ?? null;
  const directors =
    detailData.credits?.directors.map((item) => item.name) ?? [];

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-300 flex-col px-4 pb-14 pt-8 sm:px-6 lg:px-10">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <Link
          href="/"
          className="inline-flex min-h-10 items-center rounded-2xl border border-slate-200 bg-white px-4 text-sm font-medium text-slate-700 hover:bg-slate-100 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-slate-200"
        >
          <Garage className="mr-2" />
          返回首页
        </Link>
        <Link
          href="/watchlist"
          className="inline-flex min-h-10 items-center rounded-2xl border border-slate-200 bg-white px-4 text-sm font-medium text-slate-700 hover:bg-slate-100 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-slate-200"
        >
          <MediaVideoList className="mr-2" />
          待看清单
        </Link>
      </header>

      <div className="mt-6">
        <MovieOverviewPanel
          movie={movie}
          directors={directors}
          trailerUrl={trailerUrl}
        />
      </div>

      <div className="mt-6">
        <MovieCreditPanel
          credits={detailData.credits}
          errorMessage={detailData.errors.credits}
        />
      </div>

      <div className="mt-6">
        <MovieReviewPanel
          reviews={detailData.reviews}
          errorMessage={detailData.errors.reviews}
        />
      </div>
    </main>
  );
}
