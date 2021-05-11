const http = require('http')
const path = require('path')
const express = require('express');
const socketIo = require('socket.io');
const needle = require('needle');
const config = require('dotenv').config();
const TOKEN = process.env.TWITTER_BEARER_TOKEN;
const PORT = process.env.PORT || 3000

 const app = express()
 const server = http.createServer(app)
 const io = socketIo(server)

 app.get('/',(req,res)=>{
     res.sendFile(path.resolve(__dirname,'../','client','index.html'));
 })


const rulesURL = 'https://api.twitter.com/2/tweets/search/stream/rules'
const streamURL = 'https://api.twitter.com/2/tweets/search/stream?tweet.fields=public_metrics&expansions=author_id'

const rules = [{value:'oxygen cylinders india'}, {value:'corona vaccine india'},
{value:'remdesivir india'},{value:'corona relief india'},{value:'plasma india'},{value:'COVID-19 India'},{value:'corona india'},{value:'#COVID19Vaccination'}]

//get rules
async function getRules(){
    const response = await needle('get',rulesURL,{
        headers:{
            Authorization:`Bearer ${TOKEN}`
        }
    })
    //console.log(response.body);
    return response.body
}


//set rules
async function setRules(){
    const data={
        add:rules
    }
    const response = await needle('post',rulesURL,data,{

        headers:{
            'content-type':'application/json',
            Authorization:`Bearer ${TOKEN}`
        }
    })
    
    return response.body
}

//delete rules
async function deleteRules(rules){
    if(!Array.isArray(rules.data)){
        return null;
    }
    const ids = rules.data.map((rule)=>rule.id);
    const data={
        delete:{
            ids:ids
        }
    }
    const response = await needle('post',rulesURL,data,{

        headers:{
            'content-type':'application/json',
            Authorization:`Bearer ${TOKEN}`
        }
    })
    
    return response.body
}

function streamTweets(socket){
    const stream = needle.get(streamURL,{
        headers:{
            Authorization:`Bearer ${TOKEN}`
        }
    })
    stream.on('data',(data)=>{
        try{
            const json = JSON.parse(data);
            socket.emit('tweet',json);
        }catch(err){
            
        }
    })
}
io.on('connection',async ()=>{
    console.log('Clinet Connected...');
    let currentRules;
    try{
        
        currentRules = await getRules();       
        
        await deleteRules(currentRules);

        await setRules();
    }
    catch(err){
        console.log(err)
        process.exit(1);
    }
    streamTweets(io);
})
/*
(async ()=>{
    let currentRules;
    try{
        
        currentRules = await getRules();       
        
        await deleteRules(currentRules);

        await setRules();
    }
    catch(err){
        console.log(err)
        process.exit(1);
    }
    streamTweets();
})()
*/
server.listen(PORT,()=>console.log(`Listening on Port ${PORT}`))