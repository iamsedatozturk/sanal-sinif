import { useState } from 'react';
import { ClassSession, User } from '../types/models';

export type AppState = 'role-selection' | 'dashboard' | 'classroom';

export function useAppLogic() {
  const [appState, setAppState] = useState<AppState>('role-selection');
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [currentClass, setCurrentClass] = useState<ClassSession | null>(null);
  const [allClasses, setAllClasses] = useState<ClassSession[]>([]);

  const handleRoleSelect = (role: 'teacher' | 'student' | 'observer') => {
    setCurrentUser({
      id: `${role}-${Date.now()}`,
      name: '',
      email: '',
      role,
    });
    setAppState('dashboard');
  };

  const handleJoinClass = (classSession: ClassSession, userName?: string) => {
    if (currentUser) {
      setCurrentUser({
        ...currentUser,
        name: userName || currentUser.name,
      });
    }
    setCurrentClass(classSession);
    setAppState('classroom');
  };

  const handleLeaveClass = () => {
    setCurrentClass(null);
    setAppState('dashboard');
  };

  const handleCreateClass = (classData: Partial<ClassSession>) => {
    const newClass = {
      ...classData,
      id: `class-${Date.now()}`,
      teacherId: currentUser?.id || '',
      teacherName: currentUser?.name || '',
      isActive: false,
      isScheduled: true,
      participantCount: 0,
    } as ClassSession;
    setAllClasses(prev => [...prev, newClass]);
  };

  const handleEditClass = (classId: string, classData: Partial<ClassSession>) => {
    setAllClasses(prev => prev.map(c => c.id === classId ? { ...c, ...classData } : c));
  };

  const handleDeleteClass = (classId: string) => {
    setAllClasses(prev => prev.filter(c => c.id !== classId));
  };

  return {
    appState,
    setAppState,
    currentUser,
    setCurrentUser,
    currentClass,
    setCurrentClass,
    allClasses,
    setAllClasses,
    handleRoleSelect,
    handleJoinClass,
    handleLeaveClass,
    handleCreateClass,
    handleEditClass,
    handleDeleteClass,
  };
}
