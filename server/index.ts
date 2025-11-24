import app from './app'

const port = Number(process.env.PORT ?? 3000);

Bun.serve({
    fetch: app.fetch,
    port,
    hostname: '0.0.0.0', // importante en Docker/Render
  });

console.log("server running");