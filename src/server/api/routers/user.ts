import z from "zod";
import { createTRPCRouter, protectedProcedure } from "../trpc";
import bcrypt from "bcrypt";

const SALT_ROUNDS = 10;

// Helper functions for password hashing
async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, SALT_ROUNDS);
}

async function verifyPassword(
  password: string,
  hash: string,
): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

export const userRouter = createTRPCRouter({
  getAll: protectedProcedure.query(async ({ ctx }) => {
    return ctx.db.user.findMany({
      include: {
        organization: true,
        role: { include: { permissions: true } },
      },
      orderBy: { createdAt: "desc" },
    });
  }),

  create: protectedProcedure
    .input(
      z.object({
        name: z.string().min(1),
        email: z.string().email(),
        password: z.string().min(6), // add password field
        roleId: z.string().optional(),
        organizationId: z.string().nullable().optional(),
        extension: z.string().optional(),
      }),
    )
    .mutation(async ({ input, ctx }) => {
      const hashedPassword = await hashPassword(input.password);

      return ctx.db.user.create({
        data: {
          name: input.name,
          email: input.email,
          password: hashedPassword,
          roleId: input.roleId ?? undefined,
          organizationId: input.organizationId ?? null,
          extension: input.extension,
        },
        include: { role: true, organization: true },
      });
    }),

  update: protectedProcedure
    .input(
      z.object({
        id: z.string(),
        name: z.string().min(1),
        email: z.string().email(),
        password: z.string().min(6).optional(), // optional on edit
        roleId: z.string().optional(),
        organizationId: z.string().nullable().optional(),
        extension: z.string().optional(),
      }),
    )
    .mutation(async ({ input, ctx }) => {
      const data: any = {
        name: input.name,
        email: input.email,
        roleId: input.roleId ?? undefined,
        organizationId: input.organizationId ?? null,
        extension: input.extension,
      };

      if (input.password) {
        data.password = await hashPassword(input.password);
      }

      return ctx.db.user.update({
        where: { id: input.id },
        data,
        include: { role: true, organization: true },
      });
    }),

  delete: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ input, ctx }) => {
      return ctx.db.user.delete({ where: { id: input.id } });
    }),
});
