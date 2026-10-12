import {NextResponse} from "next/server";
import {cert,getApps,initializeApp} from "firebase-admin/app";
import {getFirestore} from "firebase-admin/firestore";
import {getMessaging} from "firebase-admin/messaging";
import {getAuth} from "firebase-admin/auth";

export const runtime="nodejs";

function app(){
 const raw=process.env.FIREBASE_ADMIN_KEY;
 if(!raw)throw new Error("The Plug notifications are not configured yet.");
 const existing=getApps()[0];if(existing)return existing;
 let serviceAccount:Record<string,unknown>;
 try{serviceAccount=JSON.parse(raw) as Record<string,unknown>}
 catch{throw new Error("The Plug notification credentials are not valid JSON yet.")}
 return initializeApp({credential:cert(serviceAccount as Parameters<typeof cert>[0])});
}

async function verifyUid(request:Request){
 const header=request.headers.get("authorization")||"";
 const match=header.match(/^Bearer\s+(.+)$/i);
 if(!match)throw new Error("Missing authentication token.");
 return getAuth(app()).verifyIdToken(match[1]);
}

export async function POST(request:Request){
 try{
  const decoded=await verifyUid(request);
  const body=await request.json().catch(()=>null) as {requestId?:unknown}|null;
  const requestId=body?.requestId;
  if(typeof requestId!=="string"||!/^[A-Za-z0-9_-]{10,128}$/.test(requestId)){
   return NextResponse.json({sent:0,error:"Invalid request ID."},{status:400});
  }
  const firebase=app(),db=getFirestore(firebase),messaging=getMessaging(firebase);
  const snap=await db.collection("sourcingRequests").doc(requestId).get();
  if(!snap.exists)return NextResponse.json({sent:0,error:"Sourcing request not found."},{status:404});
  const data=snap.data()??{};
  if(String(data.customerId??"")!==decoded.uid){
   return NextResponse.json({sent:0,error:"Request does not belong to this customer."},{status:403});
  }

  const deliveryRef=db.collection("notificationDeliveries").doc("sourcing_request_"+requestId);
  const now=Date.now();
  const canSend=await db.runTransaction(async transaction=>{
   const saved=await transaction.get(deliveryRef);
   const previous=saved.data()??{};
   const claimedAt=typeof previous.claimedAtMs==="number"?previous.claimedAtMs:0;
   if(saved.exists&&(previous.status==="sent"||now-claimedAt<300000))return false;
   transaction.set(deliveryRef,{type:"sourcing-request",requestId,status:"sending",claimedAtMs:now,updatedAt:new Date(now).toISOString()},{merge:true});
   return true;
  });
  if(!canSend)return NextResponse.json({sent:0,duplicate:true});

  const admins=await db.collection("admins").get();
  let sent=0,attempted=0,failed=0;
  for(const admin of admins.docs){
   const role=String(admin.data().role??"").toLowerCase();
   if(!["owner","staff"].includes(role))continue;
   const pref=(await db.collection("notificationPreferences").doc(admin.id).get()).data();
   if(!pref?.enabled)continue;
   const tokens=await db.collection("notificationTokens").doc(admin.id).collection("tokens").get();
   for(const tokenDoc of tokens.docs){
    attempted++;
    try{
     await messaging.send({
      token:String(tokenDoc.data().token),
      notification:{title:"New The Plug sourcing request",body:String(data.customerName??"Customer")+" · "+String(data.product??"Product")},
      data:{link:"/admin",requestId},
      webpush:{fcmOptions:{link:(process.env.NEXT_PUBLIC_BASE_URL||"https://the-plug-pearl.vercel.app")+"/admin"}}
     });
     sent++;
    }catch(error){
     failed++;
     const code=(error as {code?:string})?.code||"";
     console.warn("The Plug sourcing push failed:",code||"unknown");
     if(code==="messaging/registration-token-not-registered"||code==="messaging/invalid-registration-token"){
      await tokenDoc.ref.delete().catch(()=>{});
     }
    }
   }
  }
  const status=sent===0?(attempted===0?"no-recipients":"failed"):(failed>0?"partial":"sent");
  await deliveryRef.set({status,sentCount:sent,attemptedCount:attempted,failedCount:failed,sentAt:new Date().toISOString(),updatedAt:new Date().toISOString()},{merge:true});
  return NextResponse.json({sent,attempted,failed,status},{status:sent===0?503:200});
 }catch(error){
  console.error("The Plug sourcing notification failed:",error);
  return NextResponse.json({sent:0,error:error instanceof Error?error.message:"Notification unavailable while The Plug is being built."},{status:400});
 }
}
