"use client";

import { Button } from "@base-ui/react/button";
import { ArrowUp } from "iconoir-react";
import { useEffect, useState } from "react";

const SHOW_THRESHOLD = 480;

export function BackToTopButton() {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    /**
     * 监听滚动位置并控制按钮显隐：
     * - 超过阈值显示，避免首屏出现无意义操作
     * - 回到顶部附近时隐藏，减少视觉干扰
     */
    const handleScroll = () => {
      setIsVisible(window.scrollY > SHOW_THRESHOLD);
    };

    handleScroll();
    window.addEventListener("scroll", handleScroll, { passive: true });

    return () => {
      window.removeEventListener("scroll", handleScroll);
    };
  }, []);

  return (
    <Button
      type="button"
      onClick={() => {
        window.scrollTo({ top: 0, behavior: "smooth" });
      }}
      className={`fixed bottom-6 right-4 z-20 inline-flex size-11 items-center justify-center rounded-full border border-slate-300 bg-white text-slate-700 shadow-sm transition sm:right-6 ${
        isVisible ? "opacity-100" : "pointer-events-none opacity-0"
      }`}
      aria-label="回到顶部"
    >
      <ArrowUp />
    </Button>
  );
}
