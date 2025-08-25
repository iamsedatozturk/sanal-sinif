import { Route, Routes } from "react-router-dom";
import { Dashboard } from "./components/VirtualClass/Dashboard";
import ClassListPage from "./views/virtualClass/ClassListPage";
import ClassroomPage from "./views/virtualClass/ClassRoomPage";

function App() {
  return (
    <Routes>
      <Route path="/" element={<Dashboard />} />
      <Route path="/classes" element={<ClassListPage />} />
      <Route path="/classroom/:id" element={<ClassroomPage />} />
    </Routes>
  );
}

export default App;
