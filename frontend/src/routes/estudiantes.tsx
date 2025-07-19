import { createFileRoute } from '@tanstack/react-router'
import Estudiantes from "@/components/StudentTable/Students";
import Header from "@/components/Header";

export const Route = createFileRoute('/estudiantes')({
  component: EstudiantesPage,
})

function EstudiantesPage() {
  return (
    <>
      <Header activeTab='Estudiantes:'></Header>
      <Estudiantes />
    </>
  )
}