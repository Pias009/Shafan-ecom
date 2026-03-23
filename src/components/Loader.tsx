import React from 'react';

interface LoaderProps {
  size?: 'sm' | 'md' | 'lg';
  centered?: boolean;
  className?: string;
}

export const Loader: React.FC<LoaderProps> = ({ 
  size = 'md', 
  centered = true,
  className = ''
}) => {
  const sizeClasses = {
    sm: 'scale-75',
    md: 'scale-100',
    lg: 'scale-125'
  };

  const containerClasses = centered 
    ? `flex items-center justify-center ${className}` 
    : className;

  return (
    <div className={containerClasses}>
      <div className={`loader ${sizeClasses[size]}`}>
        <div className="loader__circle"></div>
        <div className="loader__circle"></div>
        <div className="loader__circle"></div>
        <div className="loader__circle"></div>
        <div className="loader__circle"></div>
        <div className="loader__circle"></div>
      </div>
    </div>
  );
};

export default Loader;