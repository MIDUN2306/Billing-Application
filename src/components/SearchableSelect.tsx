import { useState, useRef, useEffect } from 'react';
import { Search, ChevronDown, X } from 'lucide-react';

interface Option {
  value: string;
  label: string;
  subtitle?: string;
  badge?: string;
}

interface SearchableSelectProps {
  options: Option[];
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
  searchPlaceholder?: string;
}

export function SearchableSelect({
  options,
  value,
  onChange,
  placeholder = 'Select an option',
  disabled = false,
  searchPlaceholder = 'Search...',
}: SearchableSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const dropdownRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  const selectedOption = options.find(opt => opt.value === value);

  // Filter options based on search query (search in label, subtitle, and badge)
  const filteredOptions = options.filter(option =>
    option.label.toLowerCase().includes(searchQuery.toLowerCase()) ||
    option.subtitle?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    option.badge?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setSearchQuery('');
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  // Focus search input when dropdown opens
  useEffect(() => {
    if (isOpen && searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, [isOpen]);

  const handleSelect = (optionValue: string) => {
    onChange(optionValue);
    setIsOpen(false);
    setSearchQuery('');
  };

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange('');
    setSearchQuery('');
  };

  return (
    <div ref={dropdownRef} className="relative">
      {/* Selected Value Display */}
      <button
        type="button"
        onClick={() => !disabled && setIsOpen(!isOpen)}
        disabled={disabled}
        className={`w-full px-4 py-2 border rounded-lg text-left flex items-center justify-between transition-colors ${
          disabled
            ? 'bg-gray-100 text-gray-500 cursor-not-allowed'
            : isOpen
            ? 'border-primary-500 ring-2 ring-primary-500 ring-opacity-50'
            : 'border-gray-300 hover:border-gray-400'
        } ${!selectedOption && 'text-gray-400'}`}
      >
        <div className="flex-1 min-w-0">
          {selectedOption ? (
            <div>
              <div className="font-medium text-gray-900 truncate">{selectedOption.label}</div>
              {selectedOption.subtitle && (
                <div className="text-xs text-gray-500 truncate">{selectedOption.subtitle}</div>
              )}
            </div>
          ) : (
            <span>{placeholder}</span>
          )}
        </div>
        <div className="flex items-center gap-2 ml-2">
          {selectedOption && !disabled && (
            <X
              className="w-4 h-4 text-gray-400 hover:text-gray-600"
              onClick={handleClear}
            />
          )}
          <ChevronDown
            className={`w-5 h-5 text-gray-400 transition-transform ${
              isOpen ? 'transform rotate-180' : ''
            }`}
          />
        </div>
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-80 overflow-hidden">
          {/* Search Input */}
          <div className="p-2 border-b border-gray-200 sticky top-0 bg-white">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                ref={searchInputRef}
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={searchPlaceholder}
                className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary-500 focus:border-transparent text-sm"
              />
            </div>
          </div>

          {/* Options List */}
          <div className="overflow-y-auto max-h-64">
            {filteredOptions.length === 0 ? (
              <div className="px-4 py-8 text-center text-gray-500 text-sm">
                No results found
              </div>
            ) : (
              filteredOptions.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => handleSelect(option.value)}
                  className={`w-full px-4 py-3 text-left hover:bg-gray-50 transition-colors border-b border-gray-100 last:border-b-0 ${
                    option.value === value ? 'bg-primary-50' : ''
                  }`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-gray-900 truncate">{option.label}</div>
                      {option.subtitle && (
                        <div className="text-xs text-gray-500 truncate mt-0.5">{option.subtitle}</div>
                      )}
                    </div>
                    {option.badge && (
                      <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded-full font-medium whitespace-nowrap">
                        {option.badge}
                      </span>
                    )}
                  </div>
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
