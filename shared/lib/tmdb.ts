import { z } from "zod";

const DEFAULT_TMDB_BASE_URL = "https://api.themoviedb.org/3";

/**
 * TMDB 请求参数支持的值类型。
 * 之所以收敛成这几种，是为了在拼接 URL 时能安全地过滤空值。
 */
type TmdbQueryValue = string | number | boolean | null | undefined;

export interface TmdbGetOptions {
  path: string;
  query?: Record<string, TmdbQueryValue>;
}

/**
 * 配置错误：例如没有提供 API 凭证。
 * 这类错误属于可预期错误，路由层可以返回 500 并提示配置缺失。
 */
export class TmdbConfigError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "TmdbConfigError";
  }
}

/**
 * 请求错误：TMDB 返回非 2xx 时统一包装，方便路由层做一致的错误响应。
 */
export class TmdbRequestError extends Error {
  statusCode: number;
  details?: unknown;

  constructor(message: string, statusCode: number, details?: unknown) {
    super(message);
    this.name = "TmdbRequestError";
    this.statusCode = statusCode;
    this.details = details;
  }
}

const tmdbErrorSchema = z
  .object({
    status_message: z.string().optional(),
    status_code: z.number().optional(),
    success: z.boolean().optional(),
  })
  .loose();

function resolveTmdbBaseUrl(): string {
  return process.env.TMDB_BASE_URL?.trim() || DEFAULT_TMDB_BASE_URL;
}

function resolveTmdbCredential(): string {
  const credential = process.env.TMDB_API_KEY?.trim();

  if (!credential) {
    throw new TmdbConfigError("未设置 TMDB_API_KEY，请先在 .env 文件中配置。");
  }

  return credential;
}

function appendQueryToUrl(
  url: URL,
  query: Record<string, TmdbQueryValue>,
): void {
  for (const [key, value] of Object.entries(query)) {
    if (value === null || value === undefined || value === "") {
      continue;
    }

    url.searchParams.set(key, String(value));
  }
}

export async function tmdbGet<T>(options: TmdbGetOptions): Promise<T> {
  const baseUrl = resolveTmdbBaseUrl();
  const credential = resolveTmdbCredential();
  const url = new URL(`${baseUrl}${options.path}`);
  const headers = new Headers({ Accept: "application/json" });

  if (options.query) {
    appendQueryToUrl(url, options.query);
  }

  headers.set("Authorization", `Bearer ${credential}`);

  const response = await fetch(url, {
    method: "GET",
    headers,
    cache: "no-store",
  });

  if (!response.ok) {
    let details: unknown;

    try {
      details = tmdbErrorSchema.parse(await response.json());
    } catch {
      details = undefined;
    }

    const message =
      details && typeof details === "object" && "status_message" in details
        ? String(details.status_message)
        : `TMDB 请求失败，HTTP ${response.status}`;

    throw new TmdbRequestError(message, response.status, details);
  }

  return (await response.json()) as T;
}
