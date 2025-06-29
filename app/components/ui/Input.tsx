import { forwardRef } from 'react';
import { classNames } from '~/utils/classNames';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {}

const Input = forwardRef<HTMLInputElement, InputProps>(({ className, type, ...props }, ref) => {
  return (
    <input
      type={type}
      className={classNames(
        'flex h-10 w-full rounded-md border border-bit-elements-border bg-bit-elements-background px-3 py-2 text-sm ring-offset-bit-elements-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-bit-elements-textSecondary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-bit-elements-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50',
        className,
      )}
      ref={ref}
      {...props}
    />
  );
});

Input.displayName = 'Input';

export { Input };
