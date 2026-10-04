import { notFound } from "next/navigation";
import { WizardScreen } from "@/features/org/wizard/wizard";
import { STEPS } from "@/features/org/wizard/model";

export const metadata = { title: "Создание турнира" };

export default async function SetupStepPage({ params }: { params: Promise<{ step: string }> }) {
  const step = Number((await params).step);
  if (!Number.isInteger(step) || step < 1 || step > STEPS.length) notFound();
  return <WizardScreen step={step} />;
}
