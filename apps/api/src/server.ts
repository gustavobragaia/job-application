import Fastify from "fastify";
import cors from "@fastify/cors";
import jwt from "@fastify/jwt"
import "dotenv/config"
import sensible from "@fastify/sensible"
import { authRoutes } from "./modules/auth/auth.route";
import authPlugin from "./plugins/auth"
import { ZodError } from "zod";
import { AppError } from "./errors/app-error";
import { JobApplicationRoutes } from "./modules/job-application/job-application.route";
import fastifyRateLimit from "@fastify/rate-limit";

export const app = Fastify({ logger: true });
// error need to be right below fastify instance
app.setErrorHandler((error, req, res) => {
    //zod error only
    if(error instanceof ZodError){
        return res.status(400).send({
            message: "Validation Error",
            issues: error.issues
        })
    }
    
    //custom error that i made
    if(error instanceof AppError){
        return res.status(error.statusCode).send({
            message: error.message
        })
    }

    req.log.error(error)
    return res.status(500).send({
        message: "Internal Server Error"
    })
})

await app.register(jwt, {
  secret: process.env.JWT_SECRET!,
});
await app.register(sensible)

//fixing when put in production
const isProd = process.env.NODE_ENV === "production"
await app.register(cors, { origin: isProd? ["https://changemyurl.com", "https://www.changemyurl.com"] : true });
await app.register(authPlugin)
await app.register(fastifyRateLimit, {
    max: 1000,
    timeWindow: "1 minute"
})
await app.register(authRoutes)
await app.register(JobApplicationRoutes)


const port = Number(process.env.PORT ?? 3333);

await app.listen({ port, host: "0.0.0.0" });
