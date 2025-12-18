import { FastifyPluginAsync, FastifyReply, FastifyRequest } from "fastify";
import fp from "fastify-plugin"

const authPlugin: FastifyPluginAsync = async(app)=>{
    app.decorate("authenticate", async (req: FastifyRequest, reply: FastifyReply) =>{
        try{
            await req.jwtVerify()
        } 
        catch{
            return reply.status(401).send({message: "Unauthorized"})
        }
    })
}

export default fp(authPlugin)