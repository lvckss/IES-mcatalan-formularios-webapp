import app from './app'

const port = Number(process.env.PORT ?? 3000);

Bun.serve({
    fetch: app.fetch,
    port,
    hostname: "127.0.0.1", // APACHE
  });

console.log("server running");