const express=require('express');
const app=express();
const cors=require('cors');
const jwt = require('jsonwebtoken');
require('dotenv').config() 
const { MongoClient, ServerApiVersion } = require('mongodb');
const port=process.env.PORT || 5000;
//middleware
app.use(cors());
app.use(express.json());

//verifyJWT
const verifyJWT=(req, res, next)=>{
    const authorization=req.headers.authorization;
    if(!authorization){
      return res.status(401).send({error:true, message:'unauthorized access'});
    }
    // bearer token
    const token=authorization.split(' ')[1];
      jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, decoded) => {
        if(err){
          return res.status(401).send({error:true, message:'unauthorized access'});
        }
        req.decoded=decoded;
        next();
      });
  }
  


  const uri = `mongodb+srv://${process.env.DB_user}:${process.env.DB_pass}@cluster0.wu2rnap.mongodb.net/?retryWrites=true&w=majority`;
  // Create a MongoClient with a MongoClientOptions object to set the Stable API version
  const client = new MongoClient(uri, {
    serverApi: {
      version: ServerApiVersion.v1,
      strict: true,
      deprecationErrors: true,
    }
  });
  
  async function run() {
    try {
      // Connect the client to the server	(optional starting in v4.7)
      await client.connect();
      //database collection
      const userCollection = client.db("HouseHunterDb").collection("users");

      //jwt
      app.post('/jwt', (req, res) => {
        const user=req.body;
        const token=jwt.sign(user, process.env.ACCESS_TOKEN_SECRET, {expiresIn:'1h'});
        res.send({token});
      })

      const verifyAdmin=async (req, res, next) => {
        const email=req.decoded.email;
        const query={email:email};
        const user=await userCollection.findOne(query);
        if(user?.role!=='admin'){
          return res.status(403).send({error:true, message:'forbidden message'}); 
        }
        next();
      }

      app.get("/users",async (req, res) => {
        const result=await userCollection.find().toArray();
        res.send(result); 
      })
      app.post("/users", async (req, res) => {
        const user=req.body;
        console.log(user);
        const query={email:user.email};
        const existingUser=await userCollection.findOne(query);
        console.log("Existing user", existingUser);
        if(existingUser){
          return res.send({message:'user already exists'});
        }
        const result=await userCollection.insertOne(user);
        res.send(result);
      })

      // Send a ping to confirm a successful connection
      await client.db("admin").command({ ping: 1 });
      console.log("Pinged your deployment. You successfully connected to MongoDB!");
    } finally {
      // Ensures that the client will close when you finish/error
    //   await client.close();
    }
  }
  run().catch(console.dir);
  
  app.get('/', (req, res) => {
    res.send('HouseHunter server running...!')
  })
  
  app.listen(port, () => {
    console.log(`Example app listening on port ${port}`)
  })