
import React from 'react';

interface CardProps {
  children: React.ReactNode;
  className?: string;
  title?: string;
}

const Card: React.FC<CardProps> = ({ children, className = '', title }) => {
  return (
    <div className={`bg-white rounded-xl shadow-lg p-6 md:p-8 ${className}`}>
      {title && <h2 className="text-2xl font-bold text-primary-dark mb-4">{title}</h2>}
      {children}
    </div>
  );
};

export default Card;
