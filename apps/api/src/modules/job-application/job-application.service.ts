import { ApplicationStatus } from "@prisma/client"
import { prisma } from "../../lib/prisma"
import { AppError } from "../../errors/app-error"

type createJobApplicationInput = {
  userId: string
  company: string
  role: string
  jobUrl?: string
  location?: string
  notes?: string
  salaryMax?: number,
  salaryMin?: number,
  currency?: string
}

export async function createJobApplication(input: createJobApplicationInput){
    const jobApplicationObject = await prisma.jobApplication.create({
        data:{
            userId: input.userId,
            company: input.company,
            role: input.role,
            jobUrl: input.jobUrl,
            location: input.location,
            notes: input.notes,
            currency: input.currency,
            salaryMin: input.salaryMin,
            salaryMax: input.salaryMax
        },
        select:{
            id: true,
            userId: true,
            company: true,
            role: true,
            jobUrl: true,
            location: true,
            notes: true,
            currency: true,
            salaryMin: true,
            salaryMax: true,
            createdAt: true,
            updatedAt: true,
            currentStatus: true,
        }
    })

    //create the first history of application
    await prisma.statusHistory.create({
        data: {
            jobApplicationId: jobApplicationObject.id,
            fromStatus: null,
            toStatus: jobApplicationObject.currentStatus,
            reason: "Created"
        }
    })

    return jobApplicationObject
}

type listJobApplicationsInput = {
    userId: string,
    status?: ApplicationStatus,
    company?: string,
    role?: string,
    q?: string
    page?: number,
    limit?: number
}

//from current user
export async function listJobApplications(input: listJobApplicationsInput){
    const page = input.page ?? 1
    const limit = input.limit ?? 20
    const skip = (page-1) * limit

    const where: any = { userId: input.userId}

    if(input.status){
        where.currentStatus = input.status
    }

    if(input.company){
        where.company = { contains: input.company, mode: "insensitive" }
    }
    if(input.role){
        where.role = { contains: input.role, mode: "insensitive" }
    }

    if(input.q){
        where.OR = [
            { company: { contains: input.q, mode: "insensitive" } },
            { role: { contains: input.q, mode: "insensitive" } },
            { location: { contains: input.q, mode: "insensitive" } },
        ]
    }

    //when find itens
    const [items, total] = await Promise.all([
        prisma.jobApplication.findMany({
            where,
            orderBy: {createdAt: "desc"},
            skip,
            take: limit,
            select: {
                id: true,
                company: true,
                role: true,
                salaryMax: true,
                salaryMin: true,
                location: true,
                currentStatus: true,
                createdAt: true,
                updatedAt: true
            },
        }),
        
        prisma.jobApplication.count({ where })
    ])

    return {
        items,
        page,
        limit,
        total,
        totalPages: Math.ceil( total / limit )
    }
}


//get single application
export async function getJobApplicationById(userId: string, id: string){
    const singleJobApplication = await prisma.jobApplication.findFirst({
        where: {id, userId},
        select: {
            id: true,
            company: true,
            role: true,
            jobUrl: true,
            location: true,
            notes: true,
            currency: true,
            salaryMin: true,
            salaryMax: true,
            createdAt: true,
            updatedAt: true,
            currentStatus: true,
            history: {
                orderBy: {changedAt: "desc"},
                select: {
                    fromStatus: true,
                    toStatus: true,
                    reason: true,
                    changedAt: true
                }
            }
        }
    })
    if(!singleJobApplication){
        throw new AppError("Application not found", 404)
    }

    return singleJobApplication
}

type updateJobApplicationInput = {
  userId: string
  id: string
  company?: string
  role?: string
  jobUrl?: string | null
  location?: string | null
  notes?: string | null
  salaryMax?: number | null
  salaryMin?: number | null
  currency?: string | null
  currentStatus?: ApplicationStatus
  reason?: string
}


export async function updateJobApplication(input: updateJobApplicationInput){
    const current = await prisma.jobApplication.findFirst({
        where: {id: input.id, userId: input.userId},
        select: {id: true, currentStatus: true}
    })

    if(!current){
        throw new AppError("Application not found", 404)
    }

    const nextStatus = input.currentStatus
    const statusChanged = nextStatus && nextStatus !== current.currentStatus

    const updated = await prisma.$transaction(async (tx)=> {
        const objectJobApplication = await tx.jobApplication.update({
            where: {id: current.id},
            data: {
                company: input.company,
                role: input.role,
                jobUrl: input.jobUrl ?? undefined,
                location: input.location ?? undefined,
                notes: input.notes ?? undefined,
                currentStatus: input.currentStatus,
                salaryMin: input.salaryMin ?? undefined,
                salaryMax: input.salaryMax ?? undefined,
                currency: input.currency ?? undefined,
            },
            select: {
                id: true,
                company: true,
                role: true,
                jobUrl: true,
                location: true,
                notes: true,
                currentStatus: true,
                salaryMin: true,
                salaryMax: true,
                currency: true,
                createdAt: true,
                updatedAt: true,
            }
        })

        if(statusChanged){
            await tx.statusHistory.create({
                data: {
                    jobApplicationId: objectJobApplication.id,
                    fromStatus: current.currentStatus,
                    toStatus: objectJobApplication.currentStatus,
                    reason: input.reason,
                }
            })
        }
        return objectJobApplication
    })
    return updated
}

export async function deleteJobApplication(id: string, userId: string){
    const exists = await prisma.jobApplication.findFirst({
        where:{id, userId},
        select: {id: true, userId: true}
    })

    if(!exists){
        throw new AppError("Job application not found", 404)
    }

    await prisma.jobApplication.delete({
        where: {id}
    })
    return {ok: true}
}