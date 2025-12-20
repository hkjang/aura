"use client";

import { useState, useEffect, ReactNode } from "react";
import { 
  AlertCircle, 
  CheckCircle, 
  Info,
  X,
  Eye,
  EyeOff
} from "lucide-react";
import { Input } from "@/components/ui/input";

interface ValidationRule {
  validate: (value: string) => boolean;
  message: string;
}

interface InputValidationProps {
  label: string;
  type?: "text" | "email" | "password" | "url" | "number";
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  rules?: ValidationRule[];
  required?: boolean;
  helpText?: string;
  showStrengthMeter?: boolean;
}

// Common validation rules
export const validationRules = {
  required: (fieldName: string): ValidationRule => ({
    validate: (value) => value.trim().length > 0,
    message: `${fieldName} is required`
  }),
  email: (): ValidationRule => ({
    validate: (value) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value),
    message: "Please enter a valid email address"
  }),
  minLength: (length: number): ValidationRule => ({
    validate: (value) => value.length >= length,
    message: `Must be at least ${length} characters`
  }),
  maxLength: (length: number): ValidationRule => ({
    validate: (value) => value.length <= length,
    message: `Must be no more than ${length} characters`
  }),
  url: (): ValidationRule => ({
    validate: (value) => {
      try {
        new URL(value);
        return true;
      } catch {
        return false;
      }
    },
    message: "Please enter a valid URL"
  }),
  pattern: (regex: RegExp, message: string): ValidationRule => ({
    validate: (value) => regex.test(value),
    message
  }),
  passwordStrength: (): ValidationRule => ({
    validate: (value) => {
      const hasUppercase = /[A-Z]/.test(value);
      const hasLowercase = /[a-z]/.test(value);
      const hasNumber = /[0-9]/.test(value);
      const hasSpecial = /[!@#$%^&*]/.test(value);
      const isLongEnough = value.length >= 8;
      return hasUppercase && hasLowercase && hasNumber && hasSpecial && isLongEnough;
    },
    message: "Password must include: uppercase, lowercase, number, special character, and be 8+ characters"
  })
};

export function InputValidation({
  label,
  type = "text",
  value,
  onChange,
  placeholder,
  rules = [],
  required = false,
  helpText,
  showStrengthMeter = false
}: InputValidationProps) {
  const [touched, setTouched] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState<string[]>([]);

  // Add required rule if specified
  const allRules = required 
    ? [validationRules.required(label), ...rules]
    : rules;

  // Validate on change
  useEffect(() => {
    if (touched) {
      const newErrors = allRules
        .filter(rule => !rule.validate(value))
        .map(rule => rule.message);
      setErrors(newErrors);
    }
  }, [value, touched, allRules]);

  const isValid = errors.length === 0 && touched && value.length > 0;
  const hasError = errors.length > 0 && touched;

  // Password strength calculation
  const getPasswordStrength = (password: string) => {
    let score = 0;
    if (password.length >= 8) score++;
    if (password.length >= 12) score++;
    if (/[A-Z]/.test(password)) score++;
    if (/[a-z]/.test(password)) score++;
    if (/[0-9]/.test(password)) score++;
    if (/[!@#$%^&*]/.test(password)) score++;
    
    if (score <= 2) return { label: "Weak", color: "bg-red-500", width: "33%" };
    if (score <= 4) return { label: "Medium", color: "bg-amber-500", width: "66%" };
    return { label: "Strong", color: "bg-green-500", width: "100%" };
  };

  const passwordStrength = type === "password" && showStrengthMeter 
    ? getPasswordStrength(value) 
    : null;

  return (
    <div className="space-y-2">
      <label className="text-sm font-medium flex items-center gap-1">
        {label}
        {required && <span className="text-red-500">*</span>}
      </label>

      <div className="relative">
        <Input
          type={type === "password" && showPassword ? "text" : type}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onBlur={() => setTouched(true)}
          placeholder={placeholder}
          className={`pr-10 ${
            hasError 
              ? "border-red-500 focus:ring-red-500" 
              : isValid 
                ? "border-green-500 focus:ring-green-500"
                : ""
          }`}
        />
        
        {/* Status Icon */}
        <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1">
          {type === "password" && (
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="p-1 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded"
            >
              {showPassword ? (
                <EyeOff className="w-4 h-4 text-muted-foreground" />
              ) : (
                <Eye className="w-4 h-4 text-muted-foreground" />
              )}
            </button>
          )}
          {isValid && <CheckCircle className="w-4 h-4 text-green-500" />}
          {hasError && <AlertCircle className="w-4 h-4 text-red-500" />}
        </div>
      </div>

      {/* Password Strength Meter */}
      {passwordStrength && value.length > 0 && (
        <div className="space-y-1">
          <div className="h-1.5 bg-zinc-200 dark:bg-zinc-700 rounded-full overflow-hidden">
            <div 
              className={`h-full ${passwordStrength.color} transition-all duration-300 rounded-full`}
              style={{ width: passwordStrength.width }}
            />
          </div>
          <p className="text-xs text-muted-foreground">
            Password strength: <span className="font-medium">{passwordStrength.label}</span>
          </p>
        </div>
      )}

      {/* Error Messages */}
      {hasError && (
        <div className="space-y-1">
          {errors.map((error, idx) => (
            <p key={idx} className="text-xs text-red-500 flex items-center gap-1">
              <AlertCircle className="w-3 h-3" />
              {error}
            </p>
          ))}
        </div>
      )}

      {/* Help Text */}
      {helpText && !hasError && (
        <p className="text-xs text-muted-foreground flex items-center gap-1">
          <Info className="w-3 h-3" />
          {helpText}
        </p>
      )}
    </div>
  );
}

// Permission Request Component
interface PermissionRequestProps {
  resource: string;
  requiredPermission: string;
  onRequest: () => void;
  onCancel: () => void;
}

export function PermissionRequest({ 
  resource, 
  requiredPermission, 
  onRequest, 
  onCancel 
}: PermissionRequestProps) {
  return (
    <div className="p-4 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg">
      <div className="flex items-start gap-3">
        <AlertCircle className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
        <div className="flex-1">
          <h4 className="font-medium text-amber-700 dark:text-amber-300">
            Permission Required
          </h4>
          <p className="text-sm text-amber-600 dark:text-amber-400 mt-1">
            You need <strong>{requiredPermission}</strong> permission to access {resource}.
          </p>
          
          <div className="mt-4 p-3 bg-white dark:bg-zinc-900 rounded border border-amber-200 dark:border-amber-800">
            <p className="text-sm font-medium mb-2">To request access:</p>
            <ol className="text-sm text-muted-foreground space-y-1 list-decimal list-inside">
              <li>Click &quot;Request Access&quot; below</li>
              <li>Your admin will receive a notification</li>
              <li>You&apos;ll be notified when access is granted</li>
            </ol>
          </div>
          
          <div className="flex items-center gap-2 mt-4">
            <button
              onClick={onRequest}
              className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white text-sm font-medium rounded-lg transition-colors"
            >
              Request Access
            </button>
            <button
              onClick={onCancel}
              className="px-4 py-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
