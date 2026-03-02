"use client";

import { Button } from "@base-ui/react/button";

import type { WatchlistMovieInput } from "../lib/watchlist-movie";
import { useWatchlistStore } from "../store/use-watchlist-store";

interface WatchlistToggleButtonProps {
  movie: WatchlistMovieInput;
  className?: string;
}

export function WatchlistToggleButton({
  movie,
  className,
}: WatchlistToggleButtonProps) {
  const isInWatchlist = useWatchlistStore((state) =>
    state.items.some((item) => item.id === movie.id),
  );
  const addMovie = useWatchlistStore((state) => state.addMovie);
  const removeMovie = useWatchlistStore((state) => state.removeMovie);

  return (
    <Button
      type="button"
      className={className}
      onClick={() => {
        if (isInWatchlist) {
          removeMovie(movie.id);
          return;
        }

        addMovie(movie);
      }}
    >
      {isInWatchlist ? "移出待看" : "加入待看"}
    </Button>
  );
}
