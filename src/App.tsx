import { Route, Routes } from "react-router-dom";
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import Home from "@/pages/Home";
import Room from "@/pages/Room";

export default function App() {
  return (
    <TooltipProvider>
      <div className="min-h-svh bg-background text-foreground">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/room/:code" element={<Room />} />
        </Routes>
      </div>
      <Toaster richColors position="top-center" />
    </TooltipProvider>
  );
}
