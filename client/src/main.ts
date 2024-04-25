const socket = new WebSocket("ws://localhost:8080");
//const socket = new WebSocket("wss://acroserver.fly.dev");

socket.addEventListener("open", (_) => {
  console.log(">> CONNECTED TO WEB SOCKET");
  switchToNameEnter();
});
socket.addEventListener("message", (ev) => {
  processServerMessage(ev.data);
});

function processServerMessage(data: any) {
  try {
    const msg = JSON.parse(data);

    if (msg.type === "setName") {
      switchToWaitForGame();
    } else if (msg.type === "gameStart") {
      startGame(msg.acronym, msg.timeLeft);
    } else if (msg.type === "entryReceived") {
      waitForEntries(msg.entry);
    } else if (msg.type === "updateTimer") {
      updateTimer(msg.time);
    } else if (msg.type === "beginVoting") {
      startVotingPeriod(msg.entries, msg.timeLeft);
    } else if (msg.type === "voteReceived") {
      waitForVotes();
    } else if (msg.type === "winner") {
      endGame(msg.winner);
    } else {
      console.warn(`>> UNKOWN MESSAGE: ${data}`);
    }
  } catch (e) {
    console.error(">> UNABLE TO PARSE DATA INTO MSG: ", data, e);
  }
}

// CONNECTION STATE - ENTER A NAME
function switchToNameEnter() {
  document.querySelector("#connect")?.classList.add("hide");
  document.querySelector("#name")?.classList.remove("hide");

  document
    .querySelector("button#submitName")
    ?.addEventListener("click", (e) => {
      e.preventDefault();
      const name = document
        .querySelector("#usernameInput")
        ?.getAttribute("value");
      const msg = {
        type: "setName",
        name,
      };
      socket.send(JSON.stringify(msg));
    });
}

function switchToWaitForGame() {
  document.querySelector("#name")?.classList.add("hide");
  document.querySelector("#waitingGame")?.classList.remove("hide");
}

// GAME STATE - ENTER AN ACRONYM
function startGame(acroLetters: any, timeLeft: any) {
  document.querySelector("#waitingGame")?.classList.add("hide");

  const letterEle = document.querySelector("#acroLetters") as Element;
  letterEle.innerHTML = acroLetters.join(" ");

  updateTimer(timeLeft);

  document.querySelector("#timerContainer")?.classList.remove("hide");

  document.querySelector("#acronym")?.classList.remove("hide");

  document.querySelector("#submitEntry")?.addEventListener("click", (e) => {
    e.preventDefault();

    // TODO: Client side validation?
    const acronym = document
      .querySelector("#acronymInput")
      ?.getAttribute("value")
      ?.split(" ");
    const msg = {
      type: "submitAcronym",
      acronym,
    };

    socket.send(JSON.stringify(msg));
  });
}

function waitForEntries(entry: any) {
  document.querySelector("#acroSubmitForm")?.classList.add("hide");

  const myEntryEle = document.querySelector("#myEntry") as Element;
  myEntryEle.innerHTML = entry.join(" ");

  document.querySelector("#waitingForEntries")?.classList.remove("hide");
}

const timerEle: any = document.querySelector("#timer");
function updateTimer(time: any) {
  timerEle.innerHTML = time;
}

// VOTE STATE - VOTE ON WHICH ACRONYM YOU LIKE
function startVotingPeriod(entries: any, timeLeft: any) {
  document.querySelector("#acronym")?.classList.add("hide");

  const list = document.querySelector("#entryList");
  entries.forEach((e: any) => {
    const li = document.createElement("li");
    li.classList.add("voteEntry");
    li.innerText = e.entry;
    li.dataset.id = e.uuid;
    list?.appendChild(li);
  });

  document.addEventListener("click", (e: any) => {
    if (e.target.matches("li.voteEntry")) {
      const uuid = e.target.dataset.id;
      const msg = {
        type: "vote",
        userVotedFor: uuid,
      };

      socket.send(JSON.stringify(msg));
    }
  });

  updateTimer(timeLeft);

  document.querySelector("#voting")?.classList.remove("hide");
}

function waitForVotes() {
  document.querySelector("#entryList")?.classList.add("hide");
  document.querySelector("#waitingForVotes")?.classList.remove("hide");
}

// END STATE - GAME RESULTS
function endGame(winner: any) {
  document.querySelector("#voting")?.classList.add("hide");
  document.querySelector("#timerContainer")?.classList.add("hide");
  const winnerEle = document.querySelector("#winnerName") as Element;
  winnerEle.innerHTML = winner;

  document.querySelector("#winner")?.classList.remove("hide");
}
