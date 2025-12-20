import { FastifyInstance } from "fastify";
import {
    changeJobApplicationStatus,
    createJobApplication,
    deleteJobApplication,
    getApplicationsSummary,
    getJobApplicationById,
    listJobApplications,
    updateJobApplication,
} from "./job-application.service"
import z from "zod";
import { ApplicationStatus } from "@prisma/client";

const statusEnum = z.nativeEnum(ApplicationStatus)

export async function JobApplicationRoutes(app: FastifyInstance){
    //post
    app.post(
        "/applications",
        { onRequest: [app.authenticate] },
        async(req, res) => {
            const bodySchema = z.object({
                company: z.string().min(1),
                role: z.string().min(1),
                jobUrl: z.string().url().optional(),
                location: z.string().optional(),
                notes: z.string().optional(),
                currentStatus: statusEnum.optional(),
                salaryMax: z.number().int().nonnegative().optional(),
                salaryMin: z.number().int().nonnegative().optional(),
                currency: z.string().min(1).optional()
            })

            const body = bodySchema.parse(req.body)

            const userId = req.user.sub
            const created = await createJobApplication({userId, ...body})
            return res.code(201).send({application: created})
        }
    )

    //get with filter
    app.get(
        "/applications",
        {onRequest: [app.authenticate]},
        async(req, res) => {
            const querySchema = z.object({
                status: statusEnum.optional(),
                company: z.string().optional(),
                role: z.string().optional(),
                q: z.string().optional(),
                page: z.coerce.number().int().min(1).optional(),
                limit: z.coerce.number().int().min(1).max(100).optional(),
                sortBy: z.enum(["createdAt", "updatedAt", "appliedAt"]).optional(),
                order: z.enum(["asc", "desc"]).optional(),
            })

            const query = querySchema.parse(req.query)
            const userId = req.user.sub

            const result = await listJobApplications({userId, ...query})
            
            return res.code(200).send(result)
            
        }
    
    )

    //get grouped summary by application status
    app.get(
        "/applications/summary",
        {onRequest: [app.authenticate]},
        async(req, res) => {
            const userId = req.user.sub
            const summary = await getApplicationsSummary(userId)
            
            return res.code(200).send({"summary": summary})
        }
    )

    //get one application (with statusHistory)
    app.get(
        "/applications/:id",
        {onRequest: [app.authenticate]},
        async(req, res)=>{ 
            const paramsSchema = z.object({
                id: z.string().uuid()
            })
            const { id } = paramsSchema.parse(req.params)

            const userId = req.user.sub
            const objectJobApplication = await getJobApplicationById(userId, id)
            return res.code(200).send({application: objectJobApplication})
        }
    )
   
    //delete
    app.delete(
        "/applications/:id",
        { onRequest: [app.authenticate]},
        async(req, res) => {
            const paramsSchema = z.object({ id: z.string().uuid()})
            const { id } = paramsSchema.parse(req.params)
            
            const userId = req.user.sub
            const result = await deleteJobApplication(id, userId)
            return res.code(200).send(result)
        }
        
    )
    

    //update all info of job application
    app.put(
        "/applications/:id",
        {onRequest: [app.authenticate]},
        async(req, res)=>{ 
    
            //getting id of application
            const paramsSchema = z.object({ id: z.string().uuid() })
            const { id } = paramsSchema.parse(req.params)
    
            //getting user id
            const userId = req.user.sub
    
            //getting object
            const bodySchema = z.object({
                company: z.string().min(1).optional(),
                role: z.string().min(1).optional(),
                jobUrl: z.string().url().nullable().optional(),
                location: z.string().nullable().optional(),
                notes: z.string().nullable().optional(),
                currentStatus: statusEnum.optional(),
                salaryMin: z.number().int().nonnegative().nullable().optional(),
                salaryMax: z.number().int().nonnegative().nullable().optional(),
                currency: z.string().min(1).nullable().optional(),
                appliedAt: z.union([z.coerce.date(), z.string().datetime()]).nullable().optional(),
                reason: z.string().optional(),
            })
            const body = bodySchema.parse(req.body)
    
            const updated = await updateJobApplication({userId, id, ...body})
            return res.code(200).send({application: updated})
        }
    )

    //update status of job application
    app.put(
        "/applications/:id/status",
        {onRequest: [app.authenticate]},
        async(req, res) => {
            const paramsSchema = z.object({ id: z.string().uuid() })
            const { id } = paramsSchema.parse(req.params)

            const bodySchema = z.object({
                toStatus: statusEnum,
                reason: z.string().optional(),
            })
            const body = bodySchema.parse(req.body)

            const userId = req.user.sub

            const updateObject = await changeJobApplicationStatus({
                userId,
                id,
                toStatus: body.toStatus,
                reason: body.reason
            })

            return res.code(200).send({application: updateObject})
        }
    )
}

