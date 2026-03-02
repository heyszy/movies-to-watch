"use client";

import { Select } from "@base-ui/react/select";
import type { ComponentProps } from "react";

import {
  HOME_SEARCH_SORT_OPTIONS,
  type HomeSearchSortKey,
  isHomeSearchSortKey,
} from "../lib/home-movie-sort";

interface HomeSortSelectProps {
  value: HomeSearchSortKey;
  onValueChange: (value: HomeSearchSortKey) => void;
}

function ChevronUpDownIcon(props: ComponentProps<"svg">) {
  return (
    <svg
      width="8"
      height="12"
      viewBox="0 0 8 12"
      fill="none"
      stroke="currentcolor"
      strokeWidth="1.5"
      aria-hidden
      focusable="false"
      {...props}
    >
      <title>展开收起</title>
      <path d="M0.5 4.5L4 1.5L7.5 4.5" />
      <path d="M0.5 7.5L4 10.5L7.5 7.5" />
    </svg>
  );
}

function CheckIcon(props: ComponentProps<"svg">) {
  return (
    <svg
      fill="currentcolor"
      width="10"
      height="10"
      viewBox="0 0 10 10"
      aria-hidden
      focusable="false"
      {...props}
    >
      <title>已选中</title>
      <path d="M9.1603 1.12218C9.50684 1.34873 9.60427 1.81354 9.37792 2.16038L5.13603 8.66012C5.01614 8.8438 4.82192 8.96576 4.60451 8.99384C4.3871 9.02194 4.1683 8.95335 4.00574 8.80615L1.24664 6.30769C0.939709 6.02975 0.916013 5.55541 1.19372 5.24822C1.47142 4.94102 1.94536 4.91731 2.2523 5.19524L4.36085 7.10461L8.12299 1.33999C8.34934 0.993152 8.81376 0.895638 9.1603 1.12218Z" />
    </svg>
  );
}

export function HomeSortSelect({ value, onValueChange }: HomeSortSelectProps) {
  return (
    <div className="flex flex-wrap items-center justify-end gap-2">
      <span className="text-sm text-slate-600">排序方式</span>
      <Select.Root
        items={HOME_SEARCH_SORT_OPTIONS}
        value={value}
        onValueChange={(nextValue) => {
          if (isHomeSearchSortKey(nextValue)) {
            onValueChange(nextValue);
          }
        }}
      >
        <Select.Trigger className="inline-flex min-h-10 min-w-56 items-center justify-between gap-3 rounded-xl border border-slate-300 bg-white px-3 text-sm text-slate-900 outline-none hover:bg-slate-50 focus-visible:ring-4 focus-visible:ring-slate-200">
          <Select.Value
            className="data-placeholder:opacity-60"
            placeholder="选择排序方式"
          />
          <Select.Icon className="flex text-slate-500">
            <ChevronUpDownIcon />
          </Select.Icon>
        </Select.Trigger>
        <Select.Portal>
          <Select.Positioner
            className="z-10 select-none outline-none"
            sideOffset={8}
          >
            <Select.Popup className="rounded-xl border border-slate-200 bg-white">
              <Select.ScrollUpArrow className="flex h-4 w-full cursor-default items-center justify-center text-xs text-slate-500" />
              <Select.List className="max-h-60 overflow-y-auto py-1">
                {HOME_SEARCH_SORT_OPTIONS.map((option) => (
                  <Select.Item
                    key={option.value}
                    value={option.value}
                    className="grid cursor-default grid-cols-[0.75rem_1fr] items-center gap-2 py-2 pl-2.5 pr-4 text-sm text-slate-700 outline-none data-[highlighted]:bg-slate-900 data-[highlighted]:text-slate-50"
                  >
                    <Select.ItemIndicator className="col-start-1">
                      <CheckIcon className="size-3" />
                    </Select.ItemIndicator>
                    <Select.ItemText className="col-start-2">
                      {option.label}
                    </Select.ItemText>
                  </Select.Item>
                ))}
              </Select.List>
              <Select.ScrollDownArrow className="flex h-4 w-full cursor-default items-center justify-center text-xs text-slate-500" />
            </Select.Popup>
          </Select.Positioner>
        </Select.Portal>
      </Select.Root>
    </div>
  );
}
