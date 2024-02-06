# Notes while developing

## Conditionally setting FE JS values without a bundler

I would like to set the WebSocket server endpoint depending on whether I am in "prod" (deployed) mode or "dev" (local) mode. However, without a bundler, there is no way to dynamically change this value based on some environmental variable.

## Can only use JavaScript on the FE (not TypeScript)

This means we cannot share types between frontend and backend to ensure contract is consistent.
