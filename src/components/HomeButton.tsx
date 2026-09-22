import { Home } from "lucide-react";
import { Link } from "react-router-dom";
import { buttonVariants } from "@/components/ui/button";

export function HomeButton() {
  return (
    <Link
      to="/"
      aria-label="Home"
      className={buttonVariants({ variant: "ghost", size: "icon", className: "fixed top-3 left-3 z-50" })}
    >
      <Home />
    </Link>
  );
}
