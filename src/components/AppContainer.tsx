import { useAppLogic } from "../hooks/useAppLogic";
import { ClassroomInterface } from "./Classroom";
import { Dashboard } from "./Dashboard";
import { RoleSelector } from "./RoleSelector";

export function AppContainer() {
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

  let content = null;
  if (appState === "role-selection") {
    content = <RoleSelector onRoleSelect={handleRoleSelect} />;
  } else if (appState === "dashboard" && currentUser) {
    content = (
      <Dashboard
        currentUser={currentUser}
        onCreateClass={handleCreateClass}
        onJoinClass={handleJoinClass}
        onEditClass={handleEditClass}
        onDeleteClass={handleDeleteClass}
      />
    );
  } else if (appState === "classroom" && currentUser && currentClass) {
    content = (
      <ClassroomInterface
        classSession={currentClass}
        currentUser={currentUser}
        onLeaveClass={handleLeaveClass}
      />
    );
  }

  return content;
}
