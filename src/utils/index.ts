import React from "react";
import { ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

/** Combines and merges Tailwind CSS class names with conditional logic. */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(...inputs));
}

export const formatLongNumber = (
  num: number | undefined,
  format: "string" | "jsx" = "string"
): React.ReactNode => {
  if (num === undefined || num === null) {
    return format === "jsx" ? React.createElement("span", null, "N/A") : "N/A";
  }

  // Handle large numbers first
  if (num >= 1e12) {
    const value = `${(num / 1e12).toFixed(3)}T`;
    return format === "jsx" ? React.createElement("span", null, value) : value;
  } else if (num >= 1e9) {
    const value = `${(num / 1e9).toFixed(3)}B`;
    return format === "jsx" ? React.createElement("span", null, value) : value;
  } else if (num >= 1e6) {
    const value = `${(num / 1e6).toFixed(3)}M`;
    return format === "jsx" ? React.createElement("span", null, value) : value;
  } else if (num >= 1e3) {
    const value = `${(num / 1e3).toFixed(3)}K`;
    return format === "jsx" ? React.createElement("span", null, value) : value;
  } else if (num >= 0.0001) {
    if (format === "jsx") {
      return React.createElement("span", null, parseFloat(num.toFixed(3)));
    } else {
      if (num >= 1) return num.toFixed(3);
      if (num >= 0.01) return num.toFixed(4);
      return num.toFixed(4);
    }
  } else if (num > 0) {
    if (format === "jsx") {
      const fixed = num.toFixed(num > 0.001 ? 3 : 8);
      const [, decimals] = fixed.split(".");
      let zeroCount = 0;
      for (const char of decimals) {
        if (char === "0") zeroCount++;
        else break;
      }
      const shortenedDigits = decimals.slice(zeroCount, zeroCount + 4);
      return React.createElement(
        "span",
        null,
        "0.0",
        React.createElement("span", { className: "align-center text-[9px]" }, zeroCount),
        shortenedDigits
      );
    } else {
      if (num >= 0.00001) return num.toFixed(5);
      return num.toExponential(3);
    }
  }

  const value = num.toFixed(3);
  return format === "jsx" ? React.createElement("span", null, value) : value;
};

export const shrinkAddress = (address: string, num = 4): string => {
  if (address.length <= 10) return address;
  const start = address.slice(0, num);
  const end = address.slice(-num);
  return `${start}…${end}`;
};
