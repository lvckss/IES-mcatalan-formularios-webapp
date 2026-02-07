// configurar.tsx
import { createFileRoute } from '@tanstack/react-router'
import AppSettingsPanel from '@/components/SettingsPanel/AppSettingsPanel'
import Header from "@/components/Header";
import { RequireAuth } from "@/components/auth/RequireAuth";
import { RequireAdmin } from "@/components/auth/RequireAdmin";

export const Route = createFileRoute('/configurar')({
  component: RouteComponent,
})

function RouteComponent() {
  return (
    <RequireAdmin>
      <div className="h-dvh overflow-hidden flex flex-col">
        <Header activeTab="Configurar:" />
        <div className="flex-1 min-h-0 overflow-hidden">
          <AppSettingsPanel />
        </div>
      </div>
    </RequireAdmin>
  );
}
