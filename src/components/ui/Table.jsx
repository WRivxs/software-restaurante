import * as React from "react"
import { cn } from "../../lib/utils"

export function Table({ className, ...props }) {
  return (
    <div className="relative w-full overflow-auto">
      <table className={cn("w-full caption-bottom text-sm", className)} {...props} />
    </div>
  )
}

export function TableHeader({ className, ...props }) {
  return <thead className={cn("[&_tr]:border-b border-bg-border", className)} {...props} />
}

export function TableBody({ className, ...props }) {
  return <tbody className={cn("[&_tr:last-child]:border-0", className)} {...props} />
}

export function TableHead({ className, ...props }) {
  return (
    <th
      className={cn(
        "h-12 px-4 text-left align-middle font-black text-zinc-500 uppercase tracking-widest text-[10px]",
        className
      )}
      {...props}
    />
  )
}

export function TableRow({ className, ...props }) {
  return (
    <tr
      className={cn(
        "border-b border-bg-border transition-colors hover:bg-bg-elevated/50 data-[state=selected]:bg-bg-elevated",
        className
      )}
      {...props}
    />
  )
}

export function TableCell({ className, ...props }) {
  return <td className={cn("p-4 align-middle text-zinc-300", className)} {...props} />
}
