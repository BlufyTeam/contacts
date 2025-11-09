import { z } from "zod";
import {
  createTRPCRouter,
  protectedProcedure,
  publicProcedure,
} from "~/server/api/trpc";
import { db } from "~/server/db";

export const organizationRouter = createTRPCRouter({
  // ✅ Get all organizations
  getAll: publicProcedure.query(async () => {
    return db.organization.findMany({
      orderBy: { createdAt: "desc" },
    });
  }),

  // ✅ Create an organization
  create: protectedProcedure
    .input(
      z.object({
        name: z.string().min(1),
      }),
    )
    .mutation(async ({ input }) => {
      return db.organization.create({
        data: {
          name: input.name,
        },
      });
    }),

  // ✅ Update an organization
  update: protectedProcedure
    .input(
      z.object({
        id: z.string(),
        name: z.string().min(1),
      }),
    )
    .mutation(async ({ input }) => {
      return db.organization.update({
        where: { id: input.id },
        data: {
          name: input.name,
        },
      });
    }),

  // ✅ Delete an organization
  delete: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ input }) => {
      return db.organization.delete({
        where: { id: input.id },
      });
    }),
});
