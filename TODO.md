# Main Tasks

- [ ] Frontend
  - [ ] Motion-less design of all screens 
  - [ ] Split "waitingForEntries" state out from "acronym"
  - [ ] Create function to check for reduce motion settings
  - [ ] Use anime.js to make things snazzy
  - [ ] Room UI
    - [ ] Show room code at bottom when entering user name
    - [ ] Allow users to either create a new room or join an existing one via code
  - [ ] Dark / light mode stylings + toggle
- [ ] Backend changes
  - [ ] Use structured logging library
  - [ ] Acronym generation improvements
  - [ ] Support multiple rooms

# Complete Tasks

- [X] Update the `Dockerfile` for both client and server
  - [X] For client, look at the [nginx Dockerfile docs](https://hub.docker.com/_/nginx)
  - [X] For server, look at the [Deno Dockerfile docs](https://github.com/denoland/deno_docker)
  - [X] Set up Docker Compose to bring up stack easily
- [X] Dev. changes to make life easier
  - [X] Backend needs a volume mount
  - [X] Deno should restart when a file changes
- [X] Development mode / WebSocket test client
    - Prompt user for number of clients to connect to server
      - See [Deno's CLI module](https://deno.land/std@0.214.0/cli/mod.ts?s=parseArgs) for an example on parsing CLI arguments
      - Accept `client=N` as an argument
      - Spawn N number of clients/"players"
      - Have players automatically respond to WebSocket events
        - Set name
        - Submit acronym
        - Vote
