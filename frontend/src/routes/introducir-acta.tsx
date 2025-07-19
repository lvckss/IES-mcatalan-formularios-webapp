import { createFileRoute } from '@tanstack/react-router'
import IntroduceActa from "@/components/IntroduceActa";

export const Route = createFileRoute('/introducir-acta')({
  component: IntroducirActa,
})

function IntroducirActa() {
  return <IntroduceActa />
}