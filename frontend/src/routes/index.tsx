import { createFileRoute } from '@tanstack/react-router';
import Estudiantes from "@/components/StudentTable/Students";
import Header from "@/components/Header";

export const Route = createFileRoute('/')({
  component: IndexEstudiantesPage,
})

function IndexEstudiantesPage() {
  return (
    <>
      <Header activeTab='Estudiantes:'></Header>
      <Estudiantes />
    </>
  )
}