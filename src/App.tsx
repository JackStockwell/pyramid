import { ThemeProvider } from "next-themes";
import { Route, Routes } from "react-router-dom";
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeToggle } from "@/components/ThemeToggle";
import Home from "@/pages/Home";
import Room from "@/pages/Room";

export default function App() {
  return (
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
      <TooltipProvider>
        <div className="min-h-svh bg-background text-foreground">
          <ThemeToggle />
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/room/:code" element={<Room />} />
          </Routes>
        </div>
        <Toaster richColors position="top-center" />
      </TooltipProvider>
    </ThemeProvider>
  );
}
