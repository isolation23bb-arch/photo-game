import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";

import {
  getAuth,
  signInAnonymously
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";

import {
  getFirestore,
  collection,
  getDocs,
  doc,
  setDoc
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

// Firebase 콘솔에서 받은 값으로 교체
const firebaseConfig = {
  apiKey: "AIzaSyBIsZruX94_SmRn8UCi7dzRJPELYJAVPII",
  authDomain: "photo-game-afd80.firebaseapp.com",
  projectId: "photo-game-afd80",
  storageBucket: "photo-game-afd80.firebasestorage.app",
  messagingSenderId: "691177476474",
  appId: "1:691177476474:web:004e9e4c6dffa2e01b86c3"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

await signInAnonymously(auth);

const photo = document.getElementById("photo");
const answer = document.getElementById("answer");
const result = document.getElementById("result");
const scoreBoard = document.getElementById("score");

let questions = [];
let currentIndex = 0;
let totalScore = 0;
let nickname = "";
let startTime;

// Firestore에서 문제 불러오기
const snapshot = await getDocs(collection(db, "members"));

snapshot.forEach((item) => {
  questions.push(item.data());
});

// 문제 섞기
questions.sort(() => Math.random() - 0.5);

document
.getElementById("startBtn")
.addEventListener("click",()=>{

  nickname =
  document
  .getElementById("nickname")
  .value
  .trim();

  if(!nickname){
    alert("닉네임 입력!");
    return;
  }

  document.getElementById("bgm").play();

  document
  .getElementById("loginBox")
  .style.display = "none";

  document
  .getElementById("gameArea")
  .style.display = "block";

  showQuestion();
});


function showQuestion() {

  if (currentIndex >= questions.length) {
    finishGame();
    return;
  }

  document.getElementById("progressText").innerHTML =
    `문제 ${currentIndex + 1} / ${questions.length}`;

  const percent =
    ((currentIndex + 1) / questions.length) * 100;

  document.getElementById("progressBar").style.width =
    `${percent}%`;

  photo.src = questions[currentIndex].image;

  answer.value = "";
  result.innerHTML = "";

  startTime = Date.now();
}

document.getElementById("submit").addEventListener("click", () => {
  const userAnswer = answer.value.trim().replaceAll(" ", "");

  const correctAnswer =
    questions[currentIndex].name.replaceAll(" ", "");

  const elapsed =
    (Date.now() - startTime) / 1000;

  const earned =
    Math.max(50, Math.floor(100 - elapsed * 2));

  if (userAnswer === correctAnswer) {
    totalScore += earned;

    result.innerHTML =
      `✅ 정답!
      ${earned}점 획득
      정답: ${questions[currentIndex].name}`;
  } else {
    result.innerHTML =
      `❌ 오답
      정답: ${questions[currentIndex].name}`;
  }

  scoreBoard.innerHTML =
    `점수: ${totalScore}`;
});

document.getElementById("next").addEventListener("click", () => {
  currentIndex++;
  showQuestion();
});

async function finishGame() {
  const uid = auth.currentUser.uid;

  await setDoc(
    doc(db, "scores", uid),
    {
      nickname: nickname,
      score: totalScore
    }
  );

  const rankingSnapshot =
    await getDocs(collection(db, "scores"));

  let ranking = [];

  rankingSnapshot.forEach((item) => {
    ranking.push(item.data());
  });

  ranking.sort((a, b) => b.score - a.score);

  let html = `
    <h1>게임 종료</h1>
    <h2>내 점수 : ${totalScore}</h2>
    <h2>랭킹</h2>
  `;

  ranking.forEach((user, index) => {
    html += `
      <div>
        ${index + 1}위
        ${user.nickname}
        -
        ${user.score}점
      </div>
    `;
  });

  document.body.innerHTML = html;
}
