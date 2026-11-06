import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { PrismaClient } from '@prisma/client';
import { z } from 'zod';

const app = express();
const prisma = new PrismaClient();
const secret = process.env.JWT_SECRET;
if (!secret || secret.length < 32) throw new Error('Set a JWT_SECRET of at least 32 characters');
app.use(helmet());
app.use(cors({ origin: process.env.CLIENT_ORIGIN || 'http://localhost:5173' }));
app.use(express.json({limit:'20kb'}));
const authLimiter = rateLimit({windowMs:15*60*1000,limit:20,standardHeaders:'draft-7',legacyHeaders:false});
const safe = fn => (req,res,next)=>Promise.resolve(fn(req,res,next)).catch(next);
const publicUser = u => ({id:u.id,name:u.name,email:u.email,role:u.role});
const tokenFor = u => jwt.sign({sub:u.id,role:u.role},secret,{expiresIn:'8h'});
const credentials = z.object({email:z.string().email().max(254),password:z.string().min(8).max(128)});
function requireAuth(req,res,next){
  try { const t=(req.headers.authorization||'').replace(/^Bearer /,''); const p=jwt.verify(t,secret); req.userId=p.sub; next(); }
  catch {res.status(401).json({error:'Please sign in again'});}
}
app.get('/api/health',(_req,res)=>res.json({status:'ok',service:'UmzaniEdu API'}));
app.post('/api/auth/register',authLimiter,safe(async(req,res)=>{
  const parsed=credentials.extend({name:z.string().trim().min(2).max(100)}).safeParse(req.body);
  if(!parsed.success)return res.status(400).json({error:'Provide a name, valid email and password (8+ characters)'});
  const {name,password}=parsed.data;const email=parsed.data.email.toLowerCase();
  if(await prisma.user.findUnique({where:{email}}))return res.status(409).json({error:'Email already registered'});
  const user=await prisma.user.create({data:{name,email,passwordHash:await bcrypt.hash(password,12),role:'STUDENT'}});
  res.status(201).json({token:tokenFor(user),user:publicUser(user)});
}));
app.post('/api/auth/login',authLimiter,safe(async(req,res)=>{
  const parsed=credentials.safeParse(req.body);
  if(!parsed.success)return res.status(400).json({error:'Invalid login details'});
  const user=await prisma.user.findUnique({where:{email:parsed.data.email.toLowerCase()}});
  if(!user||!(await bcrypt.compare(parsed.data.password,user.passwordHash)))return res.status(401).json({error:'Incorrect email or password'});
  res.json({token:tokenFor(user),user:publicUser(user)});
}));
app.get('/api/me',requireAuth,safe(async(req,res)=>{
  const user=await prisma.user.findUnique({where:{id:req.userId}});
  if(!user)return res.status(401).json({error:'Account unavailable'});
  res.json({user:publicUser(user)});
}));
app.get('/api/subjects',requireAuth,safe(async(_req,res)=>res.json(await prisma.subject.findMany({include:{lessons:{select:{id:true,title:true}}},orderBy:[{grade:'asc'},{name:'asc'}]}))));
app.get('/api/lessons/:id',requireAuth,safe(async(req,res)=>{
  const lesson=await prisma.lesson.findUnique({where:{id:req.params.id}});
  if(!lesson)return res.status(404).json({error:'Lesson not found'});
  res.json(lesson);
}));
app.get('/api/progress',requireAuth,safe(async(req,res)=>res.json(await prisma.progress.findMany({where:{userId:req.userId},select:{lessonId:true,completedAt:true}}))));
app.post('/api/lessons/:id/complete',requireAuth,safe(async(req,res)=>{
  const lesson=await prisma.lesson.findUnique({where:{id:req.params.id}});
  if(!lesson)return res.status(404).json({error:'Lesson not found'});
  const progress=await prisma.progress.upsert({where:{userId_lessonId:{userId:req.userId,lessonId:lesson.id}},update:{},create:{userId:req.userId,lessonId:lesson.id}});
  res.json(progress);
}));
app.use((err,_req,res,_next)=>{console.error(err);res.status(500).json({error:'Server error'});});
app.listen(Number(process.env.PORT||4000),()=>console.log('UmzaniEdu API listening on port '+(process.env.PORT||4000)));
