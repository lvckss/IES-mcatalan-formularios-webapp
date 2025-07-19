import { createFileRoute } from '@tanstack/react-router'
import Estudiantes from "@/components/StudentTable/Students";

export const Route = createFileRoute('/estudiantes')({
  component: EstudiantesPage,
})

function EstudiantesPage() {
  return <Estudiantes />
}