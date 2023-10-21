const socket = new WebSocket('ws://127.0.0.1:8000');

socket.addEventListener('open', ev => {
    console.log('connected');
})
socket.addEventListener('message', ev => {
    console.log('>> DATA: ', ev.data);
})