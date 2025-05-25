const params = new URLSearchParams(window.location.search);
const username = params.get("username") || "Anonymous";
const room = params.get("room") || "General";

document.getElementById("username").textContent = username;
document.getElementById("room-name").textContent = room;
let socketId = '';

const socket = io();

socket.emit("joinRoom", { username, room });

const form = document.getElementById("form");
const input = document.getElementById("input");
const messages = document.getElementById("messages");
const userlist = document.getElementById("userlist");

socket.on("chatHistory", ({ id, history }) => {
    socketId = id;
    history.forEach(msg => {
        appendMessage(msg.username, msg.message);
    });
});

socket.on("message", (msg) => {
    appendMessage(msg.username, msg.message);
});

socket.on("privateMessageNotification", ({ username, identifier, message }) => {
    console.log(`Private message from ${username}: ${message}`);

    if (document.visibilityState === 'visible') {
        showModal({
            title: `📨 From ${username}`,
            message: message,
            onConfirm: () => {
                window.location.href = `/private.html?from=${encodeURIComponent(socketId)}&identifier=${encodeURIComponent(identifier)}`;
            }
        });
    }
});

socket.on("roomUsers", ({ users }) => {
    userlist.innerHTML = '';
    users.forEach(user => {
        if (user.username !== username) {
            const li = document.createElement("li");
            li.innerHTML = `
            <button class ="bg-blue-100 text-blue-800 px-3 py-1 rounded hover:bg-blue-200" onclick="startPrivateChat('${user.id}')">💬 ${user.username}</button>
        `;
            userlist.appendChild(li);
        }
    });
});

form.addEventListener("submit", (e) => {
    e.preventDefault();
    if (input.value.trim()) {
        socket.emit("chatMessage", input.value);
        input.value = "";
    }
});

function appendMessage(username, message) {
    const li = document.createElement("li");
    li.innerHTML = `<strong>${username}</strong>: ${message}`;
    messages.appendChild(li);
    messages.scrollTop = messages.scrollHeight;
}

function startPrivateChat(targetUserSocketId) {
    socket.emit("privateChat", { socketId, targetUserSocketId });
    let identifier = [socketId, targetUserSocketId].sort().reduce((acc, cur) => {
        return acc + '-' + cur;
    });
    window.location.href = `/private.html?from=${encodeURIComponent(socketId)}&identifier=${encodeURIComponent(identifier)}`;
}

function showModal({ title = 'Notice', message = 'Message content', onConfirm = null }) {
    document.getElementById('modal-title').innerText = title;
    document.getElementById('modal-message').innerText = message;

    const modal = document.getElementById('chat-modal');
    modal.classList.remove('hidden');

    const confirmBtn = document.getElementById('modal-confirm-btn');
    confirmBtn.onclick = () => {
        modal.classList.add('hidden');
        if (onConfirm) onConfirm();
    };
}

function closeModal() {
    document.getElementById('chat-modal').classList.add('hidden');
}