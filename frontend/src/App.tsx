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

function RequireAuth({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  if (loading) return null;
  if (!user) return <Navigate to="/auth" replace />;
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
        <Route path="/cartas" element={<CardsPage />} />
        <Route path="/mazos" element={<DecksPage />} />
        <Route path="/mazos/:id" element={<DeckEditorPage />} />
        <Route path="/batalla" element={<BattlePage />} />
        <Route path="/perfil/:username" element={<ProfilePage />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
