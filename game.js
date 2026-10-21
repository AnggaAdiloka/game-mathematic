import { auth, db, signInAnonymously, collection, addDoc, serverTimestamp } from "./firebase.js";

const $ = id => document.getElementById(id);
const startPanel=$("start-panel"), gamePanel=$("game-panel"), finishPanel=$("finish-panel");
const canvas=$("game"), ctx=canvas.getContext("2d");
ctx.imageSmoothingEnabled=false;
let playerName="", playerClass="", score=0, correct=0, attempts=0, enemyIndex=0, startedAt=null, currentQuestion=null, questionLocked=false, gameOver=false;
const enemies=[{x:240,y:0,alive:true},{x:365,y:0,alive:true},{x:510,y:0,alive:true},{x:675,y:0,alive:true}];
const keys={left:false,right:false};
const player={x:60,y:0,w:26,h:34,vx:0,vy:0,onGround:false,dir:1};
const groundY=canvas.height-58;
const clamp=(n,min,max)=>Math.max(min,Math.min(max,n));

function drawPixelRect(x,y,w,h,color){ctx.fillStyle=color;ctx.fillRect(Math.round(x),Math.round(y),w,h)}
function drawScene(){
  // Langit dan awan
  ctx.fillStyle="#8bd7ff";ctx.fillRect(0,0,800,420);
  drawPixelRect(48,55,60,15,"#fff");drawPixelRect(62,43,28,12,"#fff");drawPixelRect(280,83,74,14,"#fff");drawPixelRect(300,69,28,14,"#fff");
  // Bukit pixel
  drawPixelRect(0,270,115,45,"#78c96b");drawPixelRect(18,245,70,25,"#78c96b");drawPixelRect(540,265,130,50,"#78c96b");drawPixelRect(565,240,80,25,"#78c96b");
  // Platform tanah
  drawPixelRect(0,groundY,800,58,"#a7653c");drawPixelRect(0,groundY,800,10,"#43b047");
  for(let x=0;x<800;x+=32){drawPixelRect(x,groundY+13,30,2,"#7a442e");drawPixelRect(x+8,groundY+29,3,3,"#7a442e")}
  // Balok dan koin
  for(const x of [145,177,209,430,462]){drawPixelRect(x,groundY-82,29,29,"#f4b52d");drawPixelRect(x,groundY-82,29,3,"#ffe88a");drawPixelRect(x+4,groundY-78,3,21,"#d68b20");drawPixelRect(x+20,groundY-78,3,21,"#d68b20")}
  // Tiang bendera/tujuan
  drawPixelRect(760,groundY-115,6,115,"#f7f1db");drawPixelRect(766,groundY-112,24,19,"#ef476f");
  // Koin skor dekoratif
  for(let i=0;i<3;i++){drawPixelRect(25+i*20,22,10,14,"#f9bd2f");drawPixelRect(28+i*20,25,4,8,"#fff0a3")}
}
function drawPlayer(){
  const x=Math.round(player.x),y=Math.round(player.y);
  // karakter orisinal pixel: topi, wajah, baju, sepatu
  drawPixelRect(x+5,y,16,6,"#e74c3c");drawPixelRect(x+2,y+5,22,5,"#e74c3c");
  drawPixelRect(x+6,y+10,15,10,"#f3c79a");drawPixelRect(x+16,y+12,3,3,"#1f2937");
  drawPixelRect(x+4,y+19,19,9,"#2563eb");drawPixelRect(x,y+20,5,10,"#f3c79a");drawPixelRect(x+22,y+20,5,10,"#f3c79a");
  drawPixelRect(x+4,y+28,8,5,"#5b3529");drawPixelRect(x+16,y+28,8,5,"#5b3529");
}
function drawEnemy(e){
  if(!e.alive)return;const x=Math.round(e.x),y=groundY-30;
  drawPixelRect(x+5,y,22,6,"#7c3aed");drawPixelRect(x,y+6,32,15,"#8b5cf6");drawPixelRect(x+4,y+21,8,7,"#4c1d95");drawPixelRect(x+20,y+21,8,7,"#4c1d95");
  drawPixelRect(x+7,y+9,5,6,"#fff");drawPixelRect(x+20,y+9,5,6,"#fff");drawPixelRect(x+9,y+11,2,3,"#1f2937");drawPixelRect(x+22,y+11,2,3,"#1f2937");
}
function render(){drawScene();enemies.forEach(drawEnemy);drawPlayer()}
function makeQuestion(){
  const type=Math.floor(Math.random()*4);let a,b,text,answer,kind;
  if(type===0){a=rand(10,99);b=rand(1,99);text=`${a} + ${b} = ...`;answer=a+b;kind="Penjumlahan"}
  else if(type===1){a=rand(20,100);b=rand(1,a);text=`${a} − ${b} = ...`;answer=a-b;kind="Pengurangan"}
  else if(type===2){a=rand(2,10);b=rand(2,10);text=`${a} × ${b} = ...`;answer=a*b;kind="Perkalian"}
  else {const groups=rand(2,8),each=rand(2,9);text=`Ada ${groups} kantong. Setiap kantong berisi ${each} kelereng. Berapa jumlah semua kelereng?`;answer=groups*each;kind="Soal cerita"}
  return {text,answer,kind};
}
function rand(min,max){return Math.floor(Math.random()*(max-min+1))+min}
function openQuestion(enemy){
  if(currentQuestion||!enemy.alive||gameOver)return;
  currentQuestion={...makeQuestion(),enemy};questionLocked=true;
  $("question-text").textContent=currentQuestion.text;
  $("answer-feedback").textContent="";$("answer-input").value="";
  $("question-panel").classList.remove("hidden");$("answer-input").focus();
}
function updateHud(){$("score").textContent=score;$("player-label").textContent=`${playerName} • ${playerClass}`;$("progress-label").textContent=`Musuh ${enemies.filter(e=>!e.alive).length}/4`}
function finishGame(){
  gameOver=true;gamePanel.classList.add("hidden");finishPanel.classList.remove("hidden");
  $("finish-title").textContent=`Hebat, ${playerName}!`;
  $("finish-message").textContent="Kamu berhasil melewati semua musuh. Terus berlatih matematika!";
  $("final-score").textContent=score;$("final-correct").textContent=correct;$("final-attempts").textContent=attempts;
  saveResult();
}
async function saveResult(){
  $("save-status").textContent="Menyimpan hasil ke database...";
  try{
    // Anonymous Authentication memberi setiap sesi identitas Firebase.
    if(!auth.currentUser) await signInAnonymously(auth);
    await addDoc(collection(db,"results"),{
      studentName:playerName, studentClass:playerClass, score, correctAnswers:correct,
      attempts, totalEnemies:enemies.length, completed:enemies.every(e=>!e.alive),
      durationSeconds:Math.max(1,Math.round((Date.now()-startedAt)/1000)),
      createdAt:serverTimestamp(), playerUid:auth.currentUser.uid,
      gameVersion:"1.0"
    });
    $("save-status").textContent="Hasil berhasil disimpan. Guru dapat melihatnya di halaman guru.";
  }catch(err){
    console.error(err);
    $("save-status").textContent="Hasil belum tersimpan. Periksa koneksi dan konfigurasi Firebase, lalu minta bantuan guru.";
  }
}
function resetGame(){
  score=0;correct=0;attempts=0;enemyIndex=0;currentQuestion=null;questionLocked=false;gameOver=false;startedAt=Date.now();
  player.x=60;player.y=groundY-player.h;player.vx=0;player.vy=0;player.onGround=true;
  enemies.forEach((e,i)=>{e.x=[240,365,510,675][i];e.alive=true});
  $("question-panel").classList.add("hidden");startPanel.classList.add("hidden");finishPanel.classList.add("hidden");gamePanel.classList.remove("hidden");
  updateHud();render();requestAnimationFrame(loop);
}
function loop(){
  if(gameOver)return;
  if(!questionLocked){
    player.vx=keys.left?-3.2:keys.right?3.2:0;
    player.x=clamp(player.x+player.vx,0,canvas.width-player.w);
    player.vy+=0.58;player.y+=player.vy;
    if(player.y+player.h>=groundY){player.y=groundY-player.h;player.vy=0;player.onGround=true}
    else player.onGround=false;
    for(const e of enemies){if(e.alive&&Math.abs((player.x+player.w/2)-(e.x+16))<35&&Math.abs((player.y+player.h)-(groundY))<45){openQuestion(e);break}}
    if(enemies.every(e=>!e.alive)&&player.x>720){finishGame();return}
  }
  updateHud();render();requestAnimationFrame(loop);
}
$("start-form").addEventListener("submit",async e=>{
  e.preventDefault();playerName=$("student-name").value.trim();playerClass=$("student-class").value;
  if(!playerName||!playerClass)return;
  try{if(!auth.currentUser)await signInAnonymously(auth)}catch(err){console.error(err)}
  resetGame();
});
$("answer-form").addEventListener("submit",e=>{
  e.preventDefault();if(!currentQuestion)return;
  const raw=$("answer-input").value.trim();if(raw==="")return;
  attempts++;
  if(Number(raw)===currentQuestion.answer){
    correct++;score+=10;currentQuestion.enemy.alive=false;enemyIndex++;
    $("answer-feedback").textContent="Benar! Musuh berhasil dikalahkan. +10 koin!";
    currentQuestion=null;questionLocked=false;
    setTimeout(()=>$("question-panel").classList.add("hidden"),450);
  }else{
    $("answer-feedback").textContent="Belum tepat. Coba hitung lagi, ya!";
    $("answer-input").select();
  }
});
$("play-again").addEventListener("click",()=>{startPanel.classList.remove("hidden");finishPanel.classList.add("hidden");gamePanel.classList.add("hidden");$("start-form").reset()});
document.addEventListener("keydown",e=>{
  if(["ArrowLeft","ArrowRight"," "].includes(e.key)&&!$("question-panel").classList.contains("hidden")){if(e.key===" ")e.preventDefault();return}
  if(e.key==="ArrowLeft")keys.left=true;if(e.key==="ArrowRight")keys.right=true;
  if(e.code==="Space"){e.preventDefault();if(player.onGround&&!questionLocked&&!gameOver){player.vy=-10.5;player.onGround=false}}
});
document.addEventListener("keyup",e=>{if(e.key==="ArrowLeft")keys.left=false;if(e.key==="ArrowRight")keys.right=false});
render();
