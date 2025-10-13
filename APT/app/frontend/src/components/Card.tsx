import React from "react";

export default function Card({ title, children, actions }: { title?: string; children: React.ReactNode; actions?: React.ReactNode }) {
  return (
    <div className="rounded-2xl shadow-sm border border-gray-200 bg-white">
      {title && <div className="px-6 py-4 border-b"><h2 className="text-lg font-semibold">{title}</h2></div>}
      <div className="px-6 py-4">{children}</div>
      {actions && <div className="px-6 py-4 border-t bg-gray-50 flex justify-end gap-3">{actions}</div>}
    </div>
  );
}
