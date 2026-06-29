export const env = {
    BASE_URL: Bun.env.BASE_URL || "http://localhost:3000",
    PORT: parseInt(Bun.env.PORT || "3000"),
    FRONTEND_URL: Bun.env.FRONTEND_URL || "http://localhost:5173",
}