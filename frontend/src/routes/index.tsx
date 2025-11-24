import { createFileRoute } from '@tanstack/react-router';
import Estudiantes from "@/components/StudentTable/Students";
import Header from "@/components/Header";
import { RequireAuth } from "@/components/auth/RequireAuth";

export const Route = createFileRoute('/')({
  component: IndexEstudiantesPage,
})

function IndexEstudiantesPage() {
  return (
    <RequireAuth>
      <>
        <Header activeTab="Estudiantes:" />
        <Estudiantes />
      </>
    </RequireAuth>
  );
}