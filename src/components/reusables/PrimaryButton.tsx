import { cn } from "@/lib/utils";
import { Loader2 } from "lucide-react";
import Link from "next/link";

interface PrimaryButtonProps {
  children?: React.ReactNode;
  href?: string;
  className?: string;
  type?: "button" | "submit" | "reset";
  isLoading?: boolean;
  onClick?: () => void;
}

const PrimaryButton = ({ children, href, className = "", type = "submit", isLoading = false, onClick }: PrimaryButtonProps) => {

  const buttonClasses = cn("flex cursor-pointer items-center rounded-lg bg-soft px-3 lg:px-5 py-2 font-medium text-navy transition-colors duration-200 hover:bg-accent/90 hover:text-white disabled:cursor-not-allowed disabled:opacity-70", className)

  // if href is provided render link else render button
  if (href) {
    return (
      <Link href={href}>
        <div className={buttonClasses}>{children}</div>
      </Link>
    )
  }

  return (
    <button
      className={buttonClasses}
      type={type}
      onClick={onClick}
      disabled={isLoading}
    >
      {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : children}
    </button>
  )
}

export default PrimaryButton
