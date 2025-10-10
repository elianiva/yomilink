import { httpRouter } from "convex/server";
import { auth } from "./auth";

const http = httpRouter();

// Expose @convex-dev/auth routes (sign-in, callbacks, etc.)
auth.addHttpRoutes(http);

export default http;
