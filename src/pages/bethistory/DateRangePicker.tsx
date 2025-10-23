// 1. First, let's create a simple custom DateRangePicker without external dependencies
// Create this as DateRangePicker.tsx in your component folder

import React, { useState } from 'react';

interface DateRangePickerProps {
  value: {
    startDate: Date;
    endDate: Date;
  };
  onChange: (range: { startDate: Date; endDate: Date }) => void;
  label?: string;
  size?: 'small' | 'medium';
  fullWidth?: boolean;
}

const DateRangePicker: React.FC<DateRangePickerProps> = ({
  value,
  onChange,
  size = 'small',
  fullWidth = true,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [tempStartDate, setTempStartDate] = useState(
    value.startDate.toISOString().split('T')[0]
  );
  const [tempEndDate, setTempEndDate] = useState(
    value.endDate.toISOString().split('T')[0]
  );

  const formatDisplayValue = () => {
    const startStr = value.startDate.toLocaleDateString('en-GB');
    const endStr = value.endDate.toLocaleDateString('en-GB');
    return `${startStr} - ${endStr}`;
  };

  const handleApply = () => {
    onChange({
      startDate: new Date(tempStartDate),
      endDate: new Date(tempEndDate)
    });
    setIsOpen(false);
  };

  const handleCancel = () => {
    setTempStartDate(value.startDate.toISOString().split('T')[0]);
    setTempEndDate(value.endDate.toISOString().split('T')[0]);
    setIsOpen(false);
  };

  const handlePredefinedRange = (days: number) => {
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(endDate.getDate() - days);
    
    setTempStartDate(startDate.toISOString().split('T')[0]);
    setTempEndDate(endDate.toISOString().split('T')[0]);
  };

  return (
    <div className="relative">
      <div
        className={`
          ${fullWidth ? 'w-full' : 'w-auto'} 
          ${size === 'small' ? 'px-3 py-2 text-sm' : 'px-4 py-3 text-base'}
          bg-[#1a1a1a] border border-[#e3c4a3]/50 rounded text-white 
          cursor-pointer hover:border-[#e3c4a3] transition-colors
          focus:outline-none focus:border-[#e3c4a3] focus:ring-1 focus:ring-[#e3c4a3]
        `}
        onClick={() => setIsOpen(true)}
      >
        <div>{formatDisplayValue()}</div>
      </div>

      {isOpen && (
        <div className="fixed inset-0 bg-black/50 z-[2000] flex items-center justify-center">
          <div className="bg-[#0D0E0F] border border-[#e3c4a3]/30 rounded-lg p-6 max-w-md w-full mx-4">
            
            {/* Predefined Ranges */}
            <div className="mb-4">
              <div className="text-[#e3c4a3] text-sm mb-2">Quick Select:</div>
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => handlePredefinedRange(0)}
                  className="px-3 py-1 text-xs bg-[#e3c4a3]/20 text-[#e3c4a3] rounded hover:bg-[#e3c4a3]/30"
                >
                  Today
                </button>
                <button
                  onClick={() => handlePredefinedRange(1)}
                  className="px-3 py-1 text-xs bg-[#e3c4a3]/20 text-[#e3c4a3] rounded hover:bg-[#e3c4a3]/30"
                >
                  Yesterday
                </button>
                <button
                  onClick={() => handlePredefinedRange(7)}
                  className="px-3 py-1 text-xs bg-[#e3c4a3]/20 text-[#e3c4a3] rounded hover:bg-[#e3c4a3]/30"
                >
                  Last 7 Days
                </button>
                <button
                  onClick={() => handlePredefinedRange(30)}
                  className="px-3 py-1 text-xs bg-[#e3c4a3]/20 text-[#e3c4a3] rounded hover:bg-[#e3c4a3]/30"
                >
                  Last 30 Days
                </button>
              </div>
            </div>

            {/* Date Inputs */}
            <div className="space-y-4 mb-6">
              <div>
                <label className="block text-[#e3c4a3] text-sm mb-1">Start Date:</label>
                <input
                  type="date"
                  value={tempStartDate}
                  onChange={(e) => setTempStartDate(e.target.value)}
                  className="w-full px-3 py-2 bg-[#1a1a1a] border border-[#e3c4a3]/50 rounded text-white text-sm focus:outline-none focus:border-[#e3c4a3]"
                />
              </div>
              <div>
                <label className="block text-[#e3c4a3] text-sm mb-1">End Date:</label>
                <input
                  type="date"
                  value={tempEndDate}
                  onChange={(e) => setTempEndDate(e.target.value)}
                  className="w-full px-3 py-2 bg-[#1a1a1a] border border-[#e3c4a3]/50 rounded text-white text-sm focus:outline-none focus:border-[#e3c4a3]"
                />
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3 justify-end">
              <button
                onClick={handleCancel}
                className="px-4 py-2 text-sm bg-gray-600 text-white rounded hover:bg-gray-700 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleApply}
                className="px-4 py-2 text-sm bg-[#e3c4a3] text-black rounded hover:brightness-110 transition-all"
              >
                Apply
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DateRangePicker;