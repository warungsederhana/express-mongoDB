const express = require("express");
const mongoose = require("mongoose");
const methodOverride = require("method-override");
const ErrorHander = require("./ErrorHandler");
const path = require("path");
const app = express();
const port = 3000;

// Models
const Product = require("./models/product");
const Garment = require("./models/garment");

app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));
app.use(express.urlencoded({ extended: true }));
app.use(methodOverride("_method"));

function wrapAsync(fn) {
    return function (req, res, next) {
        fn(req, res, next).catch((err) => next(err));
    };
}

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

app.get(
    "/garments",
    wrapAsync(async (req, res) => {
        const garments = await Garment.find({});
        res.render("garments/index", { garments });
    })
);

app.get("/garments/create", (req, res) => {
    res.render("garments/create");
});

app.post(
    "/garments",
    wrapAsync(async (req, res) => {
        const garment = new Garment(req.body);
        await garment.save();
        res.redirect(`/garments`);
    })
);

app.get(
    "/garments/:id",
    wrapAsync(async (req, res) => {
        const { id } = req.params;
        const garment = await Garment.findById(id).populate("products");
        res.render("garments/show", { garment });
    })
);

app.get("/garments/:garment_id/products/create", (req, res) => {
    const { garment_id } = req.params;
    res.render("products/create", { garment_id });
});

app.post(
    "/garments/:garment_id/products",
    wrapAsync(async (req, res) => {
        const { garment_id } = req.params;
        const garment = await Garment.findById(garment_id);
        const product = new Product(req.body);

        garment.products.push(product);
        product.garment = garment;

        await garment.save();
        await product.save();

        res.redirect(`/garments/${garment._id}`);
    })
);

app.delete(
    "/garments/:garment_id",
    wrapAsync(async (req, res) => {
        const { garment_id } = req.params;
        await Garment.findOneAndDelete({ _id: garment_id });
        res.redirect(`/garments`);
    })
);

app.get("/products", async (req, res) => {
    const { category } = req.query;

    if (category) {
        const products = await Product.find({ category });
        return res.render("products/index", { products, category });
    }
    const products = await Product.find({});
    res.render("products/index", { products, category: "All" });
});

app.get("/products/create", (req, res) => {
    res.render("products/create");
});

app.post("/products", async (req, res) => {
    const product = new Product(req.body);
    await product.save();
    res.redirect(`/products/${product._id}`);
});

app.get("/products/:id", async (req, res, next) => {
    try {
        const { id } = req.params;
        const product = await Product.findById(id).populate("garment");
        res.render("products/show", { product });
    } catch (err) {
        next(new ErrorHander("Product Not Found", 404));
    }
});

app.get("/products/:id/edit", async (req, res, next) => {
    try {
        const { id } = req.params;
        const product = await Product.findById(id);
        res.render("products/edit", { product });
    } catch (err) {
        next(new ErrorHander("Product Not Found", 404));
    }
});

app.put(
    "/products/:id",
    wrapAsync(async (req, res) => {
        const { id } = req.params;
        const product = await Product.findByIdAndUpdate(id, req.body, {
            runValidators: true,
        });
        res.redirect(`/products/${product._id}`);
    })
);

app.delete("/products/:id", async (req, res, next) => {
    try {
        const { id } = req.params;
        await Product.findByIdAndDelete(id);
        res.redirect("/products");
    } catch (err) {
        next(new ErrorHander("Failed to delete the data", 412));
    }
});

app.use((err, req, res, next) => {
    const { status = 500, message = "Something went wrong" } = err;
    res.status(status).send(message);
});

app.listen(port, () => {
    console.log(`Shop App listening at http://localhost:${port}`);
});
