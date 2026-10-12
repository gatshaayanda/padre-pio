import {NextResponse} from "next/server";
import {cert,getApps,initializeApp} from "firebase-admin/app";
import {getAuth} from "firebase-admin/auth";
import {getFirestore} from "firebase-admin/firestore";
import {getMessaging} from "firebase-admin/messaging";
export const runtime="nodejs";
function app(){const raw=process.env.FIREBASE_ADMIN_KEY;if(!raw)throw new Error("The Plug notifications are not configured yet.");const existing=getApps()[0];if(existing)return existing;let serviceAccount:Record<string,unknown>;try{serviceAccount=JSON.parse(raw) as Record<string,unknown>}catch{throw new Error("The Plug notification credentials are not valid JSON yet.")}return initializeApp({credential:cert(serviceAccount as Parameters<typeof cert>[0])})}
export async function POST(request:Request){
 try{
  const a=app();const header=request.headers.get("authorization")||"";const match=header.match(/^Bearer\s+(.+)$/i);if(!match)throw new Error("Missing authentication token.");
  const uid=(await getAuth(a).verifyIdToken(match[1])).uid;const {conversationId,messageId}=await request.json() as {conversationId?:unknown;messageId?:unknown};
  if(typeof conversationId!=="string"||!/^[A-Za-z0-9_-]{1,128}$/.test(conversationId)||typeof messageId!=="string"||!/^[A-Za-z0-9_-]{1,128}$/.test(messageId))return NextResponse.json({sent:0,error:"Invalid conversation message identifiers."},{status:400});
  const db=getFirestore(a),messaging=getMessaging(a);const conversation=await db.collection("conversations").doc(conversationId).get();const message=await db.collection("conversations").doc(conversationId).collection("messages").doc(messageId).get();
  if(!conversation.exists||!message.exists)return NextResponse.json({sent:0,error:"Conversation message not found."},{status:404});
  const data=conversation.data()??{},msg=message.data()??{};if(String(msg.senderId??"")!==uid)return NextResponse.json({sent:0,error:"Message does not belong to this sender."},{status:403});
  const customerId=String(data.customerId??"");if(!customerId)return NextResponse.json({sent:0,error:"Conversation has no customer account."},{status:409});
  const senderAdmin=await db.collection("admins").doc(uid).get();const senderAdminRole=String(senderAdmin.data()?.role??"").toLowerCase();const isAdmin=senderAdmin.exists&&["owner","staff"].includes(senderAdminRole);
  const senderRole=String(msg.senderRole??"").toLowerCase();
  if(senderRole==="customer"&&(uid!==customerId||isAdmin))return NextResponse.json({sent:0,error:"Customer message does not belong to this account."},{status:403});
  if(senderRole==="admin"&&!isAdmin)return NextResponse.json({sent:0,error:"Only authorized staff can notify a customer about an admin reply."},{status:403});
  if(senderRole!=="customer"&&senderRole!=="admin")return NextResponse.json({sent:0,error:"Invalid message sender role."},{status:400});
  const deliveryKey="conversation_"+conversationId+"_"+messageId;
  const deliveryRef=db.collection("notificationDeliveries").doc(deliveryKey);
  const now=Date.now();
  const canSend=await db.runTransaction(async transaction=>{
    const saved=await transaction.get(deliveryRef);
    const data=saved.data()??{};
    const claimedAt=typeof data.claimedAtMs==="number"?data.claimedAtMs:0;
    if(saved.exists&&(data.status==="sent"||now-claimedAt<300000))return false;
    transaction.set(deliveryRef,{type:"conversation-message",conversationId,messageId,status:"sending",claimedAtMs:now,updatedAt:new Date(now).toISOString()},{merge:true});
    return true;
  });
  if(!canSend)return NextResponse.json({sent:0,duplicate:true});
  const admins=senderRole==="customer"?await db.collection("admins").get():null;const recipientIds:string[]=[];
  if(senderRole==="customer"&&admins){for(const admin of admins.docs){const role=String(admin.data().role??"").toLowerCase();if(!["owner","staff"].includes(role))continue;const pref=(await db.collection("notificationPreferences").doc(admin.id).get()).data();if(pref?.enabled)recipientIds.push(admin.id)}}else{recipientIds.push(customerId)}
  let sent=0,attempted=0,failed=0;const preview=String(msg.text??"Attachment sent").slice(0,120);const title=senderRole==="customer"?String(data.customerName??"Customer")+" sent a message":"The Plug replied";
  for(const recipient of recipientIds){
    const tokens=await db.collection("notificationTokens").doc(recipient).collection("tokens").get();
    for(const tokenDoc of tokens.docs){
      attempted++;
      try{
        await messaging.send({
          token:String(tokenDoc.data().token),
          notification:{title,body:preview},
          data:{link:senderRole==="customer"?"/admin":"/account",conversationId,messageId},
          webpush:{fcmOptions:{link:(process.env.NEXT_PUBLIC_BASE_URL||"https://the-plug-pearl.vercel.app")+(senderRole==="customer"?"/admin":"/account")}}
        });
        sent++;
      }catch(error){
        failed++;
        const code=(error as {code?:string})?.code||"";
        console.warn("The Plug conversation push failed:",code||"unknown");
        if(code==="messaging/registration-token-not-registered"||code==="messaging/invalid-registration-token"){
          await tokenDoc.ref.delete().catch(()=>{});
        }
      }
    }
  }
  const status=sent===0?(attempted===0?"no-recipients":"failed"):(failed>0?"partial":"sent");
  await deliveryRef.set({status,sentCount:sent,attemptedCount:attempted,failedCount:failed,sentAt:new Date().toISOString(),updatedAt:new Date().toISOString()},{merge:true});
  return NextResponse.json({sent,attempted,failed,status},{status:sent===0?503:200});
 }catch(error){console.error("The Plug conversation notification failed:",error);return NextResponse.json({sent:0,error:error instanceof Error?error.message:"Conversation notification unavailable while The Plug is being built."},{status:400})}
}
