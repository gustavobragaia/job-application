import { createContext, PropsWithChildren, useContext, useMemo, useState } from "react";
import { apiRequest } from "../lib/api";

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
  userId?: string;

  company: string;
  role: string;
  jobUrl?: string | null;
  location?: string | null;
  notes?: string | null;

  currentStatus: ApplicationStatus;
  appliedAt?: string | null;

  currency?: string | null;
  salaryMin?: number | null;
  salaryMax?: number | null;

  createdAt: string; // ISO
  updatedAt: string; // ISO
};

type CreateJobApplicationInput = {
    company: string;
    role: string;
    jobUrl?: string | null;
    location?: string | null;
    notes?: string | null;
    appliedAt?: string | null;
    currency?: string | null;
    salaryMin?: number | null;
    salaryMax?: number | null;
}

type UpdateJobApplicationInput = Partial<
  Omit<JobApplicationObject, "id" | "userId" | "createdAt" | "updatedAt">
>;

//create context contract per screen
type ApplicationsContextValue = {
    applications: JobApplicationObject[];
    isLoading: boolean;

    fetchApplications: () => Promise<void>;
    createApplication: (data: CreateJobApplicationInput) => Promise<JobApplicationObject>;
    updateApplication: (id: string, patch: UpdateJobApplicationInput) => Promise<void>;
    changeStatus: (id: string, toStatus: ApplicationStatus, reason?: string) => Promise<void>;
    deleteApplication: (id: string) => Promise<void>;
    getApplicationById: (id: string) => JobApplicationObject | undefined;
}

//create the context
const ApplicationsContext = createContext<ApplicationsContextValue | null>(null)

export function ApplicationsProvider({children}: PropsWithChildren){
    //provider with objects
    const [applications, setApplications] = useState<JobApplicationObject[]>([])
    const [isLoading, setIsLoading] = useState(false)

    //fill the array with applications
    async function fetchApplications(){
        try{
            setIsLoading(true)
            const data = await apiRequest<{items: JobApplicationObject[]}>("/applications", {
                method: "GET",
            })
            setApplications(data.items)
        }
        finally{
            setIsLoading(false)          
        }
    }

    async function createApplication(data: CreateJobApplicationInput){
        const res = await apiRequest<{application: JobApplicationObject}>("/applications", {
            method: "POST",
            body: data,
        })
        setApplications((prev) => [res.application, ...prev])
        return res.application
    }

    async function updateApplication(id: string, patch: UpdateJobApplicationInput){
        const res = await apiRequest<{application: JobApplicationObject}>(`/applications/${id}`, {
            method: "PUT",
            body: patch
        })
        setApplications((prev) =>
            prev.map((a) => (a.id === id ? { ...a, ...res.application } : a))
        );
    }

    async function changeStatus(id: string, toStatus: ApplicationStatus, reason?: string) {
        const res = await apiRequest<{application: JobApplicationObject}>(`/applications/${id}/status`, {
            method: "PUT",
            body: {toStatus, reason}
        })
        setApplications((prev) =>
            prev.map((a) => (a.id === id ? { ...a, ...res.application } : a))
        );
    }

    async function deleteApplication(id: string) {
        const data = await apiRequest(`/applications/${id}`, {
            method: "DELETE",
        })
        setApplications((prev) => prev.filter((a) => a.id !== id));
    }

    function getApplicationById(id: string) {
        return applications.find((a) => a.id === id);
    }

    //just will change the array applications, then will reflect in all screens
    const value = useMemo(
        ()=> ({
            applications,
            isLoading,
            createApplication,
            updateApplication,
            changeStatus,
            deleteApplication,
            getApplicationById,
            fetchApplications,
        }),
        [applications, isLoading]
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
