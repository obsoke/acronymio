# Main Tasks

- [ ] Dev. changes to make life easier
  - [ ] Backend needs a volume mount
  - [ ] Deno should restart when a file changes
- [ ] Development mode
  - [ ] WebSocket test client
      - Prompt user for number of clients to connect to server
        - See [Deno's CLI module](https://deno.land/std@0.214.0/cli/mod.ts?s=parseArgs) for an example on parsing CLI arguments
        - Accept `client=N` as an argument
        - Spawn N number of clients/"players"
        - Have players automatically respond to WebSocket events
          - Set name
          - Submit acronym
          - Vote
- [ ] Design / Frontend Pop
  - [ ] Verify that the flow of the game works
  - [ ] Design screens using Figma
    - [ ] Submit name
    - [ ] Waiting for players
    - [ ] Players joined; generating acronym
    - [ ] Acronym submission round
    - [ ] Voting round
    - [ ] Game over screen
- [ ] Backend changes
  - [ ] Use structured logging library
  - [ ] Acronym generation improvements
  - [ ] Support multiple rounds

# Complete Tasks

- [X] Update the `Dockerfile` for both client and server
  - [X] For client, look at the [nginx Dockerfile docs](https://hub.docker.com/_/nginx)
  - [X] For server, look at the [Deno Dockerfile docs](https://github.com/denoland/deno_docker)
  - [X] Set up Docker Compose to bring up stack easily
