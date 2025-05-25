function enterChatRoom(event) {
    event.preventDefault();
    const username = document.getElementById("username").value.trim();
    const room = document.getElementById("room").value.trim();
    if (username && room) {
      window.location.href = `chat.html?username=${encodeURIComponent(username)}&room=${encodeURIComponent(room)}`;
    } else {
      alert("Please enter both username and room name.");
    }
  }