const express = require('express');
const cors = require('cors');
const jwt =require('jsonwebtoken')
const app = express();
const port = process.env.PORT || 5000;
require('dotenv').config();

const stripe=require("stripe")(process.env.STRIPE_SECRET)
//middleware
app.use(cors());
app.use(express.json());



const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@bristy.ogzpuzu.mongodb.net/?retryWrites=true&w=majority`;

const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });


//for jwt function
function verifyJWT(req, res, next) {

    const authHeader = req.headers.authorization;
    if (!authHeader) {
        return res.status(401).send('unauthorized access');
    }

    const token = authHeader.split(' ')[1];

    jwt.verify(token, process.env.ACCESS_TOKEN, function (err, decoded) {
        if (err) {
            return res.status(403).send({ message: 'forbidden access' })
        }
        req.decoded = decoded;
        next();
    })

}


async function run() {
    try {
           const categorysCollection = client.db('products').collection('categorys');
           const allcategoryCollection = client.db('products').collection('allcategory');
           const bookingsCollection = client.db('products').collection('bookings');
           const usersCollection = client.db('products').collection('users');
           const productCollection = client.db('products').collection('product');
           const paymentsCollection = client.db('products').collection('payments');

       //another work make category2
         
           const allcategorytwoCollection = client.db('products').collection('allcategorytwo');
        app.get('/categorystwo', async(req, res) => {
            const query = {};
            const options = await categorysCollection.find(query).toArray();
             res.send(options);
            })

     app.get('/producttwo', async (req, res) => {
            const query = {};
            const product = await productCollection.find(query).toArray();
            res.send(product);
     })
        
           app.get('/categorystwo/:id', async (req, res) => {
        const id = req.params.id;
        // console.log(id);
         const filter = { category_id:(id) } 
       // console.log(filter)       
        const options = await productCollection.find(filter).toArray();
        res.send(options);
       })
       
        



        // another work
      
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


       //add get product one product
    app.get('/allcategoryproduct', async (req, res) => {
            const query = {}
            const result = await categorysCollection.find(query).project({ _id: 1, name: 1 }).toArray();
            res.send(result);
        })
       //make report like admin form all category
        
       app.put('/users/report/:id',verifyJWT, async (req, res) => {
    
            const id = req.params.id;
            const filter = { _id: ObjectId(id) }
            const options = { upsert: true };
            const updatedDoc = {
                $set: {
                    report: 'report'
                }
            }
            const result = await productCollection.updateOne(filter, updatedDoc, options);
            res.send(result);
          })



          //role deleting
        
        app.put('/users/notreport/:id',verifyJWT, async (req, res) => {
    
            const id = req.params.id;
            const filter = { _id: ObjectId(id) }
            const options = { upsert: true };
            const updatedDoc = {
                $set: {
                    report: 'notreport'
                }
            }
            const result = await productCollection.updateOne(filter, updatedDoc, options);
            res.send(result);
          })
        
        
        

       // for bookings 


            app.get('/bookings', verifyJWT, async (req, res) => {
            const email = req.query.email;
            const decodedEmail = req.decoded.email;

            if (email !== decodedEmail) {
                return res.status(403).send({ message: 'forbidden access' });
            }

            const query = { email: email };
            const bookings = await bookingsCollection.find(query).toArray();
            res.send(bookings);
        })

         app.get('/bookings/:id', async (req, res) => {
            const id = req.params.id;
            const query = { _id: ObjectId(id) };
            const booking = await bookingsCollection.findOne(query);
            res.send(booking);
        })


       app.post('/bookings', async (req, res) => {
          const booking = req.body;
          const result = await bookingsCollection.insertOne(booking)
          res.send(result)
       })

       //for payment

         app.post('/create-payment-intent', async (req, res) => {
            const booking = req.body;
            const price = booking.resaleprice;
           const amount = price * 100;

            const paymentIntent = await stripe.paymentIntents.create({
                currency: 'usd',
                amount: amount,
                "payment_method_types": [
                    "card"
                ]
            });
            res.send({
                clientSecret: paymentIntent.client_secret,
            });
        });

        app.post('/payments', async (req, res) =>{
            const payment = req.body;
            const result = await paymentsCollection.insertOne(payment);
            const id = payment.bookingId
            const filter = {_id: ObjectId(id)}
            const updatedDoc = {
                $set: {
                    paid: true, 
                    transactionId: payment.transactionId
                }
            }
            const updatedResult = await bookingsCollection.updateOne(filter, updatedDoc)
            res.send(result);
        })

       
       
    //token jwt
  


            app.get('/jwt', async (req, res) => {
            const email = req.query.email;
            const query = { email: email };
            const user = await usersCollection.findOne(query);
            //console.log(user);
            if (user) {
                const token = jwt.sign({ email }, process.env.ACCESS_TOKEN, { expiresIn: '1h' });
                return res.send({ accessToken: token });
            }
            res.status(403).send({ accessToken: '' })
        });
 
     

       //user
        
        app.get('/users', async (req, res) => {
            const query = {};
            const users = await usersCollection.find(query).toArray();
            res.send(users);
        });

            app.delete('/users/:id', async (req, res) => {
            const id = req.params.id;
            const filter = { _id: ObjectId(id) };
            const result = await usersCollection.deleteOne(filter);
            res.send(result);
        })

//seller
        app.get('/users/seller/:email', async (req, res) => {
            const email = req.params.email;
            const query = { email }
            const user = await usersCollection.findOne(query);
            res.send({ isSeller: user?.option === 'seller' });
        })

        //buyer

            app.get('/users/buyer/:email', async (req, res) => {
            const email = req.params.email;
            const query = { email }
            const user = await usersCollection.findOne(query);
            res.send({ isBuyer: user?.option === 'Buyer' });
        })

        //admincheck

        
        app.get('/users/admin/:email', async (req, res) => {
            const email = req.params.email;
            const query = { email }
            const user = await usersCollection.findOne(query);
            res.send({ isAdmin: user?.role === 'admin' });
        })

    app.post('/users', async (req, res) => {
            const user = req.body;
           
        const query = { email:user.email }
        const allreadySave = await usersCollection.find(query).toArray();
        if (allreadySave.length) {
            return res.send({message:"user already exist"})
        }
            const result = await usersCollection.insertOne(user);
            res.send(result);
    })
    
      //make admin
          app.put('/users/admin/:id',verifyJWT, async (req, res) => {
           const decodedEmail = req.decoded.email;
           const query = { email: decodedEmail };
           const user = await usersCollection.findOne(query);

            if (user?.role !== 'admin') {
                return res.status(403).send({ message: 'forbidden access' })
            }

            const id = req.params.id;
            const filter = { _id: ObjectId(id) }
            const options = { upsert: true };
            const updatedDoc = {
                $set: {
                    role: 'admin'
                }
            }
            const result = await usersCollection.updateOne(filter, updatedDoc, options);
            res.send(result);
          })
        
        //make seller verify rol

  app.put('/users/seller/:id',verifyJWT, async (req, res) => {
        //    const decodedEmail = req.decoded.email;
        //    const query = { email: decodedEmail };
        //    const user = await usersCollection.findOne(query);

        //     if (user?.role !== 'verify') {
        //         return res.status(403).send({ message: 'forbidden access' })
        //     }

            const id = req.params.id;
            const filter = { _id: ObjectId(id) }
            const options = { upsert: true };
            const updatedDoc = {
                $set: {
                    role: 'verify'
                }
            }
            const result = await usersCollection.updateOne(filter, updatedDoc, options);
            res.send(result);
  })
        
          app.get('/users/sellerverify/:email', async (req, res) => {
            const email = req.params.email;
            const query = { email }
            const user = await usersCollection.findOne(query);
            res.send({ isVerify: user?.role === 'verify' });
          })
        
        
       // make available product role

        
         app.put('/users/available/:id',verifyJWT, async (req, res) => {
        //    const decodedEmail = req.decoded.email;
        //    const query = { email: decodedEmail };
        //    const user = await usersCollection.findOne(query);

        //     if (user?.role !== 'admin') {
        //         return res.status(403).send({ message: 'forbidden access' })
        //     }

            const id = req.params.id;
            const filter = { _id: ObjectId(id) }
            const options = { upsert: true };
            const updatedDoc = {
                $set: {
                    role: 'available'
                }
            }
            const result = await productCollection.updateOne(filter, updatedDoc, options);
            res.send(result);
         })
        
        
        //get available product role for useavailable

            app.get('/users/available/:email', async (req, res) => {
            const email = req.params.email;
            const query = { email }
            const user = await productCollection.findOne(query);
            res.send({ isAvailable: user?.role === 'available' });
          })

 
            app.get('/product', async (req, res) => {
            const query = {};
            const product = await productCollection.find(query).toArray();
            res.send(product);
        })
        
           app.post('/product',async (req, res) => {
            const product = req.body;
            const result = await productCollection.insertOne(product);
            res.send(result);
           });
        
           app.delete('/product/:id', async (req, res) => {
            const id = req.params.id;
            const filter = { _id: ObjectId(id) };
            const result = await productCollection.deleteOne(filter);
            res.send(result);
        })
        
        
    } finally {
        
  }
}
run().catch(console.log)


app.get('/', async (req, res) => {
    res.send('server is runninig yea')
})

app.listen(port,()=>console.log(`server is runing ${port}`))