import { Route, Routes } from "react-router";
import { Layout } from "@/components/Layout";
import { AdminPage } from "@/pages/AdminPage";
import { BookingPage } from "@/pages/BookingPage";
import { CancelPage } from "@/pages/CancelPage";
import { HomePage } from "@/pages/HomePage";
import { LegalNoticePage } from "@/pages/LegalNoticePage";
import { NotFoundPage } from "@/pages/NotFoundPage";
import { PrivacyPolicyPage } from "@/pages/PrivacyPolicyPage";

/**
 * Table des routes de l'application.
 * La route parente porte le gabarit ; les routes enfants s'affichent dans son `<Outlet />`.
 * Prestations et galerie ne sont pas des routes : ce sont des sections de l'accueil.
 * `path="*"` est la route attrape-tout (404) : elle ne joue que si aucune autre ne correspond.
 */
export default function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route index element={<HomePage />} />
        <Route path="reserver" element={<BookingPage />} />
        <Route path="annuler" element={<CancelPage />} />
        <Route path="admin" element={<AdminPage />} />
        <Route path="mentions-legales" element={<LegalNoticePage />} />
        <Route path="politique-confidentialite" element={<PrivacyPolicyPage />} />
        <Route path="*" element={<NotFoundPage />} />
      </Route>
    </Routes>
  );
}
