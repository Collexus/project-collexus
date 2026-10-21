"use client";

import * as SelectPrimitive from "@radix-ui/react-select";
import { Check, ChevronDown } from "lucide-react";

export type SelectOption = { label: string; value: string };

type SelectFieldProps = {
  label: string;
  value: string;
  onValueChange: (value: string) => void;
  options: SelectOption[];
};

export function SelectField({ label, value, onValueChange, options }: SelectFieldProps) {
  return (
    <label className="select-wrap">
      <span>{label}</span>
      <SelectPrimitive.Root value={value} onValueChange={onValueChange}>
        <SelectPrimitive.Trigger className="select-trigger" aria-label={label}>
          <SelectPrimitive.Value />
          <SelectPrimitive.Icon className="select-chevron"><ChevronDown size={15} aria-hidden="true" /></SelectPrimitive.Icon>
        </SelectPrimitive.Trigger>
        <SelectPrimitive.Portal>
          <SelectPrimitive.Content className="select-content" position="popper" sideOffset={6} align="start">
            <SelectPrimitive.Viewport className="select-viewport">
              {options.map((option) => (
                <SelectPrimitive.Item className="select-item" value={option.value} key={option.value}>
                  <SelectPrimitive.ItemText>{option.label}</SelectPrimitive.ItemText>
                  <SelectPrimitive.ItemIndicator className="select-item-check"><Check size={14} aria-hidden="true" /></SelectPrimitive.ItemIndicator>
                </SelectPrimitive.Item>
              ))}
            </SelectPrimitive.Viewport>
          </SelectPrimitive.Content>
        </SelectPrimitive.Portal>
      </SelectPrimitive.Root>
    </label>
  );
}
