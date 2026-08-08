import { useId } from "react";

interface InputFieldProps {
  label: string;
  name: string;
  type?: "text" | "number" | "tel" | "email";
  value: string | number;
  onChange: (value: string) => void;
  onBlur?: () => void;
  placeholder?: string;
  suffix?: string;
  min?: number;
  max?: number;
  step?: number;
  error?: string;
  required?: boolean;
  inputMode?: "text" | "numeric" | "decimal";
}

export default function InputField({
  label,
  name,
  type = "text",
  value,
  onChange,
  placeholder,
  suffix,
  min,
  max,
  step,
  error,
  required = false,
  inputMode,
  onBlur,
}: InputFieldProps) {
  const id = useId();
  const errorId = `${id}-error`;

  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={id} className="text-sm font-medium text-slate-700">
        {label}
        {required && <span className="text-destructive ml-0.5">*</span>}
      </label>
      <div className="relative">
        <input
          id={id}
          name={name}
          type={type}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onBlur={onBlur}
          placeholder={placeholder}
          min={min}
          max={max}
          step={step}
          inputMode={inputMode}
          required={required}
          aria-describedby={error ? errorId : undefined}
          aria-invalid={error ? "true" : undefined}
          className={`
            w-full rounded-xl border bg-slate-50 px-4 py-3.5 text-foreground
            placeholder:text-foreground/30
            transition-all duration-150 ease-out
            focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500
            ${error ? "border-destructive ring-1 ring-destructive/20" : "border-border"}
            ${suffix ? "pr-12" : ""}
          `}
        />
        {suffix && (
          <span className="absolute right-4 top-1/2 -translate-y-1/2 text-sm text-slate-400 font-medium pointer-events-none select-none">
            {suffix}
          </span>
        )}
      </div>
      {error && (
        <p id={errorId} role="alert" className="text-xs text-destructive mt-0.5">
          {error}
        </p>
      )}
    </div>
  );
}