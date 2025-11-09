import { z } from "zod";
import { createTRPCRouter, protectedProcedure } from "../trpc";

export const permissionRouter = createTRPCRouter({
  // Get all permissions
  getAll: protectedProcedure.query(async ({ ctx }) => {
    return ctx.db.permission.findMany({
      orderBy: { name: "asc" },
    });
  }),

  // Get permission by ID
  getById: protectedProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ input, ctx }) => {
      return ctx.db.permission.findUnique({
        where: { id: input.id },
      });
    }),

  // Create a new permission
  create: protectedProcedure
    .input(
      z.object({
        name: z.string().min(1),
        description: z.string().nullable().optional(),
      }),
    )
    .mutation(async ({ input, ctx }) => {
      return ctx.db.permission.create({
        data: {
          name: input.name,
          description: input.description ?? null,
        },
      });
    }),

  // Update a permission
  update: protectedProcedure
    .input(
      z.object({
        id: z.string(),
        name: z.string().min(1),
        description: z.string().nullable().optional(),
      }),
    )
    .mutation(async ({ input, ctx }) => {
      return ctx.db.permission.update({
        where: { id: input.id },
        data: {
          name: input.name,
          description: input.description ?? null,
        },
      });
    }),

  // Delete a permission
  delete: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ input, ctx }) => {
      return ctx.db.permission.delete({
        where: { id: input.id },
      });
    }),
});
