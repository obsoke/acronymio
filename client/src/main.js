const socket = new WebSocket("ws://127.0.0.1:8000");

socket.addEventListener("open", (_) => {
  console.log(">> CONNECTED TO WEB SOCKET");
  switchToNameEnter();
});
socket.addEventListener("message", (ev) => {
  processServerMessage(ev.data);
});

function processServerMessage(data) {
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
    } else {
      console.warn(`>> UNKOWN MESSAGE: ${data}`);
    }
  } catch (e) {
    console.error(">> UNABLE TO PARSE DATA INTO MSG: ", data, e);
  }
  const msg = JSON.parse(data);
}

// CONNECTION STATE - ENTER A NAME
function switchToNameEnter() {
  document.querySelector("#connect")?.classList.add("hide");
  document.querySelector("#name")?.classList.remove("hide");

  document.querySelector("button#submitName").addEventListener("click", (e) => {
    e.preventDefault();
    const name = document.querySelector("#usernameInput").value;
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
function startGame(acroLetters, timeLeft) {
  document.querySelector("#waitingGame")?.classList.add("hide");

  const letterEle = document.querySelector("#acroLetters");
  letterEle.innerHTML = acroLetters.join(" ");

  updateTimer(timeLeft);

  document.querySelector("#timerContainer").classList.remove("hide");

  document.querySelector("#acronym")?.classList.remove("hide");

  document.querySelector("#submitEntry").addEventListener("click", (e) => {
    e.preventDefault();

    // TODO: Client side validation?
    const acronym = document.querySelector("#acronymInput").value.split(" ");
    const msg = {
      type: "submitAcronym",
      acronym,
    };

    socket.send(JSON.stringify(msg));
  });
}

function waitForEntries(entry) {
  document.querySelector("#acroSubmitForm")?.classList.add("hide");

  const myEntryEle = document.querySelector("#myEntry");
  myEntryEle.innerHTML = entry.join(" ");

  document.querySelector("#waitingForEntries")?.classList.remove("hide");
}

const timerEle = document.querySelector("#timer");
function updateTimer(time) {
  timerEle.innerHTML = time;
}

// VOTE STATE - VOTE ON WHICH ACRONYM YOU LIKE

// END STATE - GAME RESULTS
