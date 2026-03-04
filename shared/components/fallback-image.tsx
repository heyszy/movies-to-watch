"use client";

import Image from "next/image";
import { useState } from "react";

interface FallbackImageProps {
  src: string | null | undefined;
  alt: string;
  sizes: string;
  fill?: boolean;
  priority?: boolean;
  loading?: "eager" | "lazy";
  imageClassName?: string;
  fallbackClassName?: string;
  emptyText: string;
  errorText?: string;
}

/**
 * 统一处理图片缺失与加载失败场景，避免出现浏览器默认裂图图标。
 */
export function FallbackImage({
  src,
  alt,
  sizes,
  fill = true,
  priority,
  loading,
  imageClassName,
  fallbackClassName,
  emptyText,
  errorText = "加载失败，请稍后重试",
}: FallbackImageProps) {
  const [failedSrc, setFailedSrc] = useState<string | null>(null);
  const hasError = Boolean(src && failedSrc === src);

  if (!src || hasError) {
    return (
      <div className={fallbackClassName}>
        {hasError ? errorText : emptyText}
      </div>
    );
  }

  return (
    <Image
      src={src}
      alt={alt}
      fill={fill}
      sizes={sizes}
      priority={priority}
      loading={loading}
      className={imageClassName}
      onError={() => {
        setFailedSrc(src);
      }}
    />
  );
}
