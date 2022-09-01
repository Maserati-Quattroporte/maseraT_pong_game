# maseraT_pong_game

## 📝 Description
This project is about creating a website for the mighty Pong contest!
<br>
</br>

## 🏗 Build
```bash
git clone https://github.com/Maserati-Quattroporte/maseraT_pong_game.git

# put .env file in root directory, backend and frontend directory

docker-compose up --build
```
<br>
</br>

## ⚙️ Functions

### 1. Login
- Login to 42API
- Two-factor authentication using email
- Show match history: level, authority, etc

### 2. Chat
- Create channels(char rooms) can be either public or private(DM), or protected by a password
- The channel owner can set a password required to access the channel, change it, and also remove it.
- The channel owner is a channel administrator. They can set other users as
administrators.
- The administrators of a channel can ban or mute users for a limited time.

### 3. Game
- Therefore, users should be able to play a live Pong game versus another player directly on the website.
- There must be a matchmaking system: the user can join a queue until they get automatically matched with someone else.
- It can be a canvas game, or it can be a game rendered in 3D, it can also be ugly, but in any case, it must be faithful to the original Pong (1972).
- You must offer some customization options (for example, power-ups or different maps). However, the user should be able to select a default version of the game without any extra features if they want to.
- The user should be able to watch a live play between other users without interfering with it.

### 4. Security concerns
- Any password stored in your database must be encrypted.
- Your website must be protected against SQL injections.
<br>
</br>

## 🛠 Stack
<p>
    <img src=https://img.shields.io/badge/react-%2320232a.svg?style=for-the-badge&logo=react&logoColor=%2361DAFB>
    <img src=https://img.shields.io/badge/typescript-%23007ACC.svg?style=for-the-badge&logo=typescript&logoColor=white>
    <img src=https://img.shields.io/badge/nestjs-%23E0234E.svg?style=for-the-badge&logo=nestjs&logoColor=white>
    <img src=https://img.shields.io/badge/postgres-%23316192.svg?style=for-the-badge&logo=postgresql&logoColor=white>
    <img src=https://img.shields.io/badge/Socket.io-black?style=for-the-badge&logo=socket.io&badgeColor=010101>
    <img src=https://img.shields.io/badge/docker-%230db7ed.svg?style=for-the-badge&logo=docker&logoColor=white>
    <img src=https://img.shields.io/badge/Postman-FF6C37?style=for-the-badge&logo=postman&logoColor=white>
    <img src=https://img.shields.io/badge/jira-%230A0FFF.svg?style=for-the-badge&logo=jira&logoColor=white>
</p>
