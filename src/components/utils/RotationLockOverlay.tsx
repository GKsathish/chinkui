import React from 'react';

interface RotationLockOverlayProps {
  show: boolean;
}

const RotationLockOverlay: React.FC<RotationLockOverlayProps> = ({ show }) => {
  if (!show) return null;

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.95)',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 9999,
      color: 'white',
      textAlign: 'center',
      padding: '20px'
    }}>
      <div style={{ marginBottom: '24px' }}>
        <svg 
          style={{ 
            width: '96px', 
            height: '96px', 
            margin: '0 auto',
            animation: 'pulse 2s infinite'
          }} 
          fill="none" 
          stroke="currentColor" 
          viewBox="0 0 24 24"
        >
          <path 
            strokeLinecap="round" 
            strokeLinejoin="round" 
            strokeWidth={2} 
            d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" 
          />
        </svg>
      </div>
      
      <h2 style={{
        fontSize: '24px',
        fontWeight: 'bold',
        marginBottom: '16px',
        color: '#ff6b6b'
      }}>
        Please Enable Rotation Lock
      </h2>

      <p style={{
        fontSize: '18px',
        color: '#ccc',
        marginBottom: '24px',
        lineHeight: '1.6',
        maxWidth: '320px'
      }}>
        To prevent display issues with this game, please enable rotation lock.
</p>
      {/* Add CSS animation for pulse effect */}
      <style>{`
        @keyframes pulse {
          0% {
            transform: scale(1);
            opacity: 1;
          }
          50% {
            transform: scale(1.1);
            opacity: 0.7;
          }
          100% {
            transform: scale(1);
            opacity: 1;
          }
        }
      `}</style>
    </div>
  );
};

export default RotationLockOverlay;
