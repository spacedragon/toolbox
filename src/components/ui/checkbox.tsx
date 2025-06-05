// Placeholder Checkbox component
// Replace with actual implementation, e.g., from shadcn/ui
import React from 'react';

interface CheckboxProps extends React.InputHTMLAttributes<HTMLInputElement> {
  checked?: boolean | 'indeterminate';
  onCheckedChange?: (checked: boolean | 'indeterminate') => void;
  ['aria-label']?: string;
}

const Checkbox: React.FC<CheckboxProps> = ({ checked, onCheckedChange, ...props }) => {
  const ref = React.useRef<HTMLInputElement>(null);

  React.useEffect(() => {
    if (ref.current) {
      if (checked === 'indeterminate') {
        ref.current.indeterminate = true;
      } else {
        ref.current.indeterminate = false;
      }
    }
  }, [checked]);

  return (
    <input
      type="checkbox"
      ref={ref}
      checked={checked === true}
      onChange={(e) => {
        if (onCheckedChange) {
          onCheckedChange(e.target.checked);
        }
      }}
      {...props}
    />
  );
};

export { Checkbox };
