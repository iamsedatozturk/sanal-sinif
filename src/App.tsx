import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { RoleSelector } from './components/RoleSelector';
import { Dashboard } from './components/Dashboard';
import { ClassroomInterface } from './components/ClassroomInterface';
import { ClassSession, User } from './types';

type AppState = 'role-selection' | 'dashboard' | 'classroom';

function App() {
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

  const handleBackToRoleSelection = () => {
    setCurrentUser(null);
    setCurrentClass(null);
    setAppState('role-selection');
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

  return (
    <div className="App">
      <AnimatePresence mode="wait">
        {appState === 'role-selection' && (
          <motion.div
            key="role-selection"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
          >
            <RoleSelector onRoleSelect={handleRoleSelect} />
          </motion.div>
        )}

        {appState === 'dashboard' && currentUser && (
          <motion.div
            key="dashboard"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
          >
            <Dashboard
              currentUser={currentUser}
              onCreateClass={handleCreateClass}
              onJoinClass={handleJoinClass}
              onEditClass={handleEditClass}
              onDeleteClass={handleDeleteClass}
            />
          </motion.div>
        )}

        {appState === 'classroom' && currentUser && currentClass && (
          <motion.div
            key="classroom"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
          >
            <ClassroomInterface
              classSession={currentClass}
              currentUser={currentUser}
              onLeaveClass={handleLeaveClass}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default App;