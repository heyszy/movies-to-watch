import { z } from "zod";

export interface MovieListItem {
  id: number;
  title: string;
  overview: string;
  posterPath: string | null;
  posterUrl: string | null;
  backdropPath: string | null;
  backdropUrl: string | null;
  releaseDate: string | null;
  voteAverage: number;
  voteCount: number;
  popularity: number;
  genreIds: number[];
  originalLanguage: string;
  adult: boolean;
}

export interface MovieListResponse {
  source: "search" | "trending";
  query: string;
  page: number;
  totalPages: number;
  totalResults: number;
  invalidCount: number;
  results: MovieListItem[];
}

interface AdaptMovieListOptions {
  source: "search" | "trending";
  query?: string;
  pageFallback: number;
}

const rawListSchema = z
  .object({
    page: z.coerce.number().optional(),
    total_pages: z.coerce.number().optional(),
    total_results: z.coerce.number().optional(),
    results: z.unknown().optional(),
  })
  .loose();

const genreIdSchema = z.union([
  z.number().int().positive(),
  z
    .string()
    .trim()
    .regex(/^\d+$/)
    .transform((value) => Number(value)),
]);

const rawMovieSchema = z
  .object({
    id: z.coerce.number(),
    title: z.string().optional(),
    name: z.string().optional(),
    original_title: z.string().optional(),
    overview: z.string().optional(),
    poster_path: z.string().nullable().optional(),
    backdrop_path: z.string().nullable().optional(),
    release_date: z.string().optional(),
    vote_average: z.number().optional(),
    vote_count: z.number().optional(),
    popularity: z.number().optional(),
    genre_ids: z.unknown().optional(),
    original_language: z.string().optional(),
    adult: z.boolean().optional(),
  })
  .loose();

/**
 * 兼容后端不稳定场景：
 * - 正常是数组，直接返回
 * - 其他类型则视为空数据
 */
function normalizeResultsCollection(results: unknown): unknown[] {
  if (Array.isArray(results)) {
    return results;
  }

  return [];
}

/**
 * 列表接口中的 genre_ids 可能偶发异常：
 * - 非数组 => []
 * - 数组中非数字项 => 跳过
 */
function normalizeGenreIds(genreIds: unknown): number[] {
  if (!Array.isArray(genreIds)) {
    return [];
  }

  const normalized: number[] = [];

  for (const rawId of genreIds) {
    const parsedId = genreIdSchema.safeParse(rawId);
    if (!parsedId.success) {
      continue;
    }
    normalized.push(parsedId.data);
  }

  return normalized;
}

/**
 * 统一拼接 TMDB 图片 URL，前端只要拿稳定 URL，不需要关心 path 拼接细节。
 */
function buildImageUrl(
  imagePath: string | null | undefined,
  size: "w500" | "w780" = "w500",
): string | null {
  if (!imagePath) {
    return null;
  }

  const imageBaseUrl =
    process.env.TMDB_IMAGE_BASE_URL?.trim() || "https://image.tmdb.org/t/p";
  return `${imageBaseUrl}/${size}${imagePath}`;
}

function pickMovieTitle(movie: z.infer<typeof rawMovieSchema>): string {
  if (movie.title?.trim()) {
    return movie.title.trim();
  }

  if (movie.name?.trim()) {
    return movie.name.trim();
  }

  if (movie.original_title?.trim()) {
    return movie.original_title.trim();
  }

  return "未知片名";
}

export function adaptMovieListResponse(
  rawResponse: unknown,
  options: AdaptMovieListOptions,
): MovieListResponse {
  const parsedList = rawListSchema.safeParse(rawResponse);

  if (!parsedList.success) {
    return {
      source: options.source,
      query: options.query?.trim() || "",
      page: options.pageFallback,
      totalPages: 0,
      totalResults: 0,
      invalidCount: 0,
      results: [],
    };
  }

  const rawResults = normalizeResultsCollection(parsedList.data.results);
  const results: MovieListItem[] = [];
  let invalidCount = 0;

  for (const rawMovie of rawResults) {
    const parsedMovie = rawMovieSchema.safeParse(rawMovie);

    if (!parsedMovie.success) {
      invalidCount += 1;
      continue;
    }

    const movie = parsedMovie.data;

    results.push({
      id: movie.id,
      title: pickMovieTitle(movie),
      overview: movie.overview?.trim() || "",
      posterPath: movie.poster_path ?? null,
      posterUrl: buildImageUrl(movie.poster_path, "w500"),
      backdropPath: movie.backdrop_path ?? null,
      backdropUrl: buildImageUrl(movie.backdrop_path, "w780"),
      releaseDate: movie.release_date?.trim() || null,
      voteAverage: Number(movie.vote_average ?? 0),
      voteCount: Number(movie.vote_count ?? 0),
      popularity: Number(movie.popularity ?? 0),
      genreIds: normalizeGenreIds(movie.genre_ids),
      originalLanguage: movie.original_language ?? "",
      adult: movie.adult ?? false,
    });
  }

  return {
    source: options.source,
    query: options.query?.trim() || "",
    page: parsedList.data.page ?? options.pageFallback,
    totalPages: parsedList.data.total_pages ?? 0,
    totalResults: parsedList.data.total_results ?? results.length,
    invalidCount,
    results,
  };
}
