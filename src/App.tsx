import { AppShell } from "@/components/layout/AppShell";
import { Toaster } from "@/components/ui/sonner";

function App() {
  return (
    <>
      <AppShell />
      <Toaster richColors position="top-right" />
    </>
  );
}

export default App;