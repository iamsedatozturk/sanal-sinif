import React from 'react';
import { motion } from 'framer-motion';
import { FaGraduationCap, FaUserCheck, FaEye } from 'react-icons/fa';

interface RoleSelectorProps {
  onRoleSelect: (role: 'teacher' | 'student' | 'observer') => void;
}

export const RoleSelector: React.FC<RoleSelectorProps> = ({ onRoleSelect }) => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center w-full max-w-4xl"
      >
        <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-800 mb-4">
          Sanal Sınıf Sistemine Hoş Geldiniz
        </h1>
        <p className="text-lg sm:text-xl text-gray-600 mb-8 sm:mb-12">
          Lütfen rolünüzü seçin
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => onRoleSelect('teacher')}
            className="bg-white rounded-lg shadow-lg p-6 sm:p-8 hover:shadow-xl transition-all duration-300 border-2 border-transparent hover:border-blue-500"
          >
            <FaGraduationCap size={48} className="mx-auto text-blue-600 mb-4 sm:mb-4" />
            <h2 className="text-xl sm:text-2xl font-bold text-gray-800 mb-2">Öğretmen</h2>
            <p className="text-gray-600 text-sm sm:text-base">
              Ders başlatın, öğrencilerle iletişim kurun ve katılım raporlarını görün
            </p>
          </motion.button>

          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => onRoleSelect('student')}
            className="bg-white rounded-lg shadow-lg p-6 sm:p-8 hover:shadow-xl transition-all duration-300 border-2 border-transparent hover:border-green-500"
          >
            <FaUserCheck size={48} className="mx-auto text-green-600 mb-4 sm:mb-4" />
            <h2 className="text-xl sm:text-2xl font-bold text-gray-800 mb-2">Öğrenci</h2>
            <p className="text-gray-600 text-sm sm:text-base">
              Aktif derslere katılın, öğretmeniniz ve diğer öğrencilerle etkileşim kurun
            </p>
          </motion.button>

          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => onRoleSelect('observer')}
            className="bg-white rounded-lg shadow-lg p-6 sm:p-8 hover:shadow-xl transition-all duration-300 border-2 border-transparent hover:border-purple-500 md:col-span-2 lg:col-span-1"
          >
            <FaEye size={48} className="mx-auto text-purple-600 mb-4 sm:mb-4" />
            <h2 className="text-xl sm:text-2xl font-bold text-gray-800 mb-2">Gözlemci</h2>
            <p className="text-gray-600 text-sm sm:text-base">
              Sınıfı gözlemleyin, eğitim sürecini takip edin (ses/video paylaşımı yok)
            </p>
          </motion.button>
        </div>
      </motion.div>
    </div>
  );
};