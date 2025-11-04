"use client";
import React, { useEffect, useState } from "react";

export default function ClientOnlyText({
  getText,
  fallback = "",
  className,
}: {
  getText: () => string | null | undefined;
  fallback?: string;
  className?: string;
}) {
  const [text, setText] = useState<string | null>(null);

  useEffect(() => {
    try {
      const t = getText();
      setText(t ?? null);
    } catch {
      setText(null);
    }
  }, [getText]);

  return <span className={className}>{text ?? fallback}</span>;
}
