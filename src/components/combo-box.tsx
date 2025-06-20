'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import {
  Popover,
  PopoverContent,
  PopoverTrigger
} from '@/components/ui/popover';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator
} from '@/components/ui/command';
import { Check, ChevronsUpDown, PlusCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { FormItem, FormControl, FormMessage } from '@/components/ui/form';
import { ControllerRenderProps, FieldValues, Path } from 'react-hook-form';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';

/**
 * Base interface for items in the ComboBox
 */
export interface BaseComboBoxItem {
  id: string;
  name: string;
}

/**
 * Props for the ComboBox component
 * @template TItem - Type of the item extending BaseComboBoxItem
 * @template TFieldValues - Type of the form values
 * @template TName - Type of the field name
 */
export interface ComboBoxProps<
  TItem extends BaseComboBoxItem,
  TFieldValues extends FieldValues = FieldValues,
  TName extends Path<TFieldValues> = Path<TFieldValues>
> {
  /** Form field controller props */
  field: ControllerRenderProps<TFieldValues, TName>;
  /** Available options for the ComboBox */
  defaultValues: TItem[] | undefined;
  /** Placeholder text when no value is selected */
  placeholder?: string;
  /** Whether multiple values can be selected */
  multiSelect?: boolean;
  /** Optional custom rendering for selected values */
  renderSelected?: (value: TItem) => React.ReactNode;
  /** Optional custom rendering for option items */
  renderOption?: (value: TItem, isSelected: boolean) => React.ReactNode;
  /** Optional className for the ComboBox */
  className?: string;
  /** Optional callback for creating new values */
  onCreateValue?: (name: string) => Promise<TItem> | TItem;
}

/**
 * A flexible and type-safe ComboBox component that can be used with or without form libraries
 */
export function ComboBox<
  TItem extends BaseComboBoxItem,
  TFieldValues extends FieldValues = FieldValues,
  TName extends Path<TFieldValues> = Path<TFieldValues>
>({
  field,
  defaultValues = [],
  placeholder,
  multiSelect,
  renderSelected,
  renderOption,
  className,
  onCreateValue
}: ComboBoxProps<TItem, TFieldValues, TName>) {
  const [open, setOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [localValues, setLocalValues] = useState<TItem[]>(defaultValues || []);

  // Update localValues when defaultValues changes
  useEffect(() => {
    if (defaultValues) {
      setLocalValues(defaultValues);
    }
  }, [JSON.stringify(defaultValues)]);

  const filteredItems = localValues.filter((value) =>
    value.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getSelectedItems = (): TItem[] => {
    if (!field.value) return [];
    if (multiSelect && Array.isArray(field.value)) {
      return field.value
        .map((id: string) => localValues.find((item) => item.id === id)!)
        .filter(Boolean);
    }
    const item = localValues.find((item) => item.id === field.value);
    return item ? [item] : [];
  };

  const handleSelect = (value: TItem) => {
    if (multiSelect) {
      const currentValue = (field.value as string[]) || [];
      const newValue = currentValue.includes(value.id)
        ? currentValue.filter((id) => id !== value.id)
        : [...currentValue, value.id];
      field.onChange(newValue);
    } else {
      field.onChange(field.value === value.id ? null : value.id);
      setOpen(false);
    }
    setSearchQuery('');
  };

  const handleCreateValue = async () => {
    if (!onCreateValue || !searchQuery.trim()) return;

    try {
      setIsCreating(true);
      const newItem = await onCreateValue(searchQuery.trim());

      // Optimistically update the local values
      setLocalValues((prev) => [...prev, newItem]);

      if (multiSelect) {
        const currentValue = (field.value as string[]) || [];
        field.onChange([...currentValue, newItem.id]);
      } else {
        field.onChange(newItem.id);
        setOpen(false);
      }

      setSearchQuery('');
    } catch (error) {
      console.error('Error creating new value:', error);
    } finally {
      setIsCreating(false);
    }
  };

  const canCreateValue =
    onCreateValue &&
    searchQuery.trim() !== '' &&
    !localValues.some(
      (item) => item.name.toLowerCase() === searchQuery.toLowerCase()
    );

  return (
    <FormItem className="flex flex-col">
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <FormControl>
            <Button
              variant="outline"
              role="combobox"
              size="sm"
              aria-expanded={open}
              className={cn(
                'min-w-[240px] justify-between',
                'px-2',
                !field.value && 'text-muted-foreground'
              )}
            >
              <div className="flex gap-1 flex-wrap">
                {getSelectedItems().length > 0 ? (
                  <ScrollArea className="w-full" type="scroll">
                    <div className="flex gap-1">
                      {getSelectedItems().map((item, index) => (
                        <span
                          key={item.id}
                          className="flex items-center gap-1 whitespace-nowrap"
                        >
                          {renderSelected ? renderSelected(item) : item.name}
                          {index < getSelectedItems().length - 1 &&
                            !renderSelected &&
                            ', '}
                        </span>
                      ))}
                    </div>
                    <ScrollBar orientation="horizontal" />
                  </ScrollArea>
                ) : (
                  <span>{placeholder || 'Select...'}</span>
                )}
              </div>
              <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
            </Button>
          </FormControl>
        </PopoverTrigger>
        <PopoverContent
          className="w-[300px] p-0"
          style={{ pointerEvents: 'auto' }}
        >
          <Command>
            <CommandInput
              placeholder={placeholder || 'Search...'}
              value={searchQuery}
              onValueChange={setSearchQuery}
            />
            <CommandList>
              <CommandEmpty>
                {canCreateValue ? (
                  <div className="py-2 px-1">
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full justify-start text-sm"
                      onClick={handleCreateValue}
                      disabled={isCreating}
                    >
                      <PlusCircle className="mr-2 h-4 w-4" />
                      Create "{searchQuery}"
                    </Button>
                  </div>
                ) : (
                  'None found.'
                )}
              </CommandEmpty>
              <CommandGroup>
                {filteredItems.map((value) => {
                  const isSelected = multiSelect
                    ? ((field.value as string[]) || []).includes(value.id)
                    : field.value === value.id;

                  return (
                    <CommandItem
                      key={value.id}
                      value={value.name}
                      onSelect={() => handleSelect(value)}
                    >
                      {renderOption ? (
                        renderOption(value, isSelected)
                      ) : (
                        <div className="flex items-center gap-2 flex-1">
                          {value.name}
                          <Check
                            className={cn(
                              'ml-auto',
                              isSelected ? 'opacity-100' : 'opacity-0'
                            )}
                          />
                        </div>
                      )}
                    </CommandItem>
                  );
                })}
              </CommandGroup>
              {canCreateValue && (
                <>
                  <CommandSeparator />
                  <CommandGroup>
                    <CommandItem onSelect={handleCreateValue}>
                      <PlusCircle className="mr-2 h-4 w-4" />
                      Create "{searchQuery}"
                    </CommandItem>
                  </CommandGroup>
                </>
              )}
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
      <FormMessage />
    </FormItem>
  );
}
