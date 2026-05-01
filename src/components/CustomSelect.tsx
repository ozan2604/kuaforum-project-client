import React from 'react';
import { Listbox, ListboxButton, ListboxOption, ListboxOptions } from '@headlessui/react';
import { Check, ChevronDown } from 'lucide-react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}

export interface SelectOption {
    value: string | number;
    label: string;
}

interface CustomSelectProps {
    options: SelectOption[];
    value: string | number;
    onChange: (value: string | number) => void;
    placeholder?: string;
    label?: string;
    className?: string;
    /**
     * default  — full width, gray-50 bg, used for filter selects
     * compact  — auto width, white bg, shadow-sm, used for inline selects
     */
    size?: 'default' | 'compact';
    disabled?: boolean;
}

export const CustomSelect: React.FC<CustomSelectProps> = ({
    options,
    value,
    onChange,
    placeholder = 'Seçiniz',
    label,
    className,
    size = 'default',
    disabled = false,
}) => {
    const selected = options.find(o => o.value === value);
    const isCompact = size === 'compact';

    return (
        <div className={cn(isCompact ? 'inline-block' : 'w-full', className)}>
            {label && !isCompact && (
                <label className="block text-xs font-medium text-gray-700 mb-1">
                    {label}
                </label>
            )}
            <Listbox value={value} onChange={onChange} disabled={disabled}>
                <div className="relative">
                    <ListboxButton
                        className={cn(
                            'group relative cursor-pointer rounded-lg border bg-white text-left text-sm text-gray-700',
                            'transition-all duration-150',
                            'hover:border-gray-300',
                            'focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500/20 focus-visible:border-primary-400',
                            'data-[open]:border-primary-400 data-[open]:ring-2 data-[open]:ring-primary-500/20',
                            'disabled:opacity-60 disabled:cursor-not-allowed disabled:bg-gray-50',
                            isCompact
                                ? 'w-auto min-w-[5rem] px-3 py-1.5 pr-8 border-gray-200 shadow-sm'
                                : 'w-full px-3 py-2 pr-9 border-gray-200 bg-gray-50',
                        )}
                    >
                        <span className={cn('block truncate', !selected && 'text-gray-400')}>
                            {selected ? selected.label : placeholder}
                        </span>
                        <span className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-2.5">
                            <ChevronDown
                                className="h-4 w-4 text-gray-400 transition-transform duration-200 group-data-[open]:rotate-180"
                                aria-hidden="true"
                            />
                        </span>
                    </ListboxButton>

                    <ListboxOptions
                        transition
                        className={cn(
                            'absolute z-50 mt-1 max-h-60 overflow-auto',
                            'rounded-xl bg-white py-1',
                            'shadow-xl ring-1 ring-gray-200/80 focus:outline-none text-sm',
                            // HUI v2 built-in transition
                            'transition duration-100 ease-in',
                            'data-[closed]:opacity-0 data-[closed]:scale-95',
                            isCompact ? 'min-w-[6rem] w-auto' : 'w-full',
                        )}
                    >
                        {options.map((opt) => (
                            <ListboxOption
                                key={opt.value}
                                value={opt.value}
                                className={({ active, selected: sel }) =>
                                    cn(
                                        'relative cursor-pointer select-none py-2.5 pl-9 pr-4 transition-colors duration-75',
                                        active
                                            ? 'bg-primary-600 text-white'
                                            : sel
                                            ? 'bg-primary-50 text-primary-700'
                                            : 'text-gray-700 hover:bg-gray-50',
                                    )
                                }
                            >
                                {({ selected: sel, active }) => (
                                    <>
                                        <span className={cn('block truncate', sel ? 'font-semibold' : 'font-normal')}>
                                            {opt.label}
                                        </span>
                                        {sel && (
                                            <span
                                                className={cn(
                                                    'absolute inset-y-0 left-0 flex items-center pl-2.5',
                                                    active ? 'text-white' : 'text-primary-600',
                                                )}
                                            >
                                                <Check className="h-4 w-4" aria-hidden="true" />
                                            </span>
                                        )}
                                    </>
                                )}
                            </ListboxOption>
                        ))}
                    </ListboxOptions>
                </div>
            </Listbox>
        </div>
    );
};
