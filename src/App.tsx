import React, { useEffect, useState } from "react";
import {
  BrowserRouter as Router,
  Route,
  Routes,
  Navigate,
} from "react-router-dom";
import "./App.css";
import Login from "./pages/auth/Login";
import Lobby from "./pages/lobby/Lobby";
import SlotGame from "./pages/slotGames/Game";
import NotFound from "./pages/NotFound";
import ProtectedRoute from "./components/utils/ProtectedRoute";
import Home from "./pages/Home/Home";
import UnAuthLobby from "./pages/lobby/UnAuthLobby";
import UnityWebGLPlayer from "./components/gamePlayer/UnityWebGLPlayer";
import PixiPlayer from "./components/gamePlayer/PixiPlayer";
import AuthErrorBoundary from "./components/utils/AuthErrorBoundary";
// import Home from "./pages/Home/Home";

const App: React.FC = () => {
  const [isWebView, setIsWebView] = useState(false);
  const [token, setToken] = useState(sessionStorage.getItem("token"));
  useEffect(() => {
    const userAgent = navigator.userAgent;

    if (
      /Mobile|Android|iP(ad|hone|od)|Opera Mini|IEMobile|WPDesktop/.test(
        userAgent
      )
    ) {
      localStorage.setItem("deviceType", "mobile");
    } else if (/Tablet|iPad/.test(userAgent)) {
      localStorage.setItem("deviceType", "tablet");
    } else {
      localStorage.setItem("deviceType", "desktop");
    }
  }, []);

  useEffect(() => {
    const detectWebView = () => {
      const isReactNativeWebView = window.ReactNativeWebView !== undefined;
      const isWebView =
        isReactNativeWebView ||
        navigator.userAgent.toLowerCase().includes("wv") ||
        /Android.*Version\/[0-9].[0-9]/.test(navigator.userAgent);

      setIsWebView(isWebView);
    };

    detectWebView();
  }, []);

  
  return (
    <AuthErrorBoundary>
      <Router>
        <div className="App bg-no-repeat bg-center bg-cover bg-fixed" style={{ backgroundImage: `url('/game_thumbnail_sprites/background.png')` }}>
          {/* <div className="relative inset-0 bg-black bg-opacity-50"></div> */}
          <Routes>
            <Route path="/" element={<Home/>} />
            <Route
              path="/lobby"
              element={
                <Lobby />
              }
            />
            <Route
              path="/login"
              element={token ? <Navigate to="/lobby" replace /> : <UnAuthLobby />}
            />
            
            {/* <Route path="/hello-world" element={<HelloWorld />} />  */}
            <Route path="/slot-games/:gameId" element={<SlotGame />} />
            <Route path="/player" element={<UnityWebGLPlayer/>}/>
            <Route path="/pixi-player" element={<PixiPlayer/>}/>


            <Route path="*" element={<NotFound />} />
          </Routes>
        </div>
      </Router>
    </AuthErrorBoundary>
  );
};

export default App;
