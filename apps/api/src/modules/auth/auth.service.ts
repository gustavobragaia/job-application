import { AppError } from "../../errors/app-error"
import { prisma } from "../../lib/prisma"
import bcrypt from "bcrypt"

interface RegisterInput {
  email: string
  password: string
  name: string
}

export async function registerUser(input: RegisterInput) {
  const email = input.email.trim().toLowerCase()

  const userAlreadyExists = await prisma.user.findUnique({
    where: { email },
    select: { id: true },
  })

  if (userAlreadyExists) {
    throw new AppError("Email already in use", 409)
  }

  const passwordHash = await bcrypt.hash(input.password, 10)

  const user = await prisma.user.create({
    data: {
      email,
      name: input.name.trim(),
      passwordHash,
    },
    select: {
      id: true,
      email: true,
      name: true,
      createdAt: true,
    },
  })

  return user
}

interface LoginInput {
  email: string
  password: string
}

export async function loginUser(input: LoginInput) {
  const email = input.email.trim().toLowerCase()

  const user = await prisma.user.findUnique({
    where: { email },
    select: {
      id: true,
      email: true,
      name: true,
      passwordHash: true,
    },
  })

  if (!user) {
    throw new AppError("INVALID CREDENTIALS", 401)
  }

  const passwordOk = await bcrypt.compare(
    input.password,
    user.passwordHash
  )

  if (!passwordOk) {
    throw new AppError("INVALID CREDENTIALS", 401)
  }

  return {
    id: user.id,
    email: user.email,
    name: user.name,
  }
}
