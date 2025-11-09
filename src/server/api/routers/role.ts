import { z } from "zod";
import { createTRPCRouter, protectedProcedure } from "../trpc";

export const roleRouter = createTRPCRouter({
  // Get all roles with permissions
  getAll: protectedProcedure.query(async ({ ctx }) => {
    return ctx.db.role.findMany({
      include: {
        permissions: true, // include role permissions
      },
      orderBy: {
        name: "asc",
      },
    });
  }),

  // Get single role by id
  getById: protectedProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ input, ctx }) => {
      return ctx.db.role.findUnique({
        where: { id: input.id },
        include: { permissions: true },
      });
    }),

  // Create role
  create: protectedProcedure
    .input(
      z.object({
        name: z.string().min(1),
        description: z.string().nullable().optional(),
        permissionIds: z.string().array().optional(),
      }),
    )
    .mutation(async ({ input, ctx }) => {
      return ctx.db.role.create({
        data: {
          name: input.name,
          description: input.description ?? null,
          permissions: input.permissionIds
            ? {
                connect: input.permissionIds.map((id) => ({ id })),
              }
            : undefined,
        },
        include: { permissions: true },
      });
    }),

  // Update role
  update: protectedProcedure
    .input(
      z.object({
        id: z.string(),
        name: z.string().min(1),
        description: z.string().nullable().optional(),
        permissionIds: z.string().array().optional(),
      }),
    )
    .mutation(async ({ input, ctx }) => {
      return ctx.db.role.update({
        where: { id: input.id },
        data: {
          name: input.name,
          description: input.description ?? null,
          permissions: input.permissionIds
            ? {
                set: input.permissionIds.map((id) => ({ id })),
              }
            : undefined,
        },
        include: { permissions: true },
      });
    }),

  // Delete role
  delete: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ input, ctx }) => {
      return ctx.db.role.delete({
        where: { id: input.id },
      });
    }),
});
