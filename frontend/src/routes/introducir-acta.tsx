import { createFileRoute } from '@tanstack/react-router'
import IntroduceActa from "@/components/IntroduceActa";
import Header from "@/components/Header";

export const Route = createFileRoute('/introducir-acta')({
  component: IntroducirActa,
})

function IntroducirActa() {
  return (
    <>
      <Header activeTab='Introducir por acta:'></Header>
      <IntroduceActa />
    </>
  )
}