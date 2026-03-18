"use client";

import * as React from "react";

export function Button(
  props: React.ButtonHTMLAttributes<HTMLButtonElement> & {
    variant?: "primary" | "secondary" | "ghost";
    size?: "sm" | "md";
  },
) {
  const { className = "", variant = "primary", size = "md", ...rest } = props;
  const base =
    "inline-flex items-center justify-center rounded-xl font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed";
  const sizes = size === "sm" ? "h-9 px-3 text-sm" : "h-11 px-4 text-sm";
  const variants =
    variant === "primary"
      ? "bg-zinc-900 text-white hover:bg-zinc-800"
      : variant === "secondary"
        ? "bg-zinc-100 text-zinc-900 hover:bg-zinc-200"
        : "bg-transparent text-zinc-900 hover:bg-zinc-100";
  return <button className={`${base} ${sizes} ${variants} ${className}`} {...rest} />;
}

export function Card(props: React.HTMLAttributes<HTMLDivElement>) {
  const { className = "", ...rest } = props;
  return (
    <div
      className={`rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm ${className}`}
      {...rest}
    />
  );
}

export function Badge(props: React.HTMLAttributes<HTMLSpanElement>) {
  const { className = "", ...rest } = props;
  return (
    <span
      className={`inline-flex items-center rounded-full bg-zinc-100 px-2.5 py-1 text-xs font-medium text-zinc-800 ${className}`}
      {...rest}
    />
  );
}

export function Input(
  props: React.InputHTMLAttributes<HTMLInputElement> & { label?: string },
) {
  const { className = "", label, ...rest } = props;
  return (
    <label className="block">
      {label ? <div className="mb-1 text-sm font-medium text-zinc-800">{label}</div> : null}
      <input
        className={`h-11 w-full rounded-xl border border-zinc-200 bg-white px-3 text-sm outline-none focus:border-zinc-400 ${className}`}
        {...rest}
      />
    </label>
  );
}

export function Textarea(
  props: React.TextareaHTMLAttributes<HTMLTextAreaElement> & { label?: string },
) {
  const { className = "", label, ...rest } = props;
  return (
    <label className="block">
      {label ? <div className="mb-1 text-sm font-medium text-zinc-800">{label}</div> : null}
      <textarea
        className={`min-h-28 w-full resize-y rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm outline-none focus:border-zinc-400 ${className}`}
        {...rest}
      />
    </label>
  );
}

