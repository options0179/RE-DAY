import { BrowserRouter, Route, Routes } from "react-router-dom";
import { ProtectedRoute } from "./components/ProtectedRoute";
import { AuthProvider } from "./lib/auth";
import History from "./routes/History";
import Home from "./routes/Home";
import Jobs from "./routes/Jobs";
import Landing from "./routes/Landing";
import Login from "./routes/Login";
import Review from "./routes/Review";
import Simulation from "./routes/Simulation";

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Landing />} />
          <Route path="/login" element={<Login />} />
          <Route
            path="/home"
            element={
              <ProtectedRoute>
                <Home />
              </ProtectedRoute>
            }
          />
          <Route
            path="/jobs"
            element={
              <ProtectedRoute>
                <Jobs />
              </ProtectedRoute>
            }
          />
          <Route
            path="/simulation/:sessionId"
            element={
              <ProtectedRoute>
                <Simulation />
              </ProtectedRoute>
            }
          />
          <Route
            path="/review/:sessionId"
            element={
              <ProtectedRoute>
                <Review />
              </ProtectedRoute>
            }
          />
          <Route
            path="/history"
            element={
              <ProtectedRoute>
                <History />
              </ProtectedRoute>
            }
          />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
