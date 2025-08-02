import React from 'react';

interface PrometheusLogoProps {
  size?: number | string;
  className?: string;
  animated?: boolean;
}

export const PrometheusLogo: React.FC<PrometheusLogoProps> = ({ 
  size = 32, 
  className = '', 
  animated = false 
}) => {
  const sizeValue = typeof size === 'number' ? `${size}px` : size;
  
  return (
    <img
      src="/assets/logo.png"
      alt="Prometheus AGS Logo"
      className={`prometheus-logo ${animated ? 'animate-flame-pulse' : ''} ${className}`}
      style={{
        width: sizeValue,
        height: sizeValue,
        objectFit: 'contain',
        flexShrink: 0,
      }}
      role="img"
      aria-label="Prometheus AGS Logo"
    />
  );
};

export const PrometheusLogoIcon: React.FC<PrometheusLogoProps> = ({ 
  size = 24, 
  className = '', 
  animated = false 
}) => {
  const sizeValue = typeof size === 'number' ? `${size}px` : size;
  
  return (
    <img
      src="/assets/logo.png"
      alt="Prometheus AGS"
      className={`prometheus-logo-icon ${animated ? 'animate-flame-pulse' : ''} ${className}`}
      style={{
        width: sizeValue,
        height: sizeValue,
        objectFit: 'contain',
        flexShrink: 0,
      }}
      role="img"
      aria-label="Prometheus AGS"
    />
  );
};

export const PrometheusLogoLarge: React.FC<PrometheusLogoProps> = ({ 
  size = 64, 
  className = '', 
  animated = false 
}) => {
  const sizeValue = typeof size === 'number' ? `${size}px` : size;
  
  return (
    <img
      src="/assets/logo.png"
      alt="Prometheus Agentic Growth Solutions"
      className={`prometheus-logo-large ${animated ? 'animate-flame-pulse' : ''} ${className}`}
      style={{
        width: sizeValue,
        height: sizeValue,
        objectFit: 'contain',
        flexShrink: 0,
      }}
      role="img"
      aria-label="Prometheus Agentic Growth Solutions"
    />
  );
};

// Backward compatibility exports
export const PrometheusLogoSVG = PrometheusLogo;
export const PrometheusFlameIcon = PrometheusLogoIcon;

export default PrometheusLogo;