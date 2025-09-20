import { useState, useEffect } from 'react';
import { Search } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Input } from '@/components/ui/input';
import { useDebounce } from '@/hooks/useDebounce';

interface SearchBarProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}

export function SearchBar({ value, onChange, placeholder }: SearchBarProps) {
  const { t } = useTranslation();
  const [localValue, setLocalValue] = useState(value);
  const debouncedValue = useDebounce(localValue, 300); // 300ms delay

  // Update parent component when debounced value changes
  useEffect(() => {
    onChange(debouncedValue);
  }, [debouncedValue, onChange]);

  // Sync with external value changes
  useEffect(() => {
    setLocalValue(value);
  }, [value]);

  return (
    <div className="relative">
      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-blue-600 h-4 w-4" />
      <Input
        type="text"
        placeholder={placeholder || t('products.search', 'Rechercher un produit...')}
        value={localValue}
        onChange={(e) => setLocalValue(e.target.value)}
        className="pl-10 border-blue-200 focus:border-blue-400 focus:ring-blue-400"
      />
    </div>
  );
}
