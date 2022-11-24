const express = require('express');
const cors = require('cors');
const app = express();
const port = process.env.PORT || 5000;

require('dotenv').config();

//middleware
app.use(cors());
app.use(express.json());



const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@bristy.ogzpuzu.mongodb.net/?retryWrites=true&w=majority`;

const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });

async function run() {
    try {
           const categorysCollection = client.db('products').collection('categorys');
           const allcategoryCollection = client.db('products').collection('allcategory');
      
        //for categorys

         app.get('/categorys', async(req, res) => {
            const query = {};
            const options = await categorysCollection.find(query).toArray();
             res.send(options);
            })
         app.get('/allcategory', async(req, res) => {
            const query = {};
            const options = await allcategoryCollection.find(query).toArray();
             res.send(options);
         })
      app.get('/categorys/:id', async (req, res) => {
        const id = req.params.id;
        const filter = { category_id: ObjectId(id) }           
        const options = await allcategoryCollection.find(filter).toArray();
        res.send(options);
       })

      
 
        
    } finally {
        
  }
}
run().catch(console.log)


app.get('/', async (req, res) => {
    res.send('server is runninig yea')
})

app.listen(port,()=>console.log(`server is runing ${port}`))