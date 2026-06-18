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
            console.log(`Server is not healthy ${res.statusText}`);
          } else {
            console.log(`Server is healthy ${res.statusText}`);
          }
        } catch (error) {
          console.log(error);
        }
      },
    }),
  )
  .use(wsRouter)
  .get("/health", () => "Server is healthy")
  .listen(3000, () => console.log("Server running on http://localhost:3000"));
