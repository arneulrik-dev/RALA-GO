import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const url=process.env.NEXT_PUBLIC_SUPABASE_URL!;
const secret=process.env.SUPABASE_SECRET_KEY||process.env.SUPABASE_SERVICE_ROLE_KEY!;

export async function POST(req:Request){
 try{
  if(!url||!secret)return NextResponse.json({error:"Serveroppsett mangler."},{status:500});
  const token=(req.headers.get("authorization")||"").replace(/^Bearer\s+/i,"");
  if(!token)return NextResponse.json({error:"Ikke innlogget."},{status:401});
  const admin=createClient(url,secret,{auth:{persistSession:false,autoRefreshToken:false}});
  const {data:{user},error:authError}=await admin.auth.getUser(token);
  if(authError||!user)return NextResponse.json({error:"Ugyldig innlogging."},{status:401});
  const {data:caller}=await admin.from("profiles").select("company_id,role,can_create_workers").eq("id",user.id).single();
  if(!caller||caller.role!=="approver"||caller.can_create_workers!==true)return NextResponse.json({error:"Du har ikke tilgang til å opprette arbeidere."},{status:403});
  const body=await req.json(); const fullName=String(body.fullName||"").trim(); const username=String(body.username||"").trim().toLowerCase(); const email=String(body.email||"").trim().toLowerCase(); const password=String(body.password||"");
  if(!fullName||!username||!email.includes("@")||password.length<8)return NextResponse.json({error:"Fyll ut navn, brukernavn, gyldig e-post og passord på minst 8 tegn."},{status:400});
  const {data:dupes}=await admin.from("profiles").select("id").or(`username.eq.${username},notification_email.ilike.${email}`).limit(1);
  if(dupes?.length)return NextResponse.json({error:"Brukernavn eller e-post er allerede i bruk."},{status:409});
  const {data:created,error:createError}=await admin.auth.admin.createUser({email,password,email_confirm:true,user_metadata:{username,full_name:fullName}});
  if(createError||!created.user)return NextResponse.json({error:createError?.message||"Kunne ikke opprette bruker."},{status:400});
  const {error:updateError}=await admin.from("profiles").update({full_name:fullName,username,company_id:caller.company_id,role:"worker",approval_limit:0,notification_email:email,is_active:true,can_create_workers:false,created_by:user.id}).eq("id",created.user.id);
  if(updateError){await admin.auth.admin.deleteUser(created.user.id);return NextResponse.json({error:"Kunne ikke ferdigstille brukerprofilen."},{status:500});}
  return NextResponse.json({ok:true,userId:created.user.id});
 }catch(e){console.error("create-worker failed",e);return NextResponse.json({error:"Kunne ikke opprette arbeider."},{status:500});}
}