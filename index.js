const express = require('express');
const app = express();
const cors = require('cors');
require('dotenv').config();
const { MongoClient } = require('mongodb');
const port = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.kxy80.mongodb.net/myFirstDatabase?retryWrites=true&w=majority`;
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true });

async function run(){
    try{
        await client.connect();
        const database = client.db('campus_event');
        const appointmentsCollection = database.collection('appointments');
        const userCollection = database.collection('users');

        app.get('/appointments', async (req, res) =>{
          const email = req.query.email;
          console.log(req.query.date);
          const date = new Date(req.query.date).toLocaleDateString('en-US', { timeZone: 'UTC' });
          console.log(date);
          const query = {email: email, date: date};
          console.log(query);
          const cursor = appointmentsCollection.find(query);
          const appointments = await cursor.toArray();
          console.log(appointments)
          res.json(appointments);
        })

        app.post('/appointments', async(req, res) =>{
          const appointment = req.body;
          const result = await appointmentsCollection.insertOne(appointment);
          console.log(appointment);
          res.json(result);
        });

        app.post('/users', async(req, res) =>{
          const user = req.body;
          const result = await userCollection.insertOne(user);
          console.log(result);
          res.json(result);
        });
        app.put('/users', async(req, res) =>{
          
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