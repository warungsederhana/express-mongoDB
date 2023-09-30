const express = require("express");
const mongoose = require("mongoose");
const path = require("path");
const app = express();
const port = 3000;

// Models
const Product = require("./models/product");

app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));
app.use(express.urlencoded({ extended: true }));

// Connect to MongoDB
mongoose
    .connect("mongodb://localhost:27017/shop_db")
    .then((result) => {
        console.log("Connected to MongoDB");
    })
    .catch((err) => {
        console.log(err);
    });

app.get("/", (req, res) => {
    res.send("Hello World!");
});

app.get("/products", async (req, res) => {
    const products = await Product.find({});
    res.render("products/index", { products });
});

app.get("/products/:id", async (req, res) => {
    const product = await Product.findById(req.params.id);
    res.render("products/show", { product });
});

app.listen(port, () => {
    console.log(`Shop App listening at http://localhost:${port}`);
});
