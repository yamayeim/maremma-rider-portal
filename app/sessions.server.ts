import { createCookieSessionStorage } from "react-router";

type SessionData = {
    riderId: string;
};

type SessionFlashData = {
    error: string;
};

export const sessionStorage = createCookieSessionStorage<SessionData, SessionFlashData>({
    cookie: {
        name: "__rider_session",
        httpOnly: true,
        maxAge: 60 * 60 * 24 * 30, // 30 days
        path: "/",
        sameSite: "lax",
        secrets: ["MAREMMA_SECRET_RIDER"],
        secure: process.env.NODE_ENV === "production",
    },
});

export const { getSession, commitSession, destroySession } = sessionStorage;
