import {NextResponse} from "next/server";
const U=process.env.NEXT_PUBLIC_SUPABASE_URL!;
const K=process.env.SUPABASE_SECRET_KEY||process.env.SUPABASE_SERVICE_ROLE_KEY!;
export async function POST(req:Request){
 try{
  const token=(req.headers.get("authorization")||"").replace(/^Bearer\s+/i,"");
  if(!token)return NextResponse.json({error:"Ikke innlogget"},{status:401});
  const me=await fetch(U+"/auth/v1/user",{headers:{apikey:K,Authorization:"Bearer "+token}});
  if(!me.ok)return NextResponse.json({error:"Ikke innlogget"},{status:401});
  const body=await req.json();
  const raw=Array.isArray(body?.messages)?body.messages:[];
  const messages=raw.slice(-12).filter((m:any)=>["user","assistant"].includes(m?.role)&&typeof m?.content==="string").map((m:any)=>({role:m.role,content:m.content.slice(0,4000)}));
  if(!messages.length)return NextResponse.json({error:"Tom melding"},{status:400});
  const key=process.env.AI_GATEWAY_API_KEY||process.env.VERCEL_OIDC_TOKEN;
  if(!key)return NextResponse.json({error:"AI er ikke tilgjengelig akkurat nå."},{status:503});
  const language=({nb:"Norwegian",da:"Danish",sv:"Swedish",pl:"Polish",en:"English",de:"German"} as any)[body?.lang]||"Norwegian";
  const system="You are Spør RALA, a friendly support and guidance assistant in RALA GO. Reply in "+language+" unless asked otherwise. You can answer general questions and guide users. You cannot place, change, cancel or approve orders or change app data. If asked to do so, explain that the user must perform the action in RALA GO and offer guidance. Never claim an action was completed. Keep answers helpful and concise.";
  const ai=await fetch("https://ai-gateway.vercel.sh/v1/chat/completions",{method:"POST",headers:{Authorization:"Bearer "+key,"Content-Type":"application/json"},body:JSON.stringify({model:"openai/gpt-5.6",messages:[{role:"system",content:system},...messages],max_tokens:900})});
  if(!ai.ok){console.error("RALA AI gateway failed",ai.status,await ai.text());return NextResponse.json({error:"RALA AI kunne ikke svare akkurat nå."},{status:502})}
  const data=await ai.json();const answer=data?.choices?.[0]?.message?.content;
  if(!answer)return NextResponse.json({error:"RALA AI ga ikke noe svar."},{status:502});
  return NextResponse.json({answer});
 }catch(e){console.error("RALA AI error",e);return NextResponse.json({error:"RALA AI kunne ikke svare akkurat nå."},{status:500})}
}
