"use client";

import { useEffect, useState } from "react";

/**
 * 将频繁变化的值延后提交，用于输入搜索场景，避免每次按键都触发请求。
 */
export function useDebouncedValue<T>(value: T, delay = 350): T {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      window.clearTimeout(timer);
    };
  }, [delay, value]);

  return debouncedValue;
}
