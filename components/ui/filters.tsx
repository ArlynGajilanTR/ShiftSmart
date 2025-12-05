'use client';

import * as React from 'react';
import { X, ChevronDown, Plus } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

// Filter types
export interface FilterOption {
  value: string;
  label: string;
  icon?: React.ReactNode;
}

export interface FilterFieldConfig {
  key: string;
  label: string;
  icon?: React.ReactNode;
  options: FilterOption[];
}

export interface Filter {
  field: string;
  value: string;
}

export interface FiltersProps {
  filters: Filter[];
  fields: FilterFieldConfig[];
  onChange: (filters: Filter[]) => void;
  className?: string;
}

// Helper to create a filter
export function createFilter(field: string, value: string): Filter {
  return { field, value };
}

// Filter Pill Component
function FilterPill({
  filter,
  field,
  onRemove,
  onChange,
}: {
  filter: Filter;
  field: FilterFieldConfig;
  onRemove: () => void;
  onChange: (value: string) => void;
}) {
  const selectedOption = field.options.find((opt) => opt.value === filter.value);

  return (
    <div className="flex items-center gap-0.5 rounded-md border bg-muted/50 text-sm">
      {/* Field label */}
      <div className="flex items-center gap-1.5 pl-2 pr-1 py-1 text-muted-foreground">
        {field.icon}
        <span className="font-medium">{field.label}</span>
      </div>

      {/* Value selector */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button className="flex items-center gap-1 px-2 py-1 hover:bg-muted rounded transition-colors">
            {selectedOption?.icon}
            <span>{selectedOption?.label || 'Select...'}</span>
            <ChevronDown className="h-3 w-3 opacity-50" />
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start">
          {field.options.map((option) => (
            <DropdownMenuItem
              key={option.value}
              onClick={() => onChange(option.value)}
              className="flex items-center gap-2"
            >
              {option.icon}
              {option.label}
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Remove button */}
      <button
        onClick={onRemove}
        className="p-1 hover:bg-muted rounded transition-colors text-muted-foreground hover:text-foreground"
      >
        <X className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}

// Main Filters Component
export function Filters({ filters, fields, onChange, className }: FiltersProps) {
  // Get fields that don't have active filters yet
  const availableFields = fields.filter((field) => !filters.some((f) => f.field === field.key));

  const addFilter = (fieldKey: string) => {
    const field = fields.find((f) => f.key === fieldKey);
    if (field && field.options.length > 0) {
      onChange([...filters, createFilter(fieldKey, field.options[0].value)]);
    }
  };

  const removeFilter = (index: number) => {
    onChange(filters.filter((_, i) => i !== index));
  };

  const updateFilter = (index: number, value: string) => {
    onChange(filters.map((f, i) => (i === index ? { ...f, value } : f)));
  };

  return (
    <div className={cn('flex flex-wrap items-center gap-2', className)}>
      {/* Active filter pills */}
      {filters.map((filter, index) => {
        const field = fields.find((f) => f.key === filter.field);
        if (!field) return null;

        return (
          <FilterPill
            key={`${filter.field}-${index}`}
            filter={filter}
            field={field}
            onRemove={() => removeFilter(index)}
            onChange={(value) => updateFilter(index, value)}
          />
        );
      })}

      {/* Add filter button */}
      {availableFields.length > 0 && (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm" className="h-8 border-dashed">
              <Plus className="h-3.5 w-3.5 mr-1" />
              Add Filter
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start">
            {availableFields.map((field) => (
              <DropdownMenuItem
                key={field.key}
                onClick={() => addFilter(field.key)}
                className="flex items-center gap-2"
              >
                {field.icon}
                {field.label}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      )}

      {/* Clear all button */}
      {filters.length > 0 && (
        <Button
          variant="ghost"
          size="sm"
          className="h-8 text-muted-foreground hover:text-foreground"
          onClick={() => onChange([])}
        >
          Clear all
        </Button>
      )}
    </div>
  );
}
