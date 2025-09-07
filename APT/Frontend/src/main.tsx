import React from "react";
import ReactDOM from "react-dom/client";
import { createBrowserRouter, RouterProvider } from "react-router-dom";
import App from "./App";
import Login from "./pages/Login";
import Appointments from "./pages/Appointments";
import "./index.css";

const router = createBrowserRouter([
  {
    path: "/",
    element: <App />,         // layout con Navbar + <Outlet />
    children: [
      { index: true, element: <Appointments /> }, // /
      { path: "login", element: <Login /> },      // /login
    ],
  },
]);

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <RouterProvider router={router} />
  </React.StrictMode>
);
