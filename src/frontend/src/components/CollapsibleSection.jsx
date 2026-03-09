import React, { useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faChevronDown } from '@fortawesome/free-solid-svg-icons';
import { colors } from '../colors.js';

export default function CollapsibleSection({ title, icon, children, defaultOpen = false, subtitle = null }) {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <div className="rounded-2xl border-2 overflow-hidden shadow-lg" style={{ borderColor: colors.mutedBlue }}>
      {/* Header */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full px-8 py-6 flex items-center justify-between hover:opacity-90 transition-opacity focus:outline-none"
        style={{ 
          backgroundColor: colors.mutedBlue,
          color: colors.white 
        }}
      >
        <div className="flex items-center gap-3">
          {icon && <FontAwesomeIcon icon={icon} className="text-xl" />}
          <div className="text-left">
            <h3 className="text-lg font-bold">{title}</h3>
            {subtitle && <p className="text-xs mt-1 opacity-80">{subtitle}</p>}
          </div>
        </div>
        <FontAwesomeIcon 
          icon={faChevronDown} 
          className={`text-xl transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`}
        />
      </button>

      {/* Content */}
      {isOpen && (
        <div 
          className="px-8 py-6 animate-in fade-in duration-300"
          style={{ background: `linear-gradient(135deg, rgba(90, 125, 154, 0.05) 0%, rgba(255, 255, 255, 0.6) 100%)` }}
        >
          {children}
        </div>
      )}
    </div>
  );
}
