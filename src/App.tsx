import { Route, Routes } from "react-router";
import { Layout } from "@/components/Layout";
import { AdminPage } from "@/pages/AdminPage";
import { BookingPage } from "@/pages/BookingPage";
import { CancelPage } from "@/pages/CancelPage";
import { GalleryPage } from "@/pages/GalleryPage";
import { HomePage } from "@/pages/HomePage";
import { NotFoundPage } from "@/pages/NotFoundPage";
import { ServicesPage } from "@/pages/ServicesPage";

/**
 * Table des routes de l'application.
 * La route parente porte le gabarit ; les routes enfants s'affichent dans son `<Outlet />`.
 * `path="*"` est la route attrape-tout (404) : elle ne joue que si aucune autre ne correspond.
 */
export default function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route index element={<HomePage />} />
        <Route path="prestations" element={<ServicesPage />} />
        <Route path="galerie" element={<GalleryPage />} />
        <Route path="reserver" element={<BookingPage />} />
        <Route path="annuler" element={<CancelPage />} />
        <Route path="admin" element={<AdminPage />} />
        <Route path="*" element={<NotFoundPage />} />
      </Route>
    </Routes>
  );
}
