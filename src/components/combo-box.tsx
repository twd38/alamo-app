"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command"
import { Check, ChevronsUpDown } from "lucide-react"
import { cn } from "@/lib/utils"
import { FormItem, FormControl, FormMessage } from "@/components/ui/form"
import { ControllerRenderProps, FieldValues, Path } from "react-hook-form"
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area"

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
    className
}: ComboBoxProps<TItem, TFieldValues, TName>) {
    const [open, setOpen] = useState(false)
    const [searchQuery, setSearchQuery] = useState("")
    
    const filteredItems = defaultValues.filter((value) => 
        value.name.toLowerCase().includes(searchQuery.toLowerCase())
    )

    const getSelectedItems = (): TItem[] => {
        if (!field.value) return [];
        if (multiSelect && Array.isArray(field.value)) {
            return field.value.map((id: string) => defaultValues.find(item => item.id === id)!).filter(Boolean);
        }
        const item = defaultValues.find(item => item.id === field.value);
        return item ? [item] : [];
    }

    const handleSelect = (value: TItem) => {
        if (multiSelect) {
            const currentValue = (field.value as string[]) || [];
            const newValue = currentValue.includes(value.id)
                ? currentValue.filter(id => id !== value.id)
                : [...currentValue, value.id];
            field.onChange(newValue);
        } else {
            field.onChange(field.value === value.id ? null : value.id);
            setOpen(false);
        }
        setSearchQuery("");
    }
    
    return (
        <FormItem className="flex flex-col">
            <Popover open={open} onOpenChange={setOpen}>
                <PopoverTrigger asChild>
                    <FormControl>
                        <Button
                            variant="outline"
                            role="combobox"
                            aria-expanded={open}
                            className={cn(
                                "min-w-[240px] justify-between",
                                !field.value && "text-muted-foreground"
                            )}
                        >
                            <div className="flex gap-1 flex-wrap">
                                {getSelectedItems().length > 0 ? (
                                    <ScrollArea className="w-full" type="scroll">
                                        <div className="flex gap-1">
                                            {getSelectedItems().map((item, index) => (
                                                <span key={item.id} className="flex items-center gap-1 whitespace-nowrap">
                                                    {renderSelected ? renderSelected(item) : item.name}
                                                    {(index < getSelectedItems().length - 1 && !renderSelected) && ", "}
                                                </span>
                                            ))}
                                        </div>
                                        <ScrollBar orientation="horizontal" />
                                    </ScrollArea>
                                ) : (
                                    <span>{placeholder || "Select..."}</span>
                                )}
                            </div>
                            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                        </Button>
                    </FormControl>
                </PopoverTrigger>
                <PopoverContent className="w-[300px] p-0" style={{ pointerEvents: "auto" }}>
                    <Command>
                        <CommandInput 
                            placeholder={placeholder || "Search..."}
                            value={searchQuery}
                            onValueChange={setSearchQuery}
                        />
                        <CommandList>
                            <CommandEmpty>None found.</CommandEmpty>
                            <CommandGroup>
                                {filteredItems.map((value) => {
                                    const isSelected = multiSelect 
                                        ? (field.value as string[] || []).includes(value.id)
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
                                                            "ml-auto",
                                                            isSelected ? "opacity-100" : "opacity-0"
                                                        )}
                                                    />
                                                </div>
                                            )}
                                        </CommandItem>
                                    )
                                })}
                            </CommandGroup>
                        </CommandList>
                    </Command>
                </PopoverContent>
            </Popover>
            <FormMessage />
        </FormItem>
    );
}