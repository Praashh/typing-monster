import { Elysia } from "elysia";
import wsRouter from "./routes/ws";
import { cron } from "@elysia/cron";
import { env } from "./env";
import cors from "@elysia/cors";

new Elysia()
  .use(
    cors({
      origin: env.FRONTEND_URL,
      credentials: true,
    }),
  )
  .use(
    cron({
      name: "cron-for-render-cold-start-every-15minutes",
      pattern: "* */15 * * * *",
      async run() {
        try {
          const res = await fetch(`${env.BASE_URL}/health`);
          if (res.status !== 200) {
          } else {
          }
        } catch (error) {
          // Silent catch
        }
      },
    }),
  )
  .use(wsRouter)
  .get("/health", () => "Server is healthy")
  .listen(3000);
