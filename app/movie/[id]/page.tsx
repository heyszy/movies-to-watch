import { notFound } from "next/navigation";

import { MovieDetailPage } from "@/features/movie-detail/movie-detail-page";
import { normalizeMovieId } from "@/shared/lib/api-route";

interface MoviePageProps {
  params: Promise<{ id: string }>;
}

/**
 * 路由层只负责参数解析与合法性兜底，业务渲染交给 feature 目录。
 */
export default async function Page({ params }: MoviePageProps) {
  const { id } = await params;
  const movieId = normalizeMovieId(id);

  if (!movieId) {
    notFound();
  }

  return <MovieDetailPage movieId={movieId} />;
}
