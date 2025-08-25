import { useAppLogic } from "../hooks/useAppLogic";
import { Classroom } from "./Classroom";
import { ClassList } from "./ClassList";
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

  let content = null;
  if (appState === "role-selection") {
    content = <RoleSelector onRoleSelect={handleRoleSelect} />;
  } else if (appState === "dashboard" && currentUser) {
    content = (
      <ClassList
        currentUser={currentUser}
        onCreateClass={handleCreateClass}
        onJoinClass={handleJoinClass}
        onEditClass={handleEditClass}
        onDeleteClass={handleDeleteClass}
      />
    );
  } else if (appState === "classroom" && currentUser && currentClass) {
    content = (
      <Classroom
        classSession={currentClass}
        currentUser={currentUser}
        onLeaveClass={handleLeaveClass}
      />
    );
  }

  return content;
}
