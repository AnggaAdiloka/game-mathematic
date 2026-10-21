import { auth, db, signInWithEmailAndPassword, signOut, onAuthStateChanged, collection, getDocs, query, orderBy, limit } from "./firebase.js";
const $=id=>document.getElementById(id);
let isTeacher=false;
$("login-form").addEventListener("submit",async e=>{
  e.preventDefault();$("login-status").textContent="Memeriksa akun...";
  try{await signInWithEmailAndPassword(auth,$("email").value.trim(),$("password").value);$("login-status").textContent=""}
  catch(err){console.error(err);$("login-status").textContent="Login gagal. Periksa email dan password akun guru."; $("login-status").classList.add("error")}
});
onAuthStateChanged(auth,async user=>{
  if(!user || user.isAnonymous){isTeacher=false;$("login-card").classList.remove("hidden");$("results-card").classList.add("hidden");return}
  // Keputusan akses final dilakukan oleh Firestore Rules berdasarkan UID guru.
  $("login-card").classList.add("hidden");$("results-card").classList.remove("hidden");$("teacher-label").textContent=`Masuk sebagai ${user.email||"akun terautentikasi"}`;
  await loadResults();
});
async function loadResults(){
  $("results-status").textContent="Memuat hasil...";
  $("results-body").replaceChildren();
  try{
    const q=query(collection(db,"results"),orderBy("createdAt","desc"),limit(500));
    const snap=await getDocs(q);
    if(snap.empty){$("results-status").textContent="Belum ada hasil permainan.";return}
    $("results-status").textContent=`Menampilkan ${snap.size} hasil terbaru.`;
    for(const docSnap of snap.docs){
      const d=docSnap.data(),tr=document.createElement("tr");
      const date=d.createdAt?.toDate?d.createdAt.toDate().toLocaleString("id-ID"):"—";
      [date,d.studentName||"—",d.studentClass||"—",String(d.score??0),String(d.correctAnswers??0),String(d.attempts??0),`${d.durationSeconds??0} dtk`].forEach(value=>{const td=document.createElement("td");td.textContent=value;tr.appendChild(td)});
      $("results-body").appendChild(tr);
    }
  }catch(err){
    console.error(err);
    $("results-status").textContent="Tidak dapat membaca hasil. Pastikan UID akun guru sudah diizinkan di firestore.rules dan aturan sudah dipublikasikan.";
    $("results-status").classList.add("error");
  }
}
$("refresh").addEventListener("click",loadResults);
$("logout").addEventListener("click",async()=>{await signOut(auth);$("login-form").reset()});
