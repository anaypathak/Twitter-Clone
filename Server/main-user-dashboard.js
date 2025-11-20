const express = require('express')
    const router = express.Router()
    const bodyParser=require('body-parser')
    const {v4}= require("uuid")
    const {datatweet} = require ('./db')
    const {database} = require ('./db')
    const {finddb}=require('./users.finddb')
    router.use(bodyParser.urlencoded({ extended: false }))
    router.use(bodyParser.json())

    

    router.get("/tweets",(req,res)=>{
        const tweetobj = {
            "tweet_id": v4(),
            "user_name":req.session.name,
            "user_id": req.session.uuid,
            "content": req.query.tweets_content,
            "created_at": new Date().getTime(),
            "views":0,
            "likes_count": 0,
            "Likesinfo": [],
            "retweets_count": 0,
            "replies_count": 0,
            "replies": [
              {
                "reply_id": v4(),
                "user_id": req.session.uuid,
                "content": "string",
                "created_at": "datetime",
                "updated_at": "datetime",
                "likes_count": "integer"
              }
            ]
        }
   
     

 
       try {
         datatweet().insertOne(tweetobj).then((result)=>{
        (result.acknowledged == true)? res.json({success:true}):res.json({success:false});
         })
       } catch (error) {
        throw new Error(error.message)
        
       }
    })

    router.get('/get-tweets',(req,res)=>{
   
   datatweet().find({}).toArray().then((response)=>{
        res.json(response)
   }) 
    })

    router.get('/update_data',(req,res)=>{

        try {
            const tid = req.query.t_id;
            const uid = req.session && req.session.uuid;

            if (!uid) {
                return res.status(401).json({ success: false, message: 'Not authenticated' });
            }
            if (!tid) {
                return res.status(400).json({ success: false, message: 'Missing t_id' });
            }

            datatweet().updateOne(
                { tweet_id: tid, "Likesinfo.user_id": { $ne: uid } }, // match tweet and ensure user not already in Likesinfo
                { 
                    $inc: { likes_count: 1 },
                    $push: { Likesinfo: { user_id: uid, liked_at: new Date().getTime() } }
                }
            ).then(result => {
                // If modifiedCount === 1 then the like was applied; otherwise user had already liked (or tweet not found)
                if (result.modifiedCount && result.modifiedCount > 0) {
                    return res.json({ success: true, message: 'Liked' });
                } else {
                    // Check if tweet exists to differentiate cases
                    datatweet().findOne({ tweet_id: tid }).then(tweet => {
                        if (!tweet) {
                            return res.status(404).json({ success: false, message: 'Tweet not found' });
                        }
                        // user already liked
                        return res.json({ success: false, message: 'Already liked' });
                    }).catch(err => {
                        return res.status(500).json({ success: false, message: err.message });
                    });
                }
            }).catch(err => {
                return res.status(500).json({ success: false, message: err.message });
            });

        } catch (error) {
            return res.status(500).json({ success: false, message: error.message });
        }
    })
    
    module.exports = router