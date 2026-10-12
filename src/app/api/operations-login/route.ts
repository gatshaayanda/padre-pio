import {createHash,createHmac,timingSafeEqual} from "node:crypto";
import {cert,getApps,initializeApp} from "firebase-admin/app";
import {getAuth} from "firebase-admin/auth";
import {getFirestore} from "firebase-admin/firestore";
import {NextResponse} from "next/server";

export const runtime="nodejs";

function getAdminApp(){
 const existing=getApps()[0];if(existing)return existing;
 const raw=process.env.FIREBASE_ADMIN_KEY;
 if(!raw)throw new Error("Missing FIREBASE_ADMIN_KEY environment variable.");
 let serviceAccount:Record<string,unknown>;
 try{serviceAccount=JSON.parse(raw) as Record<string,unknown>}catch{throw new Error("FIREBASE_ADMIN_KEY must contain valid service-account JSON.")}
 return initializeApp({credential:cert(serviceAccount as Parameters<typeof cert>[0])});
}
const LOGIN_WINDOW_MS=15*60*1000;
const LOGIN_MAX_ATTEMPTS=5;

function clientAddress(request:Request){
 const trusted=request.headers.get("x-real-ip")?.trim();
 if(trusted)return trusted.slice(0,128);
 const forwarded=request.headers.get("x-forwarded-for")||"";
 const last=forwarded.split(",").map(value=>value.trim()).filter(Boolean).at(-1);
 return (last||"unknown").slice(0,128);
}

async function consumeLoginAttempt(request:Request,expected:string){
 const db=getFirestore(getAdminApp());
 const address=clientAddress(request);
 const key=createHmac("sha256",expected).update(address).digest("hex");
 const ref=db.collection("operationsLoginRateLimits").doc(key);
 const now=Date.now();
 const result=await db.runTransaction(async tx=>{
  const snap=await tx.get(ref);
  const data=snap.data()??{};
  const started=typeof data.windowStartedAt==="number"?data.windowStartedAt:0;
  const attempts=typeof data.attempts==="number"?data.attempts:0;
  if(snap.exists&&now-started<LOGIN_WINDOW_MS&&attempts>=LOGIN_MAX_ATTEMPTS){
   return {limited:true,retryAfter:Math.max(1,Math.ceil((started+LOGIN_WINDOW_MS-now)/1000))};
  }
  const sameWindow=snap.exists&&now-started<LOGIN_WINDOW_MS;
  const windowStartedAt=sameWindow?started:now;
  tx.set(ref,{attempts:sameWindow?attempts+1:1,windowStartedAt,expiresAt:new Date(windowStartedAt+LOGIN_WINDOW_MS),updatedAt:new Date(now)},{merge:true});
  return {limited:false,retryAfter:0};
 });
 // Bounded cleanup prevents rate-limit documents from accumulating indefinitely.
 const expired=await db.collection("operationsLoginRateLimits").where("expiresAt","<",new Date(now)).limit(5).get().catch(()=>null);
 if(expired)await Promise.all(expired.docs.map(doc=>doc.ref.delete().catch(()=>{})));
 return result;
}

function matchesWord(input:string,expected:string){
 const a=createHash("sha256").update(input).digest();
 const b=createHash("sha256").update(expected).digest();
 return timingSafeEqual(a,b)&&input.length>0;
}
export async function POST(request:Request){
 try{
  const expected=process.env.THE_PLUG_OPERATIONS_WORD;
  if(!expected)return NextResponse.json({error:"Operations access is not configured yet. Set THE_PLUG_OPERATIONS_WORD in Vercel."},{status:503});
  const contentLength=Number(request.headers.get("content-length")||"0");
  if(Number.isFinite(contentLength)&&contentLength>4096)return NextResponse.json({error:"Request is too large."},{status:413});
  let attempt:{limited:boolean;retryAfter:number};
  try{attempt=await consumeLoginAttempt(request,expected)}catch(error){
   console.error("Operations login rate limit unavailable:",error instanceof Error?error.message:"unknown error");
   return NextResponse.json({error:"Operations sign-in is temporarily unavailable. Try again shortly."},{status:503});
  }
  if(attempt.limited)return NextResponse.json({error:"Too many Operations sign-in attempts. Wait before trying again."},{status:429,headers:{"Retry-After":String(attempt.retryAfter),"Cache-Control":"no-store"}});
  const body=await request.json().catch(()=>null) as {word?:unknown}|null;
  const word=typeof body?.word==="string"?body.word:"";
  if(!matchesWord(word,expected))return NextResponse.json({error:"Access denied. Check the access word and try again."},{status:401,headers:{"Cache-Control":"no-store"}});
  const app=getAdminApp();
  await getFirestore(app).collection("operationsLoginRateLimits").doc(createHmac("sha256",expected).update(clientAddress(request)).digest("hex")).delete().catch(()=>{});
  const uid="the-plug-temporary-operations";
  await getFirestore(app).collection("admins").doc(uid).set({role:"owner",temporaryAccess:true,createdAt:new Date().toISOString()},{merge:true});
  const token=await getAuth(app).createCustomToken(uid);
  return NextResponse.json({token},{headers:{"Cache-Control":"no-store"}});
 }catch(error){
  console.error("Operations login failed:",error instanceof Error?error.message:"unknown error");
  return NextResponse.json({error:"Operations sign-in is temporarily unavailable. Check the server configuration."},{status:500});
 }
}
