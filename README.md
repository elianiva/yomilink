Welcome to your new TanStack app! 

# Getting Started

To run this application:

```bash
bun install
bun --bun run start
```

# Building For Production

To build this application for production:

```bash
bun --bun run build
```

## Testing

This project uses [Vitest](https://vitest.dev/) for testing. You can run the tests with:

```bash
bun --bun run test
```

## Styling

This project uses [Tailwind CSS](https://tailwindcss.com/) for styling.


## Linting & Formatting

This project uses [Biome](https://biomejs.dev/) for linting and formatting. The following scripts are available:


```bash
bun --bun run lint
bun --bun run format
bun --bun run check
```


## Setting up Convex

- Set the `VITE_CONVEX_URL` and `CONVEX_DEPLOYMENT` environment variables in your `.env.local`. (Or run `npx convex init` to set them automatically.)
- Run `npx convex dev` to start the Convex server.


## T3Env

- You can use T3Env to add type safety to your environment variables.
- Add Environment variables to the `src/env.mjs` file.
- Use the environment variables in your code.

### Usage

```ts
import { env } from "@/env";

console.log(env.VITE_APP_TITLE);
```





## Shadcn

Add components using the latest version of [Shadcn](https://ui.shadcn.com/).

```bash
pnpx shadcn@latest add button
```



## Routing
This project uses [TanStack Router](https://tanstack.com/router). The initial setup is a file based router. Which means that the routes are managed as files in `src/routes`.

### Adding A Route

To add a new route to your application just add another a new file in the `./src/routes` directory.

TanStack will automatically generate the content of the route file for you.

Now that you have two routes you can use a `Link` component to navigate between them.

### Adding Links

To use SPA (Single Page Application) navigation you will need to import the `Link` component from `@tanstack/react-router`.

```tsx
import { Link } from "@tanstack/react-router";
```

Then anywhere in your JSX you can use it like so:

```tsx
<Link to="/about">About</Link>
```

This will create a link that will navigate to the `/about` route.

More information on the `Link` component can be found in the [Link documentation](https://tanstack.com/router/v1/docs/framework/react/api/router/linkComponent).

### Using A Layout

In the File Based Routing setup the layout is located in `src/routes/__root.tsx`. Anything you add to the root route will appear in all the routes. The route content will appear in the JSX where you use the `<Outlet />` component.

Here is an example layout that includes a header:

```tsx
import { Outlet, createRootRoute } from '@tanstack/react-router'
import { TanStackRouterDevtools } from '@tanstack/react-router-devtools'

import { Link } from "@tanstack/react-router";

export const Route = createRootRoute({
  component: () => (
    <>
      <header>
        <nav>
          <Link to="/">Home</Link>
          <Link to="/about">About</Link>
        </nav>
      </header>
      <Outlet />
      <TanStackRouterDevtools />
    </>
  ),
})
```

The `<TanStackRouterDevtools />` component is not required so you can remove it if you don't want it in your layout.

More information on layouts can be found in the [Layouts documentation](https://tanstack.com/router/latest/docs/framework/react/guide/routing-concepts#layouts).


## Data Fetching

There are multiple ways to fetch data in your application. You can use TanStack Query to fetch data from a server. But you can also use the `loader` functionality built into TanStack Router to load the data for a route before it's rendered.

For example:

```tsx
const peopleRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/people",
  loader: async () => {
    const response = await fetch("https://swapi.dev/api/people");
    return response.json() as Promise<{
      results: {
        name: string;
      }[];
    }>;
  },
  component: () => {
    const data = peopleRoute.useLoaderData();
    return (
      <ul>
        {data.results.map((person) => (
          <li key={person.name}>{person.name}</li>
        ))}
      </ul>
    );
  },
});
```

Loaders simplify your data fetching logic dramatically. Check out more information in the [Loader documentation](https://tanstack.com/router/latest/docs/framework/react/guide/data-loading#loader-parameters).

### React-Query

React-Query is an excellent addition or alternative to route loading and integrating it into you application is a breeze.

First add your dependencies:

```bash
bun install @tanstack/react-query @tanstack/react-query-devtools
```

Next we'll need to create a query client and provider. We recommend putting those in `main.tsx`.

```tsx
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

// ...

const queryClient = new QueryClient();

// ...

if (!rootElement.innerHTML) {
  const root = ReactDOM.createRoot(rootElement);

  root.render(
    <QueryClientProvider client={queryClient}>
      <RouterProvider router={router} />
    </QueryClientProvider>
  );
}
```

You can also add TanStack Query Devtools to the root route (optional).

```tsx
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";

const rootRoute = createRootRoute({
  component: () => (
    <>
      <Outlet />
      <ReactQueryDevtools buttonPosition="top-right" />
      <TanStackRouterDevtools />
    </>
  ),
});
```

Now you can use `useQuery` to fetch your data.

```tsx
import { useQuery } from "@tanstack/react-query";

import "./App.css";

function App() {
  const { data } = useQuery({
    queryKey: ["people"],
    queryFn: () =>
      fetch("https://swapi.dev/api/people")
        .then((res) => res.json())
        .then((data) => data.results as { name: string }[]),
    initialData: [],
  });

  return (
    <div>
      <ul>
        {data.map((person) => (
          <li key={person.name}>{person.name}</li>
        ))}
      </ul>
    </div>
  );
}

export default App;
```

You can find out everything you need to know on how to use React-Query in the [React-Query documentation](https://tanstack.com/query/latest/docs/framework/react/overview).

## State Management

Another common requirement for React applications is state management. There are many options for state management in React. TanStack Store provides a great starting point for your project.

First you need to add TanStack Store as a dependency:

```bash
bun install @tanstack/store
```

Now let's create a simple counter in the `src/App.tsx` file as a demonstration.

```tsx
import { useStore } from "@tanstack/react-store";
import { Store } from "@tanstack/store";
import "./App.css";

const countStore = new Store(0);

function App() {
  const count = useStore(countStore);
  return (
    <div>
      <button onClick={() => countStore.setState((n) => n + 1)}>
        Increment - {count}
      </button>
    </div>
  );
}

export default App;
```

One of the many nice features of TanStack Store is the ability to derive state from other state. That derived state will update when the base state updates.

Let's check this out by doubling the count using derived state.

```tsx
import { useStore } from "@tanstack/react-store";
import { Store, Derived } from "@tanstack/store";
import "./App.css";

const countStore = new Store(0);

const doubledStore = new Derived({
  fn: () => countStore.state * 2,
  deps: [countStore],
});
doubledStore.mount();

function App() {
  const count = useStore(countStore);
  const doubledCount = useStore(doubledStore);

  return (
    <div>
      <button onClick={() => countStore.setState((n) => n + 1)}>
        Increment - {count}
      </button>
      <div>Doubled - {doubledCount}</div>
    </div>
  );
}

export default App;
```

We use the `Derived` class to create a new store that is derived from another store. The `Derived` class has a `mount` method that will start the derived store updating.

Once we've created the derived store we can use it in the `App` component just like we would any other store using the `useStore` hook.

You can find out everything you need to know on how to use TanStack Store in the [TanStack Store documentation](https://tanstack.com/store/latest).

# Demo files

Files prefixed with `demo` can be safely deleted. They are there to provide a starting point for you to play around with the features you've installed.

# Learn More

You can learn more about all of the offerings from TanStack in the [TanStack documentation](https://tanstack.com).

## Authentication (Better Auth + Drizzle/Turso)

This app uses Better Auth with the Drizzle/SQLite adapter on Turso (libSQL).

Key files:
- Server config: [auth config](src/server/auth/config.ts:1)
- Auth HTTP handler: [src/routes/api/auth/$.ts](src/routes/api/auth/$.ts:1)
- Database client: [src/server/db/client.ts](src/server/db/client.ts:1)
- Current user RPC: [src/server/rpc/auth.ts](src/server/rpc/auth.ts:1)
- Client provider: [src/router.tsx](src/router.tsx:1) uses TanStack Query only
- Sentry user bridge: [src/app/AuthSentryBridge.tsx](src/app/AuthSentryBridge.tsx:1) (wired in router)
- Client auth client: [src/lib/auth-client.ts](src/lib/auth-client.ts:1)
- SSR auth helper: [src/auth/fetch-auth.ts](src/auth/fetch-auth.ts:1)
- Server functions (TanStack Start): [src/server/rpc/*](src/server/rpc)
- Loaders with session prefetch:
  - [/dashboard loader] uses standard loader (no Convex)
  - [/ loader](src/routes/index.tsx:1)
  - [/login loader](src/routes/login.tsx:49)
- Client hook: [src/hooks/use-auth.useAuth()](src/hooks/use-auth.ts:1)

Environment variables:
Copy .env.example to .env.local and set:
- VITE_APP_URL: Frontend base url (e.g., http://localhost:5173)
- SITE_URL: Server-side Better Auth base url
- TURSO_DATABASE_URL: Turso/libSQL database URL
- TURSO_AUTH_TOKEN: Turso token (if required)

Sign-in / sign-up (email/password):
- See [src/routes/login.tsx](src/routes/login.tsx:1) using [authClient.signIn.email](src/routes/login.tsx:1) and [authClient.signUp.email](src/routes/login.tsx:1)
- To sign out, we call [authClient.signOut](src/components/nav-user.tsx:1) or use the Profile/Top-Right menu.

SSR session:
- On initial server render, loaders call [getServerSession()](src/auth/session.ts:18) which uses the Better Auth cookie to resolve the user and hydrate the query cache.

Testing checklist:
- Ensure cookie “better-auth.session” is set after successful login.
- Refresh the page and verify protected routes honor SSR loader redirects.
- Confirm Convex queries return the same user (see [convex/users.ts](convex/users.ts:1)).
- Clear cookies if you see mixed session states during dev HMR.

Notes:
- Legacy convex-auth was removed. All users are considered new by design.
- The seed endpoint was disabled during migration ([convex/seed.ts](convex/seed.ts:1)).

## Auth debugging and sanity checks

Use these steps to validate the Better Auth integration without digging through code:

- Navigate to `/debug/session` while the app is running. This route uses:
  - Convex sanity query: [session.query](convex/session.ts:8)
  - Debug route component: [src/routes/debug.session.tsx](src/routes/debug.session.tsx:1)

What you should see:
- A JSON block with:
  - `query.hasSession`: boolean
  - `query.userId`: string | null
  - `useAuth.isAuthenticated`: boolean
  - `useAuth.user`: object | null

Cookie expectations:
- After successful sign in, the browser should have `better-auth.session` set.
- Cross-origin/local dev relies on:
  - `VITE_CONVEX_SITE_URL` → Convex HTTP router base (e.g., http://127.0.0.1:3211)
  - `VITE_APP_URL` → Frontend base (e.g., http://localhost:5173)
- These are wired in Better Auth server config via [createAuth()](convex/auth.ts:20)

Manual flow to test (email/password):
1) Go to `/login`
2) Create account or sign in (uses [authClient.signUp.email()](src/lib/auth-client.ts:9) / [authClient.signIn.email()](src/lib/auth-client.ts:9))
3) Verify `/debug/session` shows `{ hasSession: true, userId: "..." }`
4) Visit `/dashboard` — guarded by server loader using [getServerSession()](src/auth/session.ts:18)
5) Sign out from the UI (uses [authClient.signOut()](src/lib/auth-client.ts:9)) and re-check `/debug/session`

If `hasSession` is false after sign-in:
- Confirm `.env.local` has matching origins:
  - VITE_CONVEX_URL=http://127.0.0.1:3210
  - VITE_CONVEX_SITE_URL=http://127.0.0.1:3211
  - VITE_APP_URL=http://localhost:5173
- Clear cookies, hard refresh, and retry.
- Ensure Better Auth HTTP routes are mounted: [convex/http.ts](convex/http.ts:7)
