import React from 'react';
import { motion } from 'framer-motion';

export const LoadingAnimation: React.FC = () => {
  return (
    <div className="fixed inset-0 bg-white/80 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="text-center">
        <div className="relative w-24 h-24 mx-auto mb-6">
          <motion.div
            className="absolute inset-0 border-4 border-blue-200 rounded-full"
            animate={{ scale: [1, 1.2, 1], opacity: [0.3, 0.6, 0.3] }}
            transition={{ duration: 2, repeat: Infinity }}
          />
          <motion.div
            className="absolute inset-0 border-t-4 border-blue-600 rounded-full"
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
          />
        </div>
        <h3 className="text-xl font-bold text-gray-800">Optimale Zuteilung wird berechnet...</h3>
        <p className="text-gray-500 mt-2">Gleichmäßige Verteilung und Wünsche werden berücksichtigt.</p>
      </div>
    </div>
  );
};
