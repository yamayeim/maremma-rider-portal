import { type RouteConfig, index, route, layout } from "@react-router/dev/routes";

export default [
    index("routes/home.tsx"),
    route("logout", "routes/logout.ts"),
    route("rider/login", "routes/rider.login.tsx"),
    layout("routes/rider-layout.tsx", [
        route("rider", "routes/rider.dashboard.tsx"),
        route("rider/jobs", "routes/rider.jobs.tsx"),
        route("rider/jobs/:id", "routes/rider.job-detail.tsx"),
        route("rider/history", "routes/rider.history.tsx"),
        route("rider/earnings", "routes/rider.earnings.tsx"),
        route("rider/profile", "routes/rider.profile.tsx"),
    ]),
    layout("routes/admin-layout.tsx", [
        route("admin", "routes/admin.index.tsx"), // redirects to /admin/riders
        route("admin/riders", "routes/admin.riders.tsx"),
        route("admin/riders/new", "routes/admin.riders.new.tsx"),
        route("admin/riders/:id", "routes/admin.rider-detail.tsx"),
        route("admin/delivery-jobs", "routes/admin.delivery-jobs.tsx"),
    ]),
    route("api/webhooks/shopify", "routes/webhook.shopify.tsx")
] satisfies RouteConfig;
