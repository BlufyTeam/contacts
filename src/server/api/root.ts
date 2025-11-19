import { createCallerFactory, createTRPCRouter } from "~/server/api/trpc";
import { userRouter } from "./routers/user";
import { contactRouter } from "./routers/contact";
import { organizationRouter } from "./routers/organization";
import { roleRouter } from "./routers/role";
import { permissionRouter } from "./routers/permission";
import { itDocumentRouter } from "./routers/itDocument";

/**
 * This is the primary router for your server.
 *
 * All routers added in /api/routers should be manually added here.
 */
export const appRouter = createTRPCRouter({
  user: userRouter,
  contacts: contactRouter,
  organization: organizationRouter,
  role: roleRouter,
  permission: permissionRouter,
  itDocument: itDocumentRouter,
});

// export type definition of API
export type AppRouter = typeof appRouter;

/**
 * Create a server-side caller for the tRPC API.
 * @example
 * const trpc = createCaller(createContext);
 * const res = await trpc.post.all();
 *       ^? Post[]
 */
export const createCaller = createCallerFactory(appRouter);
