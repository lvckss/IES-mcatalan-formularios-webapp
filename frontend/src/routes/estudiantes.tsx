import { createFileRoute } from '@tanstack/react-router'
import Estudiantes from "@/components/StudentTable/Students";
import Header from "@/components/Header";
import { RequireAuth } from "@/components/auth/RequireAuth";

export const Route = createFileRoute('/estudiantes')({
  component: EstudiantesPage,
})

function EstudiantesPage() {
  return (
    <RequireAuth>
      <>
        <Header activeTab="Estudiantes:" />
        <Estudiantes />
      </>
    </RequireAuth>
  );
}