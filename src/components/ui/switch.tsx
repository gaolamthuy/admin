"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

export interface SwitchProps
  extends Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, "onChange"> {
  checked?: boolean;
  onCheckedChange?: (checked: boolean) => void;
}

export const Switch = React.forwardRef<HTMLButtonElement, SwitchProps>(
  (
    { className, checked = false, onCheckedChange, disabled, ...props },
    ref
  ) => {
    const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
      if (disabled) return;
      onCheckedChange?.(!checked);
      props.onClick?.(e);
    };

    return (
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        aria-disabled={disabled}
        data-state={checked ? "checked" : "unchecked"}
        className={cn(
          "inline-flex h-6 w-11 items-center rounded-full transition-colors",
          disabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer",
          checked ? "bg-primary" : "bg-muted",
          className
        )}
        onClick={handleClick}
        ref={ref}
        {...props}
      >
        <span
          className={cn(
            "block h-5 w-5 rounded-full bg-background shadow transform transition-transform",
            checked ? "translate-x-5" : "translate-x-1"
          )}
        />
      </button>
    );
  }
);

Switch.displayName = "Switch";
