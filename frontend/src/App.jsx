import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import { WalletProvider } from "./context/WalletContext.jsx";
import Navbar          from "./components/Navbar.jsx";
import ProtectedRoute  from "./components/ProtectedRoute.jsx";
import PublicResults from "./pages/PublicResults.jsx";
import ConnectPage     from "./pages/ConnectPage.jsx";
import Dashboard       from "./pages/Dashboard.jsx";
import SubmitResult    from "./pages/SubmitResult.jsx";
import ROReview        from "./pages/ROReview.jsx";
import AuditLog        from "./pages/AuditLog.jsx";
import DisputePage     from "./pages/DisputePage.jsx";
import SuccessPage     from "./pages/SuccessPage.jsx";
import ConstituencyMap   from "./pages/ConstituencyMap.jsx";
import OfficerManagement from "./pages/OfficerManagement.jsx";
import RegisterRequest   from "./pages/RegisterRequest.jsx";


export default function App() {
  return (
    <WalletProvider>
      <Navbar />
      <Routes>
        <Route path="/results" element={<PublicResults />} />
        <Route path="/"          element={<ConnectPage />} />
        <Route path="/register"  element={<RegisterRequest />} />
        <Route path="/officers"  element={<ProtectedRoute><OfficerManagement /></ProtectedRoute>} />
        <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
        <Route path="/submit"    element={<ProtectedRoute><SubmitResult /></ProtectedRoute>} />
        <Route path="/ro-review" element={<ProtectedRoute><ROReview /></ProtectedRoute>} />
        <Route path="/audit"     element={<ProtectedRoute><AuditLog /></ProtectedRoute>} />
        <Route path="/dispute"   element={<ProtectedRoute><DisputePage /></ProtectedRoute>} />
        <Route path="/success"   element={<ProtectedRoute><SuccessPage /></ProtectedRoute>} />
        <Route path="/map"      element={<ProtectedRoute><ConstituencyMap /></ProtectedRoute>} />
        <Route path="/officers" element={<ProtectedRoute><OfficerManagement /></ProtectedRoute>} />
        <Route path="/register" element={<RegisterRequest />} />
        <Route path="*"          element={<Navigate to="/" />} />
      </Routes>
    </WalletProvider>
  );
}