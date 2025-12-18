import { FastifyInstance } from "fastify"
import z from "zod"
import { loginUser, registerUser } from "./auth.service"
import { prisma } from "../../lib/prisma"

export async function authRoutes(app: FastifyInstance) {
  // REGISTER
  app.post("/auth/register", async (req, res) => {
    const bodySchema = z.object({
      email: z.string().email(),
      password: z.string().min(6),
      name: z.string().min(1),
    })

    const body = bodySchema.parse(req.body)

    const user = await registerUser(body)

    const token = await res.jwtSign(
      { sub: user.id },
      { expiresIn: "1h" }
    )

    return res.code(201).send({ user, token })
  })

  // LOGIN
  app.post("/auth/login", async (req, res) => {
    const bodySchema = z.object({
      email: z.string().email(),
      password: z.string().min(6),
    })

    const body = bodySchema.parse(req.body)

    const user = await loginUser(body)

    const token = await res.jwtSign(
      { sub: user.id },
      { expiresIn: "1h" }
    )

    return res.code(200).send({ user, token })
  })

  // PROTECTED ROUTE
  app.get(
    "/me",
    { onRequest: [app.authenticate] },
    async (req, res) => {
      const userId = req.user.sub

      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: {
          id: true,
          name: true,
          email: true,
          createdAt: true,
        },
      })

      return res.send({ user })
    }
  )
}
