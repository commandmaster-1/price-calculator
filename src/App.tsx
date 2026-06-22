import { AppShell } from "@/components/layout/AppShell";
import { DatabaseSetupScreen } from "@/components/setup/DatabaseSetupScreen";
import { Toaster } from "@/components/ui/sonner";
import { useDatabaseConfig } from "@/hooks/useDatabaseConfig";
import { check } from "@tauri-apps/plugin-updater";
import { relaunch } from "@tauri-apps/plugin-process";

const update = await check();
if (update) {
  await update.downloadAndInstall();
  await relaunch();
}

function AppContent() {
  const { configured, loading, initialize, pickFile } = useDatabaseConfig();

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <p className="text-sm text-muted-foreground">Wird geladen…</p>
      </div>
    );
  }

  if (!configured) {
    return (
      <DatabaseSetupScreen onComplete={initialize} onPickFile={pickFile} />
    );
  }

  return <AppShell />;
}

function App() {
  return (
    <>
      <AppContent />
      <Toaster richColors position="top-right" />
    </>
  );
}

export default App;