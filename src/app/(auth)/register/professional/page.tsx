import { Suspense } from "react";
import ProfessionalRegisterClient from "./professional-register-client";

export default function ProfessionalRegisterPage() {
  return (
    <Suspense
      fallback={
        <div className="py-10 text-center text-sm text-muted-foreground">
          Loading registration…
        </div>
      }
    >
      <ProfessionalRegisterClient />
    </Suspense>
  );
}
