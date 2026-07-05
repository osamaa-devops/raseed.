import { Printer } from "lucide-react";
import { AppButton } from "../ui/AppButton";

type PrintButtonProps = {
  label?: string;
  disabled?: boolean;
};

export function PrintButton({ label = "طباعة", disabled }: PrintButtonProps) {
  return (
    <AppButton icon={Printer} disabled={disabled} onClick={() => window.print()}>
      {label}
    </AppButton>
  );
}
