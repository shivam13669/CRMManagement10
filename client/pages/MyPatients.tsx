import { Users } from "lucide-react";
import { DoctorLayout } from "../components/DoctorLayout";
import PlaceholderPage from "./PlaceholderPage";

export default function MyPatients() {
  return (
    <DoctorLayout>
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="rounded-lg border bg-card text-card-foreground shadow-sm max-w-md mx-auto text-center">
          <div className="flex flex-col space-y-1.5 p-6">
            <div className="mx-auto w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mb-4">
              <Users className="w-8 h-8 text-primary" />
            </div>
            <h3 className="font-semibold tracking-tight text-2xl">
              My Patients
            </h3>
            <p className="text-muted-foreground text-base">
              Manage your assigned patients, view their medical history, and
              track treatment progress.
            </p>
          </div>
          <div className="p-6 pt-0 space-y-4">
            <p className="text-sm text-gray-600">
              This page is currently under development. Continue prompting to
              have me implement the full functionality for this section.
            </p>
            <button className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground hover:bg-primary/90 h-10 px-4 py-2 w-full">
              Request Implementation
              <svg
                width="24"
                height="24"
                className="lucide lucide-arrow-right w-4 h-4 ml-2"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  d="M5 12h14m-7-7 7 7-7 7"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </DoctorLayout>
  );
}
