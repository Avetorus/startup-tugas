import { ThemeProvider } from "@/contexts/ThemeContext";
import { Settings } from "../system/Settings";

export default function SettingsExample() {
  return (
    <ThemeProvider>
      <Settings />
    </ThemeProvider>
  );
}
