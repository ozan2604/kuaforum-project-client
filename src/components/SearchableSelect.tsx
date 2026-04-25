import React, { useState, useMemo } from 'react';
import { Combobox, ComboboxButton, ComboboxInput, ComboboxOption, ComboboxOptions, Transition } from '@headlessui/react';
import { Check, ChevronsUpDown, Search } from 'lucide-react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}

interface Option {
    id: number | string;
    name: string;
}

interface SearchableSelectProps {
    options: Option[];
    value: number | string | null;
    onChange: (value: any) => void;
    placeholder: string;
    label?: string;
    disabled?: boolean;
    loading?: boolean;
    error?: string;
    required?: boolean;
}

export const SearchableSelect: React.FC<SearchableSelectProps> = ({
    options,
    value,
    onChange,
    placeholder,
    label,
    disabled = false,
    loading = false,
    error,
    required = false,
}) => {
    const [query, setQuery] = useState('');

    const selectedOption = useMemo(() => {
        return options.find((opt) => opt.id === value) || null;
    }, [options, value]);

    const filteredOptions = useMemo(() => {
        const sorted = [...options].sort((a, b) => 
            a.name.localeCompare(b.name, 'tr', { sensitivity: 'base' })
        );

        if (query === '') return sorted;

        return sorted.filter((opt) =>
            opt.name
                .toLowerCase()
                .replace(/i/g, 'İ')
                .replace(/ı/g, 'I')
                .includes(query.toLowerCase().replace(/i/g, 'İ').replace(/ı/g, 'I'))
        );
    }, [options, query]);

    return (
        <div className="w-full space-y-1.5">
            {label && (
                <label className="block text-sm font-semibold text-gray-700">
                    {label} {required && <span className="text-red-500">*</span>}
                </label>
            )}
            <Combobox
                value={selectedOption}
                onChange={(opt: Option | null) => {
                    if (opt) {
                        onChange(opt.id);
                        setQuery('');
                    }
                }}
                disabled={disabled || loading}
            >
                <div className="relative mt-1">
                    <div className={cn(
                        "relative w-full cursor-default overflow-hidden rounded-lg border bg-white text-left transition-all focus-within:ring-2 focus-within:ring-primary-500/20 sm:text-sm",
                        error ? "border-red-500" : "border-gray-300 focus-within:border-primary-500",
                        (disabled || loading) && "bg-gray-50 opacity-75"
                    )}>
                        <ComboboxInput
                            className="w-full border-none py-2.5 pl-10 pr-10 text-sm leading-5 text-gray-900 focus:ring-0 outline-none"
                            displayValue={(opt: Option) => opt?.name || ''}
                            onChange={(event) => setQuery(event.target.value)}
                            placeholder={placeholder}
                        />
                        <div className="absolute inset-y-0 left-0 flex items-center pl-3">
                            <Search className="h-4 w-4 text-gray-400" aria-hidden="true" />
                        </div>
                        <ComboboxButton className="absolute inset-y-0 right-0 flex items-center pr-2">
                            {loading ? (
                                <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary-500 border-t-transparent" />
                            ) : (
                                <ChevronsUpDown
                                    className="h-4 w-4 text-gray-400"
                                    aria-hidden="true"
                                />
                            )}
                        </ComboboxButton>
                    </div>
                    <Transition
                        as={React.Fragment}
                        leave="transition ease-in duration-100"
                        leaveFrom="opacity-100"
                        leaveTo="opacity-0"
                        afterLeave={() => setQuery('')}
                    >
                        <ComboboxOptions className="absolute z-50 mt-1 max-h-60 w-full overflow-auto rounded-md bg-white py-1 text-base shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none sm:text-sm">
                            {filteredOptions.length === 0 && query !== '' ? (
                                <div className="relative cursor-default select-none py-2 px-4 text-gray-700">
                                    Sonuç bulunamadı.
                                </div>
                            ) : (
                                filteredOptions.map((opt) => (
                                    <ComboboxOption
                                        key={opt.id}
                                        className={({ active }) =>
                                            cn(
                                                "relative cursor-default select-none py-2 pl-10 pr-4",
                                                active ? "bg-primary-600 text-white" : "text-gray-900"
                                            )
                                        }
                                        value={opt}
                                    >
                                        {({ selected, active }) => (
                                            <>
                                                <span className={cn(
                                                    "block truncate",
                                                    selected ? "font-medium" : "font-normal"
                                                )}>
                                                    {opt.name}
                                                </span>
                                                {selected ? (
                                                    <span className={cn(
                                                        "absolute inset-y-0 left-0 flex items-center pl-3",
                                                        active ? "text-white" : "text-primary-600"
                                                    )}>
                                                        <Check className="h-4 w-4" aria-hidden="true" />
                                                    </span>
                                                ) : null}
                                            </>
                                        )}
                                    </ComboboxOption>
                                ))
                            )}
                        </ComboboxOptions>
                    </Transition>
                </div>
            </Combobox>
            {error && <p className="text-xs text-red-500">{error}</p>}
        </div>
    );
};
