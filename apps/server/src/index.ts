import { Elysia } from "elysia";
import wsRouter from "./routes/ws";

new Elysia()
  .use(wsRouter)
  .get("/health", () => "Server is healthy")
  .listen(3000, () => console.log("Server running on http://localhost:3000"));
