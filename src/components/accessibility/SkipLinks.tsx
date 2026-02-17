'use client';

import { useAccessibility } from '@/contexts/AccessibilityContext';

export default function SkipLinks() {
  const { isEnabled, playSound } = useAccessibility();

  if (!isEnabled) return null;

  const handleClick = () => {
    playSound('navigation');
  };

  return (
    <div className="skip-links-container">
      <a
        href="#main-content"
        className="skip-link"
        onClick={handleClick}
        onFocus={(e) => {
          e.target.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }}
      >
        Skip to main content
      </a>
      <a
        href="#navigation"
        className="skip-link"
        onClick={handleClick}
        onFocus={(e) => {
          e.target.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }}
      >
        Skip to navigation
      </a>
      <style jsx>{`
        .skip-links-container {
          position: absolute;
          top: -100px;
          left: 0;
          z-index: 10000;
        }
        .skip-link {
          position: absolute;
          top: 0;
          left: 0;
          background: #3B82F6;
          color: white;
          padding: 12px 24px;
          text-decoration: none;
          font-weight: bold;
          border-radius: 0 0 8px 0;
          transform: translateY(-100%);
          transition: transform 0.2s;
          font-family: Andika, sans-serif;
          font-size: 16px;
        }
        .skip-link:focus {
          transform: translateY(0);
          outline: 3px solid #F59E0B;
          outline-offset: 2px;
        }
        .skip-link:hover {
          background: #2563EB;
        }
      `}</style>
    </div>
  );
}
