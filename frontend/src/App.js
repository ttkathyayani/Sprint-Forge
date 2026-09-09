import "@/App.css";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { Toaster } from "sonner";
import { AuthProvider } from "@/context/AuthContext";
import ProtectedRoute from "@/components/ProtectedRoute";
import Login from "@/pages/Login";
import Register from "@/pages/Register";
import Projects from "@/pages/Projects";
import ProjectLayout from "@/pages/ProjectLayout";
import Overview from "@/pages/project/Overview";
import SrsUpload from "@/pages/project/SrsUpload";
import Requirements from "@/pages/project/Requirements";
import Backlog from "@/pages/project/Backlog";
import Team from "@/pages/project/Team";
import SprintPlanning from "@/pages/project/SprintPlanning";
import SprintBoard from "@/pages/project/SprintBoard";
import Replanning from "@/pages/project/Replanning";
import Analytics from "@/pages/project/Analytics";

function App() {
  return (
    <div className="App">
      <AuthProvider>
        <Toaster position="top-right" theme="dark" richColors />
        <BrowserRouter>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route
              path="/projects"
              element={
                <ProtectedRoute>
                  <Projects />
                </ProtectedRoute>
              }
            />
            <Route
              path="/projects/:pid"
              element={
                <ProtectedRoute>
                  <ProjectLayout />
                </ProtectedRoute>
              }
            >
              <Route index element={<Overview />} />
              <Route path="srs" element={<SrsUpload />} />
              <Route path="requirements" element={<Requirements />} />
              <Route path="backlog" element={<Backlog />} />
              <Route path="team" element={<Team />} />
              <Route path="planning" element={<SprintPlanning />} />
              <Route path="board" element={<SprintBoard />} />
              <Route path="replanning" element={<Replanning />} />
              <Route path="analytics" element={<Analytics />} />
            </Route>
            <Route path="*" element={<Navigate to="/projects" replace />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </div>
  );
}

export default App;
