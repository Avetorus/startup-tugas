import { WorkflowStepper } from "../layout/WorkflowStepper";

const orderSteps = [
  { id: "draft", label: "Draft" },
  { id: "confirmed", label: "Confirmed" },
  { id: "delivered", label: "Delivered" },
  { id: "invoiced", label: "Invoiced" },
];

export default function WorkflowStepperExample() {
  return (
    <WorkflowStepper steps={orderSteps} currentStep="confirmed" />
  );
}
