import React from "react";
import Card from "../components/ui/Card";

export default function NotFound() {
  return (
    <div className="max-w-2xl mx-auto">
      <Card title="No encontrado">
        <p className="text-sm">La página no existe.</p>
      </Card>
    </div>
  );
}
