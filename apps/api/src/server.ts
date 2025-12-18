import Fastify from "fastify";
import cors from "@fastify/cors";
import jwt from "@fastify/jwt"
import "dotenv/config"
import sensible from "@fastify/sensible"
import { authRoutes } from "./modules/auth/auth.route";
import authPlugin from "./plugins/auth"

export const app = Fastify({ logger: true });
await app.register(jwt, {
  secret: process.env.JWT_SECRET!,
});
await app.register(sensible)
await app.register(cors, { origin: true });
await app.register(authPlugin)
await app.register(authRoutes)

app.get("/health", async () => ({ ok: true }));

const port = Number(process.env.PORT ?? 3333);

await app.listen({ port, host: "0.0.0.0" });
