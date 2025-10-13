import React from "react";

export default function Badge({ children }: { children: React.ReactNode }) {
  return <span className="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset ring-gray-200">{children}</span>;
}
