import React from "react";
import Layout from "../components/Layout";
import Card from "../components/Card";

export default function NotFound() {
  return (
    <Layout>
      <Card title="No encontrado">
        <p className="text-sm">La página no existe.</p>
      </Card>
    </Layout>
  );
}
