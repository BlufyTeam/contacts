// src/server/api/routers/itDocument.ts
import { z } from "zod";
import {
  createTRPCRouter,
  publicProcedure,
  protectedProcedure,
} from "~/server/api/trpc";
import { TRPCError } from "@trpc/server";
import fs from "fs";
import path from "path";

export const itDocumentRouter = createTRPCRouter({
  getAll: publicProcedure.query(async ({ ctx }) => {
    return ctx.db.iTDocument.findMany({
      orderBy: { createdAt: "desc" },
    });
  }),

  create: protectedProcedure
    .input(
      z.object({
        name: z.string().min(1),
        description: z.string().optional(),
        fileUrl: z.string().startsWith("/uploads/it_files/"),
        fileType: z.string(), // <-- NEW
      }),
    )
    .mutation(async ({ ctx, input }) => {
      return ctx.db.iTDocument.create({ data: input });
    }),

  delete: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const doc = await ctx.db.iTDocument.findUnique({
        where: { id: input.id },
      });

      if (!doc) throw new TRPCError({ code: "NOT_FOUND" });

      // Delete physical file
      const filePath = path.join(process.cwd(), "public", doc.fileUrl);
      if (fs.existsSync(filePath)) {
        try {
          fs.unlinkSync(filePath);
        } catch (err) {
          console.warn("Failed to delete file:", filePath, err);
          // Don't fail DB delete if file is missing
        }
      }

      await ctx.db.iTDocument.delete({ where: { id: input.id } });
      return true;
    }),
});
