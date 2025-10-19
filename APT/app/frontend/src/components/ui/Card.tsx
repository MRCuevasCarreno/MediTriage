import React from "react";

type Props = {
  title?: string;
  children: React.ReactNode;
  actions?: React.ReactNode;
  className?: string;
};

export default function Card({ title, children, actions, className = "" }: Props) {
  return (
    <div className={`rounded-2xl border border-gray-200 bg-white shadow-sm ${className}`}>
      {title && (
        <div className="px-6 py-4 border-b">
          <h2 className="text-lg font-semibold">{title}</h2>
        </div>
      )}
      <div className="px-6 py-4">{children}</div>
      {actions && (
        <div className="px-6 py-3 border-t bg-gray-50 flex justify-end gap-3">
          {actions}
        </div>
      )}
    </div>
  );
}
