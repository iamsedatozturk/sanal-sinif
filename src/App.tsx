import { Route, Routes, Navigate } from "react-router-dom";
import { Dashboard } from "./components/VirtualClass/Dashboard";
import ClassListPage from "./views/virtualClass/ClassListPage";
import ClassroomPage from "./views/virtualClass/ClassroomPage";

function App() {
  return (
    <Routes>
      <Route
        path="/"
        element={<Navigate to="/admin/virtualclass/dashboard" replace />}
      />
      <Route path="/admin/virtualclass/dashboard" element={<Dashboard />} />
      <Route path="/admin/virtualclass/classes" element={<ClassListPage />} />
      <Route
        path="/admin/virtualclass/classroom/:id"
        element={<ClassroomPage />}
      />
    </Routes>
  );
}

export default App;
