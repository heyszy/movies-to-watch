import { z } from "zod";

export interface MovieDetailItem {
  id: number;
  title: string;
  originalTitle: string;
  overview: string;
  posterPath: string | null;
  posterUrl: string | null;
  backdropPath: string | null;
  backdropUrl: string | null;
  releaseDate: string | null;
  voteAverage: number;
  voteCount: number;
  popularity: number;
  runtime: number | null;
  tagline: string;
  status: string;
  genres: Array<{ id: number; name: string }>;
  originalLanguage: string;
  adult: boolean;
}

export interface MovieDetailResponse {
  movie: MovieDetailItem;
  isFallbackData: boolean;
}

export interface MovieCreditPerson {
  id: number;
  name: string;
  originalName: string;
  profilePath: string | null;
  profileUrl: string | null;
}

export interface MovieCastItem extends MovieCreditPerson {
  castId: number | null;
  character: string;
  order: number;
}

export interface MovieCrewItem extends MovieCreditPerson {
  department: string;
  job: string;
}

export interface MovieCreditsResponse {
  movieId: number;
  cast: MovieCastItem[];
  crew: MovieCrewItem[];
  directors: MovieCrewItem[];
  invalidCastCount: number;
  invalidCrewCount: number;
}

export interface MovieVideoItem {
  id: string;
  key: string;
  name: string;
  site: string;
  type: string;
  official: boolean;
  publishedAt: string | null;
  url: string | null;
}

export interface MovieVideosResponse {
  movieId: number;
  results: MovieVideoItem[];
  trailer: MovieVideoItem | null;
  invalidCount: number;
}

export interface MovieReviewItem {
  id: string;
  author: string;
  username: string;
  content: string;
  createdAt: string | null;
  updatedAt: string | null;
  url: string | null;
  rating: number | null;
  avatarPath: string | null;
  avatarUrl: string | null;
}

export interface MovieReviewsResponse {
  movieId: number;
  page: number;
  totalPages: number;
  totalResults: number;
  invalidCount: number;
  results: MovieReviewItem[];
}

interface AdaptReviewsOptions {
  movieIdFallback: number;
  pageFallback: number;
}

const rawGenreSchema = z
  .object({
    id: z.coerce.number(),
    name: z.string().optional(),
  })
  .loose();

const rawMovieDetailSchema = z
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
    runtime: z.number().nullable().optional(),
    tagline: z.string().optional(),
    status: z.string().optional(),
    genres: z.array(rawGenreSchema).optional(),
    original_language: z.string().optional(),
    adult: z.boolean().optional(),
  })
  .loose();

const rawCreditsSchema = z
  .object({
    id: z.coerce.number().optional(),
    cast: z.unknown().optional(),
    crew: z.unknown().optional(),
  })
  .loose();

const rawCastItemSchema = z
  .object({
    id: z.coerce.number(),
    cast_id: z.coerce.number().optional(),
    name: z.string().optional(),
    original_name: z.string().optional(),
    character: z.string().optional(),
    profile_path: z.string().nullable().optional(),
    order: z.coerce.number().optional(),
  })
  .loose();

const rawCrewItemSchema = z
  .object({
    id: z.coerce.number(),
    name: z.string().optional(),
    original_name: z.string().optional(),
    department: z.string().optional(),
    job: z.string().optional(),
    profile_path: z.string().nullable().optional(),
  })
  .loose();

const rawVideosSchema = z
  .object({
    id: z.coerce.number().optional(),
    results: z.unknown().optional(),
  })
  .loose();

const rawVideoItemSchema = z
  .object({
    id: z.string(),
    key: z.string(),
    name: z.string().optional(),
    site: z.string().optional(),
    type: z.string().optional(),
    official: z.boolean().optional(),
    published_at: z.string().optional(),
  })
  .loose();

const rawReviewsSchema = z
  .object({
    id: z.coerce.number().optional(),
    page: z.coerce.number().optional(),
    total_pages: z.coerce.number().optional(),
    total_results: z.coerce.number().optional(),
    results: z.unknown().optional(),
  })
  .loose();

const rawReviewItemSchema = z
  .object({
    id: z.string(),
    author: z.string().optional(),
    content: z.string().optional(),
    created_at: z.string().optional(),
    updated_at: z.string().optional(),
    url: z.string().nullable().optional(),
    author_details: z
      .object({
        username: z.string().optional(),
        avatar_path: z.string().nullable().optional(),
        rating: z.number().nullable().optional(),
      })
      .optional(),
  })
  .loose();

/**
 * TMDB 的图片字段只返回 path，这里统一拼成完整 URL。
 */
function buildImageUrl(
  imagePath: string | null | undefined,
  size: "w185" | "w500" | "w780" = "w500",
): string | null {
  if (!imagePath) {
    return null;
  }

  const imageBaseUrl =
    process.env.TMDB_IMAGE_BASE_URL?.trim() || "https://image.tmdb.org/t/p";
  return `${imageBaseUrl}/${size}${imagePath}`;
}

/**
 * 部分接口偶发把数组字段返回成对象，这里统一归一化成数组。
 */
function normalizeCollection(value: unknown): unknown[] {
  if (Array.isArray(value)) {
    return value;
  }

  if (value && typeof value === "object") {
    return Object.values(value as Record<string, unknown>);
  }

  return [];
}

function pickMovieTitle(
  movie: Pick<
    z.infer<typeof rawMovieDetailSchema>,
    "title" | "name" | "original_title"
  >,
): string {
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

function buildVideoUrl(site: string, key: string): string | null {
  if (site === "YouTube") {
    return `https://www.youtube.com/watch?v=${key}`;
  }

  if (site === "Vimeo") {
    return `https://vimeo.com/${key}`;
  }

  return null;
}

function buildAvatarUrl(avatarPath: string | null | undefined): string | null {
  if (!avatarPath) {
    return null;
  }

  if (avatarPath.startsWith("/http")) {
    return avatarPath.slice(1);
  }

  if (avatarPath.startsWith("http://") || avatarPath.startsWith("https://")) {
    return avatarPath;
  }

  return buildImageUrl(avatarPath, "w185");
}

function pickPrimaryTrailer(videos: MovieVideoItem[]): MovieVideoItem | null {
  const officialTrailer = videos.find(
    (video) =>
      video.site === "YouTube" && video.type === "Trailer" && video.official,
  );
  if (officialTrailer) {
    return officialTrailer;
  }

  const trailer = videos.find(
    (video) => video.site === "YouTube" && video.type === "Trailer",
  );
  if (trailer) {
    return trailer;
  }

  const teaser = videos.find(
    (video) => video.site === "YouTube" && video.type === "Teaser",
  );
  return teaser ?? null;
}

export function adaptMovieDetailResponse(
  rawResponse: unknown,
  movieIdFallback: number,
): MovieDetailResponse {
  const parsed = rawMovieDetailSchema.safeParse(rawResponse);

  if (!parsed.success) {
    return {
      movie: {
        id: movieIdFallback,
        title: "未知片名",
        originalTitle: "",
        overview: "",
        posterPath: null,
        posterUrl: null,
        backdropPath: null,
        backdropUrl: null,
        releaseDate: null,
        voteAverage: 0,
        voteCount: 0,
        popularity: 0,
        runtime: null,
        tagline: "",
        status: "",
        genres: [],
        originalLanguage: "",
        adult: false,
      },
      isFallbackData: true,
    };
  }

  const movie = parsed.data;
  const genres = (movie.genres ?? []).map((genre) => ({
    id: genre.id,
    name: genre.name?.trim() || "",
  }));

  return {
    movie: {
      id: movie.id,
      title: pickMovieTitle(movie),
      originalTitle: movie.original_title?.trim() || "",
      overview: movie.overview?.trim() || "",
      posterPath: movie.poster_path ?? null,
      posterUrl: buildImageUrl(movie.poster_path, "w500"),
      backdropPath: movie.backdrop_path ?? null,
      backdropUrl: buildImageUrl(movie.backdrop_path, "w780"),
      releaseDate: movie.release_date?.trim() || null,
      voteAverage: Number(movie.vote_average ?? 0),
      voteCount: Number(movie.vote_count ?? 0),
      popularity: Number(movie.popularity ?? 0),
      runtime: movie.runtime ?? null,
      tagline: movie.tagline?.trim() || "",
      status: movie.status?.trim() || "",
      genres,
      originalLanguage: movie.original_language ?? "",
      adult: movie.adult ?? false,
    },
    isFallbackData: false,
  };
}

export function adaptMovieCreditsResponse(
  rawResponse: unknown,
  movieIdFallback: number,
): MovieCreditsResponse {
  const parsed = rawCreditsSchema.safeParse(rawResponse);

  if (!parsed.success) {
    return {
      movieId: movieIdFallback,
      cast: [],
      crew: [],
      directors: [],
      invalidCastCount: 0,
      invalidCrewCount: 0,
    };
  }

  const castSource = normalizeCollection(parsed.data.cast);
  const crewSource = normalizeCollection(parsed.data.crew);
  const cast: MovieCastItem[] = [];
  const crew: MovieCrewItem[] = [];
  let invalidCastCount = 0;
  let invalidCrewCount = 0;

  for (const rawCast of castSource) {
    const parsedCast = rawCastItemSchema.safeParse(rawCast);
    if (!parsedCast.success) {
      invalidCastCount += 1;
      continue;
    }

    const castItem = parsedCast.data;
    cast.push({
      id: castItem.id,
      castId: castItem.cast_id ?? null,
      name: castItem.name?.trim() || "未知演员",
      originalName: castItem.original_name?.trim() || "",
      character: castItem.character?.trim() || "",
      profilePath: castItem.profile_path ?? null,
      profileUrl: buildImageUrl(castItem.profile_path, "w185"),
      order: castItem.order ?? 0,
    });
  }

  for (const rawCrew of crewSource) {
    const parsedCrew = rawCrewItemSchema.safeParse(rawCrew);
    if (!parsedCrew.success) {
      invalidCrewCount += 1;
      continue;
    }

    const crewItem = parsedCrew.data;
    crew.push({
      id: crewItem.id,
      name: crewItem.name?.trim() || "未知主创",
      originalName: crewItem.original_name?.trim() || "",
      department: crewItem.department?.trim() || "",
      job: crewItem.job?.trim() || "",
      profilePath: crewItem.profile_path ?? null,
      profileUrl: buildImageUrl(crewItem.profile_path, "w185"),
    });
  }

  const directors = crew.filter((item) => item.job === "Director");

  return {
    movieId: parsed.data.id ?? movieIdFallback,
    cast,
    crew,
    directors,
    invalidCastCount,
    invalidCrewCount,
  };
}

export function adaptMovieVideosResponse(
  rawResponse: unknown,
  movieIdFallback: number,
): MovieVideosResponse {
  const parsed = rawVideosSchema.safeParse(rawResponse);

  if (!parsed.success) {
    return {
      movieId: movieIdFallback,
      results: [],
      trailer: null,
      invalidCount: 0,
    };
  }

  const source = normalizeCollection(parsed.data.results);
  const results: MovieVideoItem[] = [];
  let invalidCount = 0;

  for (const rawVideo of source) {
    const parsedVideo = rawVideoItemSchema.safeParse(rawVideo);
    if (!parsedVideo.success) {
      invalidCount += 1;
      continue;
    }

    const video = parsedVideo.data;
    const site = video.site?.trim() || "";
    const type = video.type?.trim() || "";

    results.push({
      id: video.id,
      key: video.key,
      name: video.name?.trim() || "",
      site,
      type,
      official: video.official ?? false,
      publishedAt: video.published_at?.trim() || null,
      url: buildVideoUrl(site, video.key),
    });
  }

  return {
    movieId: parsed.data.id ?? movieIdFallback,
    results,
    trailer: pickPrimaryTrailer(results),
    invalidCount,
  };
}

export function adaptMovieReviewsResponse(
  rawResponse: unknown,
  options: AdaptReviewsOptions,
): MovieReviewsResponse {
  const parsed = rawReviewsSchema.safeParse(rawResponse);

  if (!parsed.success) {
    return {
      movieId: options.movieIdFallback,
      page: options.pageFallback,
      totalPages: 0,
      totalResults: 0,
      invalidCount: 0,
      results: [],
    };
  }

  const source = normalizeCollection(parsed.data.results);
  const results: MovieReviewItem[] = [];
  let invalidCount = 0;

  for (const rawReview of source) {
    const parsedReview = rawReviewItemSchema.safeParse(rawReview);
    if (!parsedReview.success) {
      invalidCount += 1;
      continue;
    }

    const review = parsedReview.data;

    results.push({
      id: review.id,
      author: review.author?.trim() || "匿名用户",
      username: review.author_details?.username?.trim() || "",
      content: review.content?.trim() || "",
      createdAt: review.created_at?.trim() || null,
      updatedAt: review.updated_at?.trim() || null,
      url: review.url ?? null,
      rating:
        typeof review.author_details?.rating === "number"
          ? review.author_details.rating
          : null,
      avatarPath: review.author_details?.avatar_path ?? null,
      avatarUrl: buildAvatarUrl(review.author_details?.avatar_path),
    });
  }

  return {
    movieId: parsed.data.id ?? options.movieIdFallback,
    page: parsed.data.page ?? options.pageFallback,
    totalPages: parsed.data.total_pages ?? 0,
    totalResults: parsed.data.total_results ?? results.length,
    invalidCount,
    results,
  };
}
