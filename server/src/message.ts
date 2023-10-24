import { Player } from './player.ts';
import { Entry } from './round.ts';

// MESSAGES FROM CLIENT TO SERVER
export type ClientSetNameMessage = {
  type: 'setName';
  name: string;
};

export type ClientSubmitAcronymMessage = {
  type: 'submitAcronym';
  acronym: string[];
};

export type ClientVoteMessage = {
  type: 'vote';
  userVotedFor: string;
};

export type ClientMessages =
  | ClientSetNameMessage
  | ClientSubmitAcronymMessage
  | ClientVoteMessage;

// MESSAGES FROM SERVER TO CLIENT
export type ServerSetNameMessage = {
  type: 'setName';
  success: boolean;
};

export type ServerBeginGameMessage = {
  type: 'gameStart';
  acronym: string[];
  timeLeft: number;
};

export type ServerEntryReceivedMessage = {
  type: 'entryReceived';
  entry: string[];
  success: boolean;
};

export type ServerBeginVotingMessage = {
  type: 'beginVoting';
  entries: Entry[];
  timeLeft: number;
};

export type ServerVoteReceived = {
  type: 'voteReceived';
  success: boolean;
};

export type ServerUpdateTimerMessage = {
  type: 'updateTimer';
  time: number;
};

export type ServerWinnerMessage = {
  type: 'winner';
  winner: string;
};

export type ServerMessages =
  | ServerSetNameMessage
  | ServerBeginGameMessage
  | ServerEntryReceivedMessage
  | ServerUpdateTimerMessage
  | ServerBeginVotingMessage
  | ServerVoteReceived
  | ServerWinnerMessage;

export function processMessage(data: string, sender: Player) {
  try {
    const msg: ClientMessages = JSON.parse(data);

    if (msg.type === 'setName') {
      sender.setName(msg.name);

      const resp: ServerSetNameMessage = {
        type: 'setName',
        success: true,
      };

      sender.sendMessage(resp);
    } else if (msg.type === 'submitAcronym') {
      // TODO: Validate that submission matches the given acronym; if not, send an error to client
      console.log(`Received entry from ${sender.getName()}: ${msg.acronym}`);
      sender.setSubmission(msg.acronym.join(' '));

      const resp: ServerEntryReceivedMessage = {
        type: 'entryReceived',
        entry: msg.acronym,
        success: true,
      };
      sender.sendMessage(resp);
    } else if (msg.type === 'vote') {
      const id = msg.userVotedFor;
      sender.setVote(id);

      const resp: ServerVoteReceived = {
        type: 'voteReceived',
        success: true,
      };
      sender.sendMessage(resp);
    } else {
      console.warn(`>> UNKOWN MESSAGE: ${data}`);
    }
  } catch (e) {
    console.error('>> UNABLE TO PARSE DATA INTO MSG: ', data, e);
  }
}
