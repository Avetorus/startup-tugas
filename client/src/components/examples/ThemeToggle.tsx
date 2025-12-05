import { ThemeProvider } from "@/contexts/ThemeContext";
import { ThemeToggle } from "../layout/ThemeToggle";

export default function ThemeToggleExample() {
  return (
    <ThemeProvider>
      <ThemeToggle />
    </ThemeProvider>
  );
}
