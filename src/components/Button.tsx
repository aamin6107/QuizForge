import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'danger' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  pill?: boolean;
  isLoading?: boolean;
  children: React.ReactNode;
}

export function Button({
  variant = 'primary',
  size = 'md',
  pill = true,
  isLoading = false,
  className = '',
  children,
  disabled,
  ...props
}: ButtonProps) {
  const baseStyles =
    'inline-flex items-center justify-center font-medium transition-all duration-150 active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none cursor-pointer';

  const sizeStyles = {
    sm: 'text-xs px-3.5 py-1.5 gap-1.5',
    md: 'text-sm px-5 py-2.5 gap-2',
    lg: 'text-base px-6 py-3.5 gap-2.5',
  }[size];

  const variantStyles = {
    primary:
      'bg-[#7B0FE8] hover:bg-[#680ec7] text-white shadow-[0_2px_8px_rgba(123,15,232,0.25)] hover:shadow-[0_4px_14px_rgba(123,15,232,0.35)]',
    secondary:
      'bg-[#EFEFEF] hover:bg-[#E5E5E5] text-neutral-900 border border-transparent hover:border-neutral-300',
    outline:
      'bg-white hover:bg-neutral-50 text-neutral-900 border border-neutral-300/90 shadow-[0_1px_2px_rgba(0,0,0,0.04)] hover:border-neutral-400',
    danger:
      'bg-red-600 hover:bg-red-700 text-white shadow-xs',
    ghost:
      'bg-transparent hover:bg-neutral-100 text-neutral-700 hover:text-black',
  }[variant];

  const roundedStyles = pill ? 'rounded-full' : 'rounded-xl';

  return (
    <button
      className={`${baseStyles} ${sizeStyles} ${variantStyles} ${roundedStyles} ${className}`}
      disabled={disabled || isLoading}
      {...props}
    >
      {isLoading ? (
        <span className="inline-block w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin mr-1" />
      ) : null}
      {children}
    </button>
  );
}
