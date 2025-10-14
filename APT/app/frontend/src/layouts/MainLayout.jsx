import NavBar from "../components/NavBar";
import { Outlet } from "react-router-dom";

export default function MainLayout2() {
  return (
    <>
      <NavBar />
      <main>
        <Outlet />
      </main>
    </>
  );
}
