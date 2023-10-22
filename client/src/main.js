const socket = new WebSocket('ws://127.0.0.1:8000');

socket.addEventListener('open', _ => {
    console.log('>> CONNECTED TO WEB SOCKET');
    switchToNameEnter();
})
socket.addEventListener('message', ev => {
    console.log('>> DATA: ', ev.data);
    // TODO: process message on client side
})

// CONNECTION STATE - ENTER A NAME
function switchToNameEnter() {
    document.querySelector('#connect')?.classList.add('hide');
    document.querySelector('#name')?.classList.remove('hide');

    document.querySelector('button[type="submit"]').addEventListener('click', (e) => {
        e.preventDefault();
        const name = document.querySelector('input[type="text"]').value;
        const msg = {
            type: 'setName',
            name
        }
        socket.send(JSON.stringify(msg));
    })
}


// GAME STATE - ENTER AN ACRONYM

// VOTE STATE - VOTE ON WHICH ACRONYM YOU LIKE

// END STATE - GAME RESULTS