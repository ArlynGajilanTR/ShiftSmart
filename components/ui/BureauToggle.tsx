'use client';

import { Bureau } from '@/types';
import { Building2, ChevronDown } from 'lucide-react';
import { useState, useRef, useEffect } from 'react';

interface BureauToggleProps {
  bureaus: Bureau[];
  selectedBureau: string;
  onSelectBureau: (bureauId: string) => void;
}

export function BureauToggle({ bureaus, selectedBureau, onSelectBureau }: BureauToggleProps) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const currentBureau = bureaus.find(b => b.id === selectedBureau);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelect = (bureauId: string) => {
    onSelectBureau(bureauId);
    sessionStorage.setItem('selectedBureau', bureauId);
    setIsOpen(false);
  };

  return (
    <div ref={dropdownRef} className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-md transition"
      >
        <Building2 className="w-4 h-4" />
        <span className="font-medium">{currentBureau?.name || 'Select Bureau'}</span>
        <ChevronDown className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div className="absolute top-full right-0 mt-2 w-64 bg-white rounded-lg shadow-lg border border-gray-200 z-50">
          <div className="p-2">
            {bureaus.map((bureau) => (
              <button
                key={bureau.id}
                onClick={() => handleSelect(bureau.id)}
                className={`w-full text-left px-4 py-3 rounded-md transition ${
                  selectedBureau === bureau.id
                    ? 'bg-orange-50 text-[#FF6600] font-medium'
                    : 'hover:bg-gray-50'
                }`}
              >
                <div className="font-medium">{bureau.name}</div>
                <div className="text-sm text-gray-500">{bureau.code}</div>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

