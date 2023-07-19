const express=require('express');
const app=express();
const cors=require('cors');
const bcrypt=require('bcrypt');
const jwt = require('jsonwebtoken');
require('dotenv').config() 
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const port=process.env.PORT || 5000;
//middleware
app.use(cors());
app.use(express.json());

//verifyJWT
const jwtSecret=process.env.ACCESS_TOKEN_SECRET;


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
      const userHouses = client.db("HouseHunterDb").collection("Houses");


      app.get("/users",async (req, res) => {
        const result=await userCollection.find().toArray();
        res.send(result); 
      })
      app.post("/users", async (req, res) => {
        const{fullName, role, phoneNumber, email, password}=req.body;
        const query={email:email};
        const existingUser=await userCollection.findOne(query);
        if(existingUser){
         throw new Error("User Already Exist");
        }
        const hashedPassword=await bcrypt.hash(password, 10);
        const result=await userCollection.insertOne({fullName, role, phoneNumber, email, password:hashedPassword});
        res.send(result);
      })

    //   Authenticate and login a user
    app.post('/login', async(req, res)=>{
        const {email, password}=req.body;
      
        //Find the user by Email in the database
        const user=await userCollection.findOne({email});
      
        if(!user){
            return res.status(401).json({message:'Authentication failed'});
        }
        //campare the provided password and store password
        const passwordMatch=await bcrypt.compare(password, user.password);
    
        if(!passwordMatch){
            return res.status(401).json({message:'Authentication failed'});
        }
        const token=jwt.sign({userId:user._id.toString()}, process.env.ACCESS_TOKEN_SECRET, {expiresIn:'1h'});
        res.send({token, user});
        // const token=jwt.sign({userId:user._id.toString()}, jwtSecret,{expiresIn:'1h'});
        // res.status(500).json({message:'Authentication successful', token});
    })

    //get house
    app.get('/getHouse/:email', async(req, res)=>{
       const userEmail=req.params.email;
       const userAllHouses= await userHouses.find({email:userEmail}).toArray();
       if (!userAllHouses) {
        return res.status(404).json({ message: 'User all houses Not found found' });
      }
      res.send(userAllHouses);

    })
    // add house 
    app.post('/addHouse', async(req, res)=>{
        const houseData=req.body;
        const result=await userHouses.insertOne(houseData);
        res.send(result);
      
    })
    //update house
    app.patch('/update/:id', async(req, res)=>{
        const userId=req.params.id;
        const updateData=req.body;
        const query={_id:new ObjectId(userId)};
        const result=await userHouses.updateOne(query, { $set: updateData });
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