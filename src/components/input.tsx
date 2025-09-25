import { clsx } from "clsx";

export function Input({
  children,
  className,
  ...props
}: {
  children: React.ReactNode;
} & React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <label
      className={clsx(
        "flex relative border rounded-lg border-primary-300",
        className
      )}
    >
      <span className="absolute left-1 transform -translate-y-1/2  text-gray-500 bg-white p-0.5 pointer-events-none whitespace-nowrap text-xs">
        {children}
      </span>
      <input className="w-full px-3 py-2 min-w-0 h-9.5" {...props} />
    </label>
  );
}
