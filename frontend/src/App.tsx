import { Navigate, Route, Routes } from "react-router-dom";
import { useAuth } from "./lib/AuthContext";
import { Layout } from "./components/Layout";
import { AuthPage } from "./pages/AuthPage";
import { FeedPage } from "./pages/FeedPage";
import { CardsPage } from "./pages/CardsPage";
import { DecksPage } from "./pages/DecksPage";
import { DeckEditorPage } from "./pages/DeckEditorPage";
import { BattlePage } from "./pages/BattlePage";
import { ProfilePage } from "./pages/ProfilePage";
import { SearchPage } from "./pages/SearchPage";
import { MessagesPage } from "./pages/MessagesPage";
import { GroupsPage } from "./pages/GroupsPage";
import { GroupDetailPage } from "./pages/GroupDetailPage";
import { AdminLayout } from "./admin/AdminLayout";
import { DashboardPage } from "./admin/pages/DashboardPage";
import { CardsAdminPage } from "./admin/pages/CardsAdminPage";
import { UsersAdminPage } from "./admin/pages/UsersAdminPage";

function RequireAuth({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  if (loading) return null;
  if (!user) return <Navigate to="/auth" replace />;
  return <>{children}</>;
}

function RequireAdmin({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  if (loading) return null;
  if (!user) return <Navigate to="/auth" replace />;
  if (user.role !== "ADMIN") return <Navigate to="/" replace />;
  return <>{children}</>;
}

export default function App() {
  return (
    <Routes>
      <Route path="/auth" element={<AuthPage />} />
      <Route
        element={
          <RequireAuth>
            <Layout />
          </RequireAuth>
        }
      >
        <Route path="/" element={<FeedPage mode="feed" />} />
        <Route path="/explorar" element={<FeedPage mode="explore" />} />
        <Route path="/buscar" element={<SearchPage />} />
        <Route path="/cartas" element={<CardsPage />} />
        <Route path="/mazos" element={<DecksPage />} />
        <Route path="/mazos/:id" element={<DeckEditorPage />} />
        <Route path="/batalla" element={<BattlePage />} />
        <Route path="/mensajes" element={<MessagesPage />} />
        <Route path="/mensajes/:username" element={<MessagesPage />} />
        <Route path="/grupos" element={<GroupsPage />} />
        <Route path="/grupos/:slug" element={<GroupDetailPage />} />
        <Route path="/perfil/:username" element={<ProfilePage />} />
      </Route>
      <Route
        path="/admin"
        element={
          <RequireAdmin>
            <AdminLayout />
          </RequireAdmin>
        }
      >
        <Route index element={<DashboardPage />} />
        <Route path="cartas" element={<CardsAdminPage />} />
        <Route path="usuarios" element={<UsersAdminPage />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
