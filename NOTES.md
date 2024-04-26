# Game information

## Client states

This is all the different states that the client can find itself in. Each state should have a corresponding view.

- connecting: Initial state when opening the web client. Client is connecting to the backend.
- name: Client is connected to the server; prompts user for a screen name.
- waitingGame: User has submitted their screen name and is waiting for all users to submit screen name before starting game.
- acronym: All users have submitted their screen names. The server has generated the acronym has the client has received them. The user has the specified amount of time to submit their backronym.
- voting: All users have submitted their backronym. The client receives a list of all other users' entries. The user has the specified amount of time to vote for their favourite backronym.
- winner: All votes have been received by the backend and the winner has been decided. This is the "game over" state.
