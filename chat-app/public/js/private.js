
const socket = io();

const previousSocketId = new URLSearchParams(window.location.search).get('from');
const identifier = new URLSearchParams(window.location.search).get('identifier');
let fromUsername = '';
let toUsername = '';

socket.emit("peerToPeer", { identifier });


fetch(`/getUserInfo?from=${previousSocketId}&identifier=${identifier}`, {
    method: 'GET',
    headers: {
        'Content-Type': 'application/json'
    },
})
    .then(response => response.json())
    .then(data => {
        const { fromUser, toUser } = data;
        initializeChat(fromUser, toUser);
    })
    .catch(error => {
        console.error('Error fetching user info:', error);
    });


socket.on('chatHistory', ({ id, history }) => {
    history.forEach(msg => {
        appendMessage(`${msg.username}: ${msg.message}`);
    });
});

function initializeChat(fromUser, toUser) {
    fromUsername = fromUser.username || 'anonymous';
    toUsername = toUser.username || 'anonymous';

    document.getElementById('from-user').textContent = fromUsername;
    document.getElementById('to-user').textContent = toUsername;
}


const messageList = document.getElementById('private-messages');
const form = document.getElementById('private-form');
const input = document.getElementById('private-input');

form.addEventListener('submit', (e) => {
    e.preventDefault();
    const message = input.value.trim();
    if (message) {
        socket.emit('privateMessage', { username: fromUsername, identifier, message });
        appendMessage(`You: ${message}`);
        input.value = '';
    }
});

socket.on('privateMessage', ({ username, identifier, message }) => {
    console.log(`Private message from ${username}: ${message}`);
    appendMessage(`${toUsername}: ${message}`);
});

function appendMessage(msg) {
    const li = document.createElement('li');
    li.textContent = msg;
    li.className = 'bg-gray-200 px-4 py-2 rounded';
    messageList.appendChild(li);
    messageList.scrollTop = messageList.scrollHeight;
}