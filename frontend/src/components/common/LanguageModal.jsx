import React from 'react';
import { X } from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';

const LanguageModal = ({ isOpen, onClose }) => {
  const { language, changeLanguage, t } = useLanguage();

  if (!isOpen) return null;

  const languages = [
    { code: 'es', name: 'Español', flag: '🇪🇸' },
    { code: 'qu', name: 'Quechua', flag: '🇵🇪' },
    { code: 'ay', name: 'Aymara', flag: '🇧🇴' }
  ];

  const handleLanguageChange = (code) => {
    changeLanguage(code);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">
            {t('language.select') || 'Seleccionar Idioma'}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
          >
            <X size={24} />
          </button>
        </div>
        <div className="space-y-3">
          {languages.map((lang) => (
            <button
              key={lang.code}
              onClick={() => handleLanguageChange(lang.code)}
              className={`w-full flex items-center space-x-3 p-4 rounded-lg transition-all ${
                language === lang.code
                  ? 'bg-emerald-500 text-white'
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white hover:bg-gray-200 dark:hover:bg-gray-600'
              }`}
            >
              <span className="text-2xl">{lang.flag}</span>
              <span className="font-semibold">{lang.name}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default LanguageModal;
