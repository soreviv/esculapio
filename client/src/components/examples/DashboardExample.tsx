import Dashboard from "@/pages/Dashboard";
import { ThemeProvider } from "@/components/ThemeProvider";

export default function DashboardExample() {
  return (
    <ThemeProvider defaultTheme="light">
      <Dashboard />
    </ThemeProvider>
  );
}
