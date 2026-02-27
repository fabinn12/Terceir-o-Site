import React from "react";
import { Route, Routes } from "react-router-dom";
import ScrollToTop from "./components/ScrollToTop";
import Header from "./components/Header.jsx";
import Footer from "./components/Footer.jsx";
import HomePage from "./pages/HomePage.jsx";
import PixPage from "./pages/PixPage.jsx";
import NoiteMassasPage from "./pages/NoiteMassasPage.jsx";
import SocialPage from "./pages/SocialPage.jsx";
import AdminPanel from "./pages/AdminPanel.jsx";

function App() {
  return (
    <>
      <ScrollToTop />
      <div className="flex flex-col min-h-screen">
        <Header />
        <main className="flex-grow">
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/pix" element={<PixPage />} />
            <Route path="/noite-massas" element={<NoiteMassasPage />} />
            <Route path="/social" element={<SocialPage />} />
            <Route path="/admin" element={<AdminPanel />} />
          </Routes>
        </main>
        <Footer />
      </div>
    </>
  );
}

export default App;
