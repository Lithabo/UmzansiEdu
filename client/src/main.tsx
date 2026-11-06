import React,{useEffect,useState} from 'react';
import{createRoot}from'react-dom/client';
import './style.css';
type User={id:string;name:string;email:string;role:string};
type Subject={id:string;name:string;grade:number;lessons:{id:string;title:string}[]};
type Lesson={id:string;title:string;content:string};
const API='/api';
function App(){
 const[token,setToken]=useState(()=>sessionStorage.getItem('umzani_token')||'');
 const[user,setUser]=useState<User|null>(null);
 const[subjects,setSubjects]=useState<Subject[]>([]);
 const[done,setDone]=useState<string[]>([]);
 const[lesson,setLesson]=useState<Lesson|null>(null);
 const[mode,setMode]=useState<'login'|'register'>('register');
 const[error,setError]=useState('');
 const[busy,setBusy]=useState(false);
 async function api(path:string,opts:RequestInit={}){
  const response=await fetch(API+path,{...opts,headers:{'Content-Type':'application/json',...(token?{Authorization:`Bearer ${token}`}:{}),...opts.headers}});
  const data=await response.json();if(!response.ok)throw new Error(data.error||'Request failed');return data;
 }
 function logout(){sessionStorage.removeItem('umzani_token');setToken('');setUser(null);setSubjects([]);setLesson(null);}
 useEffect(()=>{if(!token)return;Promise.all([api('/me'),api('/subjects'),api('/progress')]).then(([a,b,c])=>{setUser(a.user);setSubjects(b);setDone(c.map((p:{lessonId:string})=>p.lessonId));}).catch(()=>logout());},[token]);
 async function submit(e:React.FormEvent<HTMLFormElement>){e.preventDefault();setError('');setBusy(true);const form=new FormData(e.currentTarget);try{
 const data=await api('/auth/'+mode,{method:'POST',body:JSON.stringify({name:form.get('name'),email:form.get('email'),password:form.get('password')})});sessionStorage.setItem('umzani_token',data.token);setToken(data.token);
 }catch(e){setError((e as Error).message);}finally{setBusy(false);}}
 async function openLesson(id:string){try{setLesson(await api('/lessons/'+id));}catch(e){setError((e as Error).message);}}
 async function complete(){if(!lesson)return;try{await api('/lessons/'+lesson.id+'/complete',{method:'POST'});setDone(v=>[...new Set([...v,lesson.id])]);setLesson(null);}catch(e){setError((e as Error).message);}}
 return <div className="app"><header><div className="brand"><span className="logo">U</span><span>Umzani<span className="accent">Edu</span></span></div><nav><span>Learn • Grow • Achieve</span>{user&&<button className="outline" onClick={logout}>Sign out</button>}</nav></header>
 {!user?<main className="hero"><section><div className="eyebrow">SOUTH AFRICA'S DIGITAL CLASSROOM</div><h1>Your future starts with <span className="accent">better learning.</span></h1><p>Explore lessons, build confidence and track your progress. Your AI-powered learning journey starts here.</p><div className="features"><span>✓ School subjects</span><span>✓ Progress tracking</span><span>✓ More features coming</span></div></section><section className="panel"><h2>{mode==='register'?'Create student account':'Welcome back'}</h2><p>{mode==='register'?'Start learning for free':'Sign in to continue learning'}</p><form onSubmit={submit}>{mode==='register'&&<label>Full name<input name="name" required minLength={2} placeholder="Your name"/></label>}<label>Email address<input type="email" name="email" required placeholder="you@example.com"/></label><label>Password<input type="password" name="password" required minLength={8} placeholder="At least 8 characters"/></label>{error&&<div className="error">{error}</div>}<button disabled={busy} type="submit">{busy?'Please wait...':mode==='register'?'Create account':'Sign in'}</button></form><p className="switch">{mode==='register'?'Already have an account?':'New to UmzaniEdu?'} <button className="link" onClick={()=>{setMode(mode==='register'?'login':'register');setError('');}}>{mode==='register'?'Sign in':'Register'}</button></p></section></main>:<main className="dashboard"><div className="eyebrow">STUDENT DASHBOARD</div><h1>Welcome, {user.name.split(' ')[0]} 👋</h1><p>Choose a lesson and keep building your knowledge.</p><div className="stats"><div className="panel"><b>{subjects.length}</b><span>Subjects</span></div><div className="panel"><b>{subjects.reduce((n,s)=>n+s.lessons.length,0)}</b><span>Lessons available</span></div><div className="panel"><b>{done.length}</b><span>Lessons completed</span></div></div>{error&&<p className="error">{error}</p>}{lesson?<section className="panel lesson"><button className="link" onClick={()=>setLesson(null)}>← Back to subjects</button><h2>{lesson.title}</h2><p>{lesson.content}</p><button onClick={complete}>Mark lesson complete</button></section>:<><h2>Your subjects</h2><div className="subject-grid">{subjects.map(s=><section className="panel" key={s.id}><div className="eyebrow">GRADE {s.grade}</div><h3>{s.name}</h3>{s.lessons.map(l=><button className="lesson-link" key={l.id} onClick={()=>openLesson(l.id)}>{done.includes(l.id)?'✓ ': '📖 '}{l.title}</button>)}</section>)}</div>{subjects.length===0&&<p>No lessons yet. Run the demo seed command in the README.</p>}</>}</main>}
 <footer>© {new Date().getFullYear()} UmzaniEdu • Built for South African learners</footer></div>;
}
createRoot(document.getElementById('root')!).render(<React.StrictMode><App/></React.StrictMode>);
