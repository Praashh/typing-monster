if (!Bun.env.BASE_URL) {
    throw new Error("BASE_URL is not defined");
}
if (!Bun.env.PORT) {
    throw new Error("PORT is not defined");
}

if (!Bun.env.FRONTEND_URL) {
    throw new Error("FRONTEND_URL is not defined");
}

export const env = {
    BASE_URL: Bun.env.BASE_URL!,
    PORT: parseInt(Bun.env.PORT!),
    FRONTEND_URL: Bun.env.FRONTEND_URL!,
}