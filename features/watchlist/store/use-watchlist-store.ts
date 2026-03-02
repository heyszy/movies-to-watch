"use client";

import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

import type {
  WatchlistMovie,
  WatchlistMovieInput,
} from "../lib/watchlist-movie";

const WATCHLIST_STORAGE_KEY = "movies-to-watch.watchlist.v1";

interface PersistedWatchlistState {
  items: WatchlistMovie[];
}

interface WatchlistStore {
  items: WatchlistMovie[];
  hasHydrated: boolean;
  storageError: string | null;
  setHydrated: (value: boolean) => void;
  setStorageError: (message: string | null) => void;
  addMovie: (movie: WatchlistMovieInput) => void;
  removeMovie: (movieId: number) => void;
  clearMovies: () => void;
}

function isValidMovie(item: unknown): item is WatchlistMovie {
  if (!item || typeof item !== "object") {
    return false;
  }

  const candidate = item as Partial<WatchlistMovie>;
  return (
    typeof candidate.id === "number" &&
    typeof candidate.title === "string" &&
    (typeof candidate.posterUrl === "string" || candidate.posterUrl === null) &&
    (typeof candidate.releaseDate === "string" ||
      candidate.releaseDate === null) &&
    typeof candidate.voteAverage === "number" &&
    typeof candidate.addedAt === "string"
  );
}

function sanitizePersistedItems(value: unknown): WatchlistMovie[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value.filter(isValidMovie);
}

/**
 * 统一管理待看清单：
 * - 去重写入
 * - 本地持久化
 * - hydration 状态暴露给页面，避免首屏闪烁
 */
export const useWatchlistStore = create<WatchlistStore>()(
  persist(
    (set) => ({
      items: [],
      hasHydrated: false,
      storageError: null,
      setHydrated: (value) => {
        set({ hasHydrated: value });
      },
      setStorageError: (message) => {
        set({ storageError: message });
      },
      addMovie: (movie) => {
        set((state) => {
          if (state.items.some((item) => item.id === movie.id)) {
            return state;
          }

          return {
            items: [
              {
                ...movie,
                addedAt: new Date().toISOString(),
              },
              ...state.items,
            ],
          };
        });
      },
      removeMovie: (movieId) => {
        set((state) => ({
          items: state.items.filter((item) => item.id !== movieId),
        }));
      },
      clearMovies: () => {
        set({ items: [] });
      },
    }),
    {
      name: WATCHLIST_STORAGE_KEY,
      storage: createJSONStorage(() => localStorage),
      partialize: (state): PersistedWatchlistState => ({
        items: state.items,
      }),
      merge: (persistedState, currentState) => {
        // 本地还没有写入过 key 时，persistedState 会是 undefined。
        const state = (persistedState ??
          {}) as Partial<PersistedWatchlistState>;
        const mergedItems = sanitizePersistedItems(state.items);

        return {
          ...currentState,
          items: mergedItems,
        };
      },
      onRehydrateStorage: () => (_state, error) => {
        if (!_state) {
          return;
        }

        if (error) {
          _state.clearMovies();
          _state.setStorageError("本地待看清单读取失败，请刷新后重试。");
          _state.setHydrated(true);
          return;
        }

        _state.setStorageError(null);
        _state.setHydrated(true);
      },
    },
  ),
);
