import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAppLogic } from "../../hooks/useAppLogic";
import { Classroom } from "./Classroom";
import { RoleSelector } from "./RoleSelector";

export function Dashboard() {
  const {
    appState,
    currentUser,
    currentClass,
    handleRoleSelect,
    handleJoinClass,
    handleLeaveClass,
    handleCreateClass,
    handleEditClass,
    handleDeleteClass,
  } = useAppLogic();
  const navigate = useNavigate();

  useEffect(() => {
    if (appState === "dashboard" && currentUser) {
      navigate("/admin/virtualclass/classes", { replace: true });
    }
  }, [appState, currentUser, navigate]);

  if (appState === "role-selection") {
    return <RoleSelector onRoleSelect={handleRoleSelect} />;
  } else if (appState === "dashboard" && currentUser) {
    // Yönlendirme yapılacağı için burada içerik render etmiyoruz
    return null;
  } else if (appState === "classroom" && currentUser && currentClass) {
    return (
      <Classroom
        classSession={currentClass}
        currentUser={currentUser}
        onLeaveClass={handleLeaveClass}
      />
    );
  }
  return null;
}
