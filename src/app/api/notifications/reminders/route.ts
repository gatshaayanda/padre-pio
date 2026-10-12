import {createHash,timingSafeEqual} from "node:crypto";
import {NextResponse} from "next/server";

export const runtime="nodejs";

function matchesSecret(supplied:string,expected:string){
  const a=createHash("sha256").update(supplied).digest();
  const b=createHash("sha256").update(expected).digest();
  return timingSafeEqual(a,b)&&supplied.length>0;
}

export async function POST(request:Request){
  const expected=process.env.BOEMO_REMINDER_CRON_SECRET?.trim();
  const supplied=request.headers.get("authorization")?.replace(/^Bearer\s+/i,"").trim()??"";
  if(!expected||!matchesSecret(supplied,expected))return NextResponse.json({ok:false,error:"Unauthorized."},{status:401});
  try{
    const {runPickupReminders}=await import("@/lib/server/pickup-reminder-runner");
    const summary=await runPickupReminders();
    return NextResponse.json({ok:true,...summary});
  }catch(error){
    console.error("The Plug pickup reminder route failed:",error);
    return NextResponse.json({ok:false,error:error instanceof Error?error.message:"Reminder run failed."},{status:500});
  }
}
