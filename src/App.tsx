import { AppShell } from "@/components/layout/AppShell";
import { Toaster } from "@/components/ui/sonner";
import {check} from "@tauri-apps/plugin-updater";
import {relaunch} from "@tauri-apps/plugin-process";

const update = await check();
if (update) {
    await update.downloadAndInstall();
    await relaunch();
}

function App() {
  return (
    <>
      <AppShell />
      <Toaster richColors position="top-right" />
    </>
  );
}

export default App;