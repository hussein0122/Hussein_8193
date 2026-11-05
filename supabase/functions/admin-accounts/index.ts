import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.8";
const corsHeaders = {"Access-Control-Allow-Origin":"*","Access-Control-Allow-Headers":"authorization, apikey, content-type, x-client-info","Access-Control-Allow-Methods":"POST, OPTIONS","Content-Type":"application/json"};
const respond=(body:unknown,status=200)=>new Response(JSON.stringify(body),{status,headers:corsHeaders});
Deno.serve(async(req:Request)=>{
 if(req.method==="OPTIONS")return new Response("ok",{headers:corsHeaders});
 if(req.method!=="POST")return respond({error:"METHOD_NOT_ALLOWED"},405);
 try{
  const url=Deno.env.get("SUPABASE_URL")!,anonKey=Deno.env.get("SUPABASE_ANON_KEY")!,serviceKey=Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const authHeader=req.headers.get("Authorization")||"",token=authHeader.replace(/^Bearer\s+/i,"");
  if(!token||token===authHeader)return respond({error:"UNAUTHORIZED"},401);
  const authClient=createClient(url,anonKey,{auth:{persistSession:false,autoRefreshToken:false}});
  const {data:authData,error:authError}=await authClient.auth.getUser(token);
  if(authError||!authData.user)return respond({error:"UNAUTHORIZED"},401);
  const admin=createClient(url,serviceKey,{auth:{persistSession:false,autoRefreshToken:false}});
  const {data:actor,error:actorError}=await admin.from("profiles").select("id,role").eq("id",authData.user.id).maybeSingle();
  if(actorError)throw actorError;
  if(!actor||actor.role!=="ADMIN")return respond({error:"ADMIN_ONLY"},403);
  const body=await req.json();
  if(body.action==="list"){
   const {data,error}=await admin.from("profiles").select("id,full_name,email,role,created_at").in("role",["TEACHER","STUDENT"]).order("created_at",{ascending:false}).limit(1000);
   if(error)throw error;return respond({accounts:data||[]});
  }
  if(body.action==="delete"){
   const targetId=String(body.userId||"");if(!targetId)return respond({error:"USER_ID_REQUIRED"},400);
   if(targetId===authData.user.id)return respond({error:"CANNOT_DELETE_SELF"},400);
   const {data:target,error:targetError}=await admin.from("profiles").select("id,role").eq("id",targetId).maybeSingle();
   if(targetError)throw targetError;if(!target)return respond({error:"ACCOUNT_NOT_FOUND"},404);
   if(target.role==="ADMIN")return respond({error:"ADMIN_DELETE_BLOCKED"},403);
   if(target.role==="STUDENT"){
    const {error}=await admin.from("exam_attempts").delete().eq("student_id",targetId);if(error)throw error;
   }
   if(target.role==="TEACHER"){
    const {data:subjects,error:subjectReadError}=await admin.from("subjects").select("id").eq("teacher_id",targetId);
    if(subjectReadError)throw subjectReadError;
    const subjectIds=(subjects||[]).map((x:{id:string})=>x.id);
    const {data:owned,error:quizReadError}=await admin.from("quizzes").select("id").eq("created_by",targetId);
    if(quizReadError)throw quizReadError;
    let subjectQuizzes:{id:string}[]=[];
    if(subjectIds.length){const {data,error}=await admin.from("quizzes").select("id").in("subject_id",subjectIds);if(error)throw error;subjectQuizzes=data||[];}
    const quizIds=Array.from(new Set([...(owned||[]),...subjectQuizzes].map((x:{id:string})=>x.id)));
    if(quizIds.length){const {error}=await admin.from("exam_attempts").delete().in("exam_id",quizIds);if(error)throw error;const {error:delError}=await admin.from("quizzes").delete().in("id",quizIds);if(delError)throw delError;}
    if(subjectIds.length){const {error}=await admin.from("subjects").delete().in("id",subjectIds);if(error)throw error;}
   }
   const {error:eventError}=await admin.from("integrity_events").update({reviewed_by:null}).eq("reviewed_by",targetId);if(eventError)throw eventError;
   const {error:reviewError}=await admin.from("teacher_requests").update({reviewed_by:null}).eq("reviewed_by",targetId);if(reviewError)throw reviewError;
   const {error:deleteError}=await admin.auth.admin.deleteUser(targetId);if(deleteError)throw deleteError;
   return respond({success:true,deletedUserId:targetId});
  }
  return respond({error:"UNKNOWN_ACTION"},400);
 }catch(error){return respond({error:error instanceof Error?error.message:"INTERNAL_ERROR"},500);}
});