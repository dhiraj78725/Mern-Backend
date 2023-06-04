const express = require("express");
const cors = require("cors");
require("./db/config");
const User = require("./db/User");
const Product = require("./db/Product");
const Jwt = require("jsonwebtoken")
const jwtkey = "e-comm"
const app = express();

app.use(express.json());
app.use(cors());

app.post("/register", async (req, resp) => {
  const user = new User(req.body);
  let result = await user.save();
  result = result.toObject();
  delete result.password;
  Jwt.sign({result},jwtkey,{expiresIn:"2h"},(error,token)=>{
    if(error){
      resp.send("Try again")
    }else{
      resp.send({result,auth:token});
    }
  })
});

app.post("/login", async (req, resp) => {
  if (req.body.password && req.body.email) {
    const user = await User.findOne(req.body).select("-password");
    if (user) {
      Jwt.sign({user},jwtkey,{expiresIn:"2h"},(error,token)=>{
        if(error){
          resp.send("Try again")
        }else{
          resp.send({user,auth:token});
        }
      })
      
    } else {
      resp.send("No User Found");
    }
  } else {
    resp.send("No User Found");
  }
});

app.post("/add-product",verifyToken, async (req, resp) => {
  const product = new Product(req.body);
  let result = await product.save();
  resp.send(result);
});

app.get("/products",verifyToken, async (req, resp) => {
  const products = await Product.find();
  if (products.length > 0) {
    resp.send(products);
  } else {
    resp.send({ result: "No products found" });
  }
});

app.delete("/product/:id",verifyToken, async (req, resp) => {
  const result = await Product.deleteOne({ _id: req.params.id });
  resp.send(result);
});

app.get("/product/:id",verifyToken, async (req, resp) => {
  const result = await Product.findOne({ _id: req.params.id });
  if (result) {
    resp.send(result);
  } else {
    resp.send({ result: "No record found" });
  }
});

app.put("/product/:id",verifyToken, async (req, resp) => {
  const result = await Product.updateOne(
    { _id: req.params.id },
    {
      $set: req.body,
    }
  );
  resp.send(result);
});

app.get("/search/:key",verifyToken, async (req, resp) => {
  const result = await Product.find({
    $or: [
      { name: { $regex: req.params.key } },
      { company: { $regex: req.params.key } },
      { category: { $regex: req.params.key } },
    ],
  });
  resp.send(result)
});



function verifyToken(req,resp,next) {
  let token =req.headers['authorization']
  if (token){
    token= token.split(" ")[1]
    Jwt.verify(token,jwtkey,(error,valid)=>{
      if(error){
        resp.status(403).send({result:"Please provide valid Token"})
      }else{
        next()
      }
    })
  }else{
    resp.status(401).send({result:"Please provide Token"})
  }
}

// const connectDB = async () => {
//   mongoose.connect("mongodb://localhost:27017/e-comm");
//   const productSchema = new mongoose.Schema({});
//   const product = mongoose.model("product", productSchema);
//   const data = await product.find()
//   console.log("",data)
// };

// connectDB()
// app.get("/", (req, res) => {
//   res.send("app is working");
// });
app.listen(5000);
