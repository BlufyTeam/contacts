import { z } from "zod";
import {
  createTRPCRouter,
  protectedProcedure,
  publicProcedure,
} from "~/server/api/trpc";

export const contactRouter = createTRPCRouter({
  // Get all contacts
  getAll: publicProcedure.query(async ({ ctx }) => {
    return ctx.db.contact.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        organization: true,
      },
    });
  }),

  // Create a new contact
  create: protectedProcedure
    .input(
      z.object({
        fullName: z.string().min(1),
        fullnameEn: z.string().optional(),
        email: z.string().email(),
        extension: z.string(),
        organizationId: z.string(),

        gender: z.string().optional().nullable(),
        title: z.string().optional().nullable(),
        titleEn: z.string().optional().nullable(),
        personalCode: z.string().optional().nullable(),
        BC: z.string().optional().nullable(),
        BCEn: z.string().optional().nullable(),
        edu: z.string().optional().nullable(),
        major: z.string().optional().nullable(),
        phone: z.string().optional().nullable(),
        mobile: z.string().optional().nullable(),
        hiredDate: z.string().optional().nullable(),
        father: z.string().optional().nullable(),
        birthShamsi: z.string().optional().nullable(),
        birthMiladi: z.string().optional().nullable(),
        birthLoc: z.string().optional().nullable(),
        marriage: z.string().optional().nullable(),
        childrenNum: z.string().optional().nullable(),
        codeMeli: z.string().optional().nullable(),
        shenasname: z.string().optional().nullable(),
        shenasnameSerial: z.string().optional().nullable(),
        insuranceNum: z.string().optional().nullable(),
        insuranceCode: z.string().optional().nullable(),
        insuranceTitle: z.string().optional().nullable(),
        passport: z.string().optional().nullable(),
        passportExpire: z.string().optional().nullable(),
        SOS: z.string().optional().nullable(),
        personalMail: z.string().optional().nullable(),
      }),
    )
    .mutation(async ({ input, ctx }) => {
      return ctx.db.contact.create({ data: input });
    }),

  // Update a contact
  update: protectedProcedure
    .input(
      z.object({
        id: z.string(),
        fullName: z.string().min(1),
        fullnameEn: z.string().optional(),
        email: z.string().email(),
        extension: z.string(),
        organizationId: z.string(),

        gender: z.string().optional().nullable(),
        title: z.string().optional().nullable(),
        titleEn: z.string().optional().nullable(),
        personalCode: z.string().optional().nullable(),
        BC: z.string().optional().nullable(),
        BCEn: z.string().optional().nullable(),
        edu: z.string().optional().nullable(),
        major: z.string().optional().nullable(),
        phone: z.string().optional().nullable(),
        mobile: z.string().optional().nullable(),
        hiredDate: z.string().optional().nullable(),
        father: z.string().optional().nullable(),
        birthShamsi: z.string().optional().nullable(),
        birthMiladi: z.string().optional().nullable(),
        birthLoc: z.string().optional().nullable(),
        marriage: z.string().optional().nullable(),
        childrenNum: z.string().optional().nullable(),
        codeMeli: z.string().optional().nullable(),
        shenasname: z.string().optional().nullable(),
        shenasnameSerial: z.string().optional().nullable(),
        insuranceNum: z.string().optional().nullable(),
        insuranceCode: z.string().optional().nullable(),
        insuranceTitle: z.string().optional().nullable(),
        passport: z.string().optional().nullable(),
        passportExpire: z.string().optional().nullable(),
        SOS: z.string().optional().nullable(),
        personalMail: z.string().optional().nullable(),
      }),
    )
    .mutation(async ({ input, ctx }) => {
      const { id, ...data } = input;
      return ctx.db.contact.update({
        where: { id },
        data,
      });
    }),

  // Delete a contact
  delete: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ input, ctx }) => {
      await ctx.db.contact.delete({ where: { id: input.id } });
      return { success: true };
    }),
});
