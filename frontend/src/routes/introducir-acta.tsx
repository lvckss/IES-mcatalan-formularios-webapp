import { createFileRoute } from '@tanstack/react-router'
import IntroduceActa from "@/components/IntroduceActa";
import Header from "@/components/Header";
import { RequireAuth } from "@/components/auth/RequireAuth";

export const Route = createFileRoute('/introducir-acta')({
  component: IntroducirActaPage,
})

function IntroducirActaPage() {
  return (
    <RequireAuth>
      <>
        <Header activeTab="Introducir por acta:" />
        <IntroduceActa />
      </>
    </RequireAuth>
  );
}