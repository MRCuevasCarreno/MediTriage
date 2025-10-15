import NavBar from "../components/NavBar";
import { Outlet, useLocation } from "react-router-dom";

export default function MainLayout2() {
  const location = useLocation();
  const hideNavBar = location.pathname === "/admin/doctors";
  return (
    <>
      {!hideNavBar && <NavBar />}
      <main>
        <Outlet />
      </main>
    </>
  );
}
