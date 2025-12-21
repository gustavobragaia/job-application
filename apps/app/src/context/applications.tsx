import { createContext, PropsWithChildren, useContext, useMemo, useState } from "react";

//took from prisma
export type ApplicationStatus =
  | "APPLIED"
  | "OA"
  | "INTERVIEW"
  | "OFFER"
  | "REJECTED";

//show with right label on home
export const STATUS_LABEL: Record<ApplicationStatus, string> = {
  APPLIED: "Aplicado",
  OA: "Online Assessment",
  INTERVIEW: "Entrevista",
  OFFER: "Oferta",
  REJECTED: "Rejeitado",
};

export type JobApplicationObject = {
    id: string;

    // no mobile (fase 3), você pode não ter auth ainda
    userId?: string;

    company: string;
    role: string;
    jobUrl?: string | null;
    location?: string | null;
    notes?: string | null;

    currentStatus: ApplicationStatus;
    appliedAt?: string | null; // DateTime -> string ISO

    currency?: string | null;
    salaryMin?: number | null;
    salaryMax?: number | null;

    createdAt: string; // ISO
    updatedAt: string; // ISO
}

type CreateJobApplicationInput = {
    company: string;
    role: string;
    currentStatus: ApplicationStatus;
    jobUrl?: string | null;
    location?: string | null;
    notes?: string | null;
    appliedAt?: string | null;
    currency?: string | null;
    salaryMin?: number | null;
    salaryMax?: number | null;
}

type UpdateJobApplicationInput = Partial<
  Omit<JobApplicationObject, "id" | "createdAt" | "updatedAt">
>;

//create context contract per screen
type ApplicationsContextValue = {
    applications: JobApplicationObject[];

    createApplication: (data: CreateJobApplicationInput) => string;
    updateApplication: (id: string, patch: UpdateJobApplicationInput) => void;
    changeStatus: (id: string, toStatus: ApplicationStatus, reason?: string) => void;
    deleteApplication: (id: string) => void;
    getApplicationById: (id: string) => JobApplicationObject | undefined;
}

//create the context
const ApplicationsContext = createContext<ApplicationsContextValue | null>(null)

function newId(){
    return Math.random().toString(16).slice(2) + Date.now().toString(16);
}

export function ApplicationsProvider({children}: PropsWithChildren){
    //provider with objects
    const [applications, setApplications] = useState<JobApplicationObject[]>([])

    function createApplication(data: CreateJobApplicationInput){
        const id = newId()
        const now = new Date().toISOString()

        const app: JobApplicationObject = {
            id,
            company: data.company.trim(),
            role: data.role.trim(),
            jobUrl: data.jobUrl ?? null,
            location: data.location ?? null,
            notes: data.notes ?? null,
            currentStatus: "APPLIED",
            appliedAt: data.appliedAt ?? null,
            currency: data.currency ?? null,
            salaryMin: data.salaryMin ?? null,
            salaryMax: data.salaryMax ?? null,
            createdAt: now,
            updatedAt: now,
        }

        setApplications((prev) => [app, ...prev])

        return id
    }
    function updateApplication(id: string, patch: UpdateJobApplicationInput){
        const now = new Date().toISOString();
        setApplications((prev) =>
            prev.map((a) => (a.id === id ? { ...a, ...patch, updatedAt: now } : a))
        );
    }
    function changeStatus(id: string, toStatus: ApplicationStatus, reason?: string) {
        // Fase 3: só atualiza o status.
        // (na fase 4/5 você usa `reason` pra gerar history ou mandar pro backend)
        updateApplication(id, { currentStatus: toStatus });
    }
    function deleteApplication(id: string) {
        setApplications((prev) => prev.filter((a) => a.id !== id));
    }

    function getApplicationById(id: string) {
        return applications.find((a) => a.id === id);
    }

    //just will change the array applications, then will reflect in all screens
    const value = useMemo(
        ()=> ({
            applications,
            createApplication,
            updateApplication,
            changeStatus,
            deleteApplication,
            getApplicationById,
        }),
        [applications]
    )

    return(
        <ApplicationsContext.Provider value={value}>
            {children}
        </ApplicationsContext.Provider>
    )
}

export function useApplications(){
    const ctx = useContext(ApplicationsContext);
    if(!ctx) throw new Error("useApplications must be use within ApplicationsProvider")
    
    return ctx
}