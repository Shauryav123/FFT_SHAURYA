import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Navbar from './components/Navbar';
import HomePage from './pages/HomePage';
import LobbyPage from './pages/LobbyPage';
import DuelPage from './pages/DuelPage';
import TiebreakPage from './pages/TiebreakPage';
import ResultPage from './pages/ResultPage';
import AuthPage from './pages/AuthPage';

export default function App() {
  return (
    <BrowserRouter>
      <div className="min-h-screen flex flex-col bg-[#0A0B14] text-slate-100 selection:bg-violet-500/30 selection:text-white">
        <Navbar />
        <main className="flex-1">
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/auth" element={<AuthPage />} />
            <Route path="/room/:code" element={<LobbyPage />} />
            <Route path="/room/:code/duel" element={<DuelPage />} />
            <Route path="/room/:code/tiebreak" element={<TiebreakPage />} />
            <Route path="/room/:code/result" element={<ResultPage />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </main>
        <footer className="border-t border-white/10 bg-[#0C0E1A]/80 backdrop-blur-lg py-5 text-center text-xs text-slate-500">
          Decision Duel — Stop arguing. Start dueling.
        </footer>
      </div>
    </BrowserRouter>
  );
}
