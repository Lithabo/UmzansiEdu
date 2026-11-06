import 'dotenv/config';
import {PrismaClient} from '@prisma/client';
const db=new PrismaClient();
for(const item of [
  {name:'Mathematics',grade:8,title:'Introduction to algebra',content:'A variable represents a number. Solve x + 4 = 9 by subtracting 4 from both sides. Therefore x = 5.'},
  {name:'Natural Sciences',grade:8,title:'States of matter',content:'Matter commonly exists as solids, liquids and gases. Temperature can cause matter to change state.'},
  {name:'Mathematics',grade:9,title:'Linear equations',content:'To solve 2x + 3 = 11, subtract 3 and divide by 2. Therefore x = 4.'}
]){
 const subject=await db.subject.upsert({where:{name_grade:{name:item.name,grade:item.grade}},update:{},create:{name:item.name,grade:item.grade}});
 const exists=await db.lesson.findFirst({where:{subjectId:subject.id,title:item.title}});
 if(!exists)await db.lesson.create({data:{subjectId:subject.id,title:item.title,content:item.content}});
}
await db.$disconnect();
console.log('Demo lessons created');
