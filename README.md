# Acronymio

An online game where users are given an acronym to define. A voting around will commence where the best acronym wins!

## Running locally

1. In `/client`, create a file called `.env.local` with the following contents:

```bash
VITE_SOCKET_ADDR=ws://localhost:8080
```

2. From the repo root, run `docker compose -f compose.dev.yml up -d`. The client should be accessible at http://localhost:5173/.
