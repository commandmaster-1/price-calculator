import { useCallback, useEffect, useState } from "react";
import {
  changeDatabasePath,
  getDatabaseStatus,
  pickDatabaseFile,
  setDatabasePath,
} from "@/lib/api";
import type { DatabaseFileMode } from "@/types/database";

export function useDatabaseConfig() {
  const [configured, setConfigured] = useState(false);
  const [path, setPath] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    const status = await getDatabaseStatus();
    setConfigured(status.configured);
    setPath(status.path);
    setLoading(false);
  }, []);

  useEffect(() => {
    void refresh().catch(() => {
      setLoading(false);
    });
  }, [refresh]);

  const pickFile = useCallback(async (mode: DatabaseFileMode) => {
    return pickDatabaseFile(mode);
  }, []);

  const initialize = useCallback(
    async (databasePath: string) => {
      await setDatabasePath(databasePath);
      await refresh();
    },
    [refresh],
  );

  const changePath = useCallback(
    async (databasePath: string) => {
      await changeDatabasePath(databasePath);
      await refresh();
    },
    [refresh],
  );

  return {
    configured,
    path,
    loading,
    refresh,
    pickFile,
    initialize,
    changePath,
  };
}