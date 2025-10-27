// src/components/Layout.tsx
import React from "react";
import NavBar from "./NavBar";
import Container from "./Container";

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white text-gray-900">
      <NavBar />
      <Container>{children}</Container>
      <footer className="mt-12 border-t">
        <Container>
          <p className="text-xs text-gray-500 py-6">
            © {new Date().getFullYear()} MediTriage
          </p>
        </Container>
      </footer>
    </div>
  );
}
