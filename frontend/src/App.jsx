import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import { WalletProvider } from "./context/WalletContext.jsx";
import Navbar          from "./components/Navbar.jsx";
import ProtectedRoute  from "./components/ProtectedRoute.jsx";
import PublicResults from "./pages/PublicResults.jsx";
import ConnectPage     from "./pages/ConnectPage.jsx";
import Dashboard       from "./pages/Dashboard.jsx";
import SubmitResult    from "./pages/SubmitResult.jsx";
import AuditLog        from "./pages/AuditLog.jsx";
import SuccessPage     from "./pages/SuccessPage.jsx";
import ConstituencyMap   from "./pages/ConstituencyMap.jsx";
import CandidateManagement from "./pages/CandidateManagement.jsx";
import VerifyResult from "./pages/VerifyResult.jsx";
import AssignOfficers from "./pages/AssignOfficers.jsx";
import StationSetup from "./pages/StationSetup.jsx";
import ROOfficers from "./pages/ROOfficers.jsx";
// import OCRTest from "./pages/OCRTest.jsx";


export default function App() {
  return (
    <WalletProvider>
      <Navbar />
      <Routes>
        <Route path="/results" element={<PublicResults />} />
        <Route path="/candidates" element={<ProtectedRoute><CandidateManagement /></ProtectedRoute>} />
        <Route path="/"          element={<ConnectPage />} />
        <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
        <Route path="/submit"    element={<ProtectedRoute><SubmitResult /></ProtectedRoute>} />
        <Route path="/audit"     element={<ProtectedRoute><AuditLog /></ProtectedRoute>} />
        <Route path="/success"   element={<ProtectedRoute><SuccessPage /></ProtectedRoute>} />
        <Route path="/map"      element={<ProtectedRoute><ConstituencyMap /></ProtectedRoute>} />
        <Route path="*"          element={<Navigate to="/" />} />
        <Route path="/verify" element={<VerifyResult />} />
        <Route path="/assign-officers" element={<ProtectedRoute><AssignOfficers /></ProtectedRoute>} />
        <Route path="/station-setup" element={<ProtectedRoute><StationSetup /></ProtectedRoute>} />
        <Route path="/ro-officers" element={<ProtectedRoute><ROOfficers /></ProtectedRoute>} />
      </Routes>
    </WalletProvider>
  );
}