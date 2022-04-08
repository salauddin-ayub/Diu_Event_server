const express = require('express');
const app = express();
const cors = require('cors');
const admin = require("firebase-admin");
require('dotenv').config();
const { MongoClient } = require('mongodb');
const port = process.env.PORT || 5000;
const ObjectId = require("mongodb").ObjectId;

//campus-event-firebase-adminsdk.json


const serviceAccount = require('./campus-event-firebase-adminsdk.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

app.use(cors());
app.use(express.json());

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.kxy80.mongodb.net/myFirstDatabase?retryWrites=true&w=majority`;
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true });

async function verifyToken(req, res, next){
  if(req.headers?.authorization?.startsWith('Bearer ')){
    const token = req.headers.authorization.split(' ')[1];

    try{
      const decodedUser = await admin.auth().verifyIdToken(token);
      req.decodedEmail = decodedUser.email;
    }
    catch{

    }
  }
    next();
}

async function run(){
    try{
        await client.connect();
        const database = client.db('campus_event');
        const appointmentsCollection = database.collection('appointments');
        const userCollection = database.collection('users');

        app.get('/appointments', async (req, res) =>{
        /*   const email = req.query.email;
          console.log(req.query.date); */
          const date = new Date(req.query.date).toLocaleDateString('en-US', { timeZone: 'UTC' });
          console.log(date);
          const query = { date: date};
          console.log(query);
          const cursor = appointmentsCollection.find(query);
          const appointments = await cursor.toArray();
          
          res.json(appointments);
        })

        app.post('/appointments', async(req, res) =>{
          const appointment = req.body;
          const result = await appointmentsCollection.insertOne(appointment);
          
          res.json(result);
        });

        app.get("/appointment/:id", async (req, res) => {
          const id = req.params.id;
          const query = { _id: ObjectId(id) };
          const appointment = await appointmentsCollection.findOne(query);
          res.json(appointment);
        });

        app.put("/appointment/:id", async (req, res) => {
          const id = req.params.id;
          const updateAppointment = req.body;
          const filter = { _id: ObjectId(id) };
          const options = { upsert: true };
          const updateDoc = {
            $set: {
              status: updateAppointment.status,
            },
          };
          const result = await appointmentsCollection.updateOne(
            filter,
            updateDoc,
            options
          );
          res.json(result);
        });
    

        app.get('/users/:email', async (req, res) =>{
          const email = req.params.email;
          const query = { email: email };
          const user = await userCollection.findOne(query);
          let isAdmin = false;
          if(user?.role === 'admin'){
            isAdmin = true;
          }
          res.json({admin: isAdmin});
        })

        app.post('/users', async(req, res) =>{
          const user = req.body;
          const result = await userCollection.insertOne(user);
          // console.log(result);
          res.json(result);
        });
        app.put('/users', async(req, res) =>{
          const user = req.body;
          const filter= { email: user.email};
          const options = { upsert: true };
          const updateDoc ={$set:user};
          const result = await userCollection.updateOne(filter, updateDoc, options);
          res.json(result);
          
        });

        app.put('/users/admin', verifyToken, async(req, res) =>{
          const user = req.body;
          const requester = req.decodedEmail;
          if(requester){
            const requesterAccount = await userCollection.findOne({email: requester});
          
          if(requesterAccount.role === 'admin'){
            const filter = {email: user.email};
            const updateDoc = {$set: {role: 'admin'}};
            const result = await userCollection.updateOne(filter, updateDoc)
            res.json(result);
          }
        }
        else{
          res.status(403).json({message:'you do not have access to make admin'})
        }
        })
    }
    finally{


    }

}

run().catch(console.dir);

app.get('/', (req, res) => {
  res.send('Hello User')
})

app.listen(port, () => {
  console.log(`listening at ${port}`)
})