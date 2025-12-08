require('dotenv').config();
console.log('LANGGRAPH_API_KEY =', process.env.LANGGRAPH_API_KEY);
console.log('OPENAI_API_KEY =', process.env.OPENAI_API_KEY);
console.log('DATABASE_URL =', process.env.DATABASE_URL);
console.log('Loaded keys:', Object.keys(process.env).filter(k => k.includes('KEY')));