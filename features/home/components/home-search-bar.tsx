"use client";

import { Button } from "@base-ui/react/button";
import { Field } from "@base-ui/react/field";
import { Input } from "@base-ui/react/input";
import { Xmark } from "iconoir-react";

interface HomeSearchBarProps {
  keyword: string;
  totalResults: number;
  source: "search" | "trending";
  isLoading: boolean;
  onKeywordChange: (value: string) => void;
  onKeywordClear: () => void;
}

export function HomeSearchBar({
  keyword,
  totalResults,
  source,
  isLoading,
  onKeywordChange,
  onKeywordClear,
}: HomeSearchBarProps) {
  const modeLabel = source === "search" ? "搜索结果" : "本周趋势";

  return (
    <section aria-label="电影搜索">
      <Field.Root className="flex flex-col gap-3">
        <div className="relative">
          <Input
            value={keyword}
            onChange={(event) => {
              onKeywordChange(event.currentTarget.value);
            }}
            placeholder="输入片名，例如：盗梦空间"
            aria-label="输入电影关键词"
            className="h-12 w-full rounded-2xl border border-gray-200 bg-white px-4 pr-12 text-base text-slate-900 outline-none transition"
          />

          {keyword.length > 0 ? (
            <Button
              type="button"
              onClick={onKeywordClear}
              aria-label="清空关键词"
              className="absolute right-2 top-1/2 inline-flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full text-slate-500 transition hover:bg-slate-100 hover:text-slate-700 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-slate-200"
            >
              <Xmark />
            </Button>
          ) : null}
        </div>
      </Field.Root>
      <div className="mt-4 text-sm text-slate-600" aria-live="polite">
        {source === "search" &&
          !isLoading &&
          `${modeLabel}：${totalResults.toLocaleString("zh-CN")} 条`}
      </div>
    </section>
  );
}
