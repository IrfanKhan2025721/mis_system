const http = require("http");
const fs = require("fs");
const { MongoClient, ObjectId } = require("mongodb");
const querystring = require("querystring");

// MongoDB
const uri =
  "mongodb+srv://irfankhanahmadzai044_db_user:atlasuse3489@cluster0.nduiq7f.mongodb.net/?appName=Cluster0";
const client = new MongoClient(uri);

// Dashboard layout
function dashboardLayout(title, content) {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>${title}</title>
  <script src="https://cdn.tailwindcss.com"></script>
  <script src="https://unpkg.com/feather-icons"></script>
</head>
<body class="bg-gray-100 font-sans">
<div class="flex min-h-screen">

  <!-- Sidebar -->
  <aside class="w-64 bg-gray-900 text-white p-6 flex flex-col shadow-lg">
    <h1 class="text-2xl font-bold mb-6 text-indigo-400 flex items-center space-x-2">
      <i data-feather="bar-chart-2"></i>
      <span>MIS Dashboard</span>
    </h1>
    <nav class="space-y-3 flex-1">
      <a href="/dashboard" class="block px-3 py-2 rounded hover:bg-gray-800 hover:text-indigo-400 transition flex items-center space-x-2">
        <i data-feather="home"></i>
        <span>Dashboard</span>
      </a>
      <a href="/products" class="block px-3 py-2 rounded hover:bg-gray-800 hover:text-indigo-400 transition flex items-center space-x-2">
        <i data-feather="box"></i>
        <span>Products</span>
      </a>
      <a href="/categories" class="block px-3 py-2 rounded hover:bg-gray-800 hover:text-indigo-400 transition flex items-center space-x-2">
        <i data-feather="tag"></i>
        <span>Categories</span>
      </a>
    </nav>
  </aside>

  <!-- Content -->
  <main class="flex-1 p-8">
    ${content}
  </main>

</div>

<script>
  feather.replace()
</script>
</body>
</html>
`;
}

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, `http://${req.headers.host}`);

  // DASHBOARD
  if (req.method === "GET" && url.pathname === "/dashboard") {
    await client.connect();
    const productsCount = await client
      .db("nodedb")
      .collection("products")
      .countDocuments();
    const categoriesCount = await client
      .db("nodedb")
      .collection("categories")
      .countDocuments();
    await client.close();

    const content = `
    <h1 class="text-3xl font-bold mb-6 text-gray-800">Dashboard</h1>
    <div class="grid grid-cols-3 gap-6">

      <div class="bg-white p-6 rounded shadow hover:shadow-lg transition flex items-center space-x-4">
        <i data-feather="box" class="text-indigo-500"></i>
        <div>
          <p class="text-gray-500">Products</p>
          <p class="text-2xl font-bold">${productsCount}</p>
        </div>
      </div>

      <div class="bg-white p-6 rounded shadow hover:shadow-lg transition flex items-center space-x-4">
        <i data-feather="tag" class="text-indigo-500"></i>
        <div>
          <p class="text-gray-500">Categories</p>
          <p class="text-2xl font-bold">${categoriesCount}</p>
        </div>
      </div>

    </div>
  `;
    res.end(dashboardLayout("Dashboard", content));
  }

  // PRODUCTS
  else if (req.method === "GET" && url.pathname === "/products") {
    await client.connect();
    const products = await client
      .db("nodedb")
      .collection("products")
      .find()
      .toArray();
    await client.close();

    const rows = products
      .map(
        (p) => `
      <tr class="border-b hover:bg-gray-50  ">
        <td class="px-4 py-2">${p.name}</td>
        <td class="px-4 py-2">${p.code}</td>
        <td class="px-4 py-2">${p.brand}</td>
        <td class="px-4 py-2">${p.price}</td>
        <td class="px-4 py-2">${p.productUnit || ""}</td>
        <td class="px-4 py-2">${p.inStock || ""}</td>
        <td class="px-4 py-2">${
          p.createdAt ? new Date(p.createdAt).toLocaleDateString() : ""
        }</td>
        <td class="px-4 py-2">
          <a href="/edit-product?id=${
            p._id
          }" class="text-blue-600 mr-2">Edit</a>
          <a href="/delete-product?id=${p._id}" class="text-red-600">Delete</a>
        </td>
      </tr>
    `
      )
      .join("");

    const content = `
      <div class="flex justify-between items-center mb-6">
        <h1 class="text-2xl font-bold">Products</h1>
        <a href="/add-product" class="bg-indigo-600 text-white px-4 py-2 rounded">+ Add Product</a>
      </div>
      <table class="w-full bg-white rounded shadow">
        <thead class="bg-gray-800 text-white">
          <tr>
            <th class="px-4 py-2 text-left">Name</th>
            <th class="px-4 py-2 text-left">Code</th>
            <th class="px-4 py-2 text-left">Brand</th>
            <th class="px-4 py-2 text-left">Price</th>
            <th class="px-4 py-2 text-left">Unit</th>
            <th class="px-4 py-2 text-left">In Stock</th>
            <th class="px-4 py-2 text-left">Created At</th>
            <th class="px-4 py-2 text-left">Actions</th>
          </tr>
        </thead>
        <tbody>${rows}</tbody>
      </table>
    `;
    res.end(dashboardLayout("Products", content));
  }

  // ADD PRODUCT
  else if (req.method === "GET" && url.pathname === "/add-product") {
    fs.readFile("product-form.html", (err, data) => {
      if (err) res.end("Error loading form");
      else res.end(data);
    });
  } else if (req.method === "POST" && url.pathname === "/save-product") {
    let body = "";
    req.on("data", (chunk) => (body += chunk));
    req.on("end", async () => {
      const d = querystring.parse(body);
      await client.connect();
      await client
        .db("nodedb")
        .collection("products")
        .insertOne({
          name: d.name,
          code: d.code,
          brand: d.brand,
          price: Number(d.price),
          productUnit: Number(d.productUnit),
          inStock: Number(d.inStock),
          createdAt: d.createdAt ? new Date(d.createdAt) : new Date(),
        });
      await client.close();
      res.writeHead(302, { Location: "/products" });
      res.end();
    });
  }

  // EDIT PRODUCT
  else if (req.method === "GET" && url.pathname === "/edit-product") {
    const id = url.searchParams.get("id");
    await client.connect();
    const p = await client
      .db("nodedb")
      .collection("products")
      .findOne({ _id: new ObjectId(id) });
    await client.close();
    if (!p) return res.end("Product not found");

    const content = `
      <form action="/update-product" method="POST" class="bg-white p-6 rounded shadow w-96 mx-auto">
        <h1 class="text-2xl font-bold mb-6">Edit Product</h1>
        <input type="hidden" name="id" value="${p._id}" />
        <input name="name" value="${
          p.name
        }" placeholder="Name" class="border p-2 w-full mb-3" required />
        <input name="code" value="${
          p.code
        }" placeholder="Code" class="border p-2 w-full mb-3" required />
        <input name="brand" value="${
          p.brand
        }" placeholder="Brand" class="border p-2 w-full mb-3" />
        <input name="price" type="number" value="${
          p.price
        }" placeholder="Price" class="border p-2 w-full mb-3" required />
        <input name="productUnit" type="number" value="${
          p.productUnit || ""
        }" placeholder="Unit" class="border p-2 w-full mb-3" />
        <input name="inStock" type="number" value="${
          p.inStock || ""
        }" placeholder="In Stock" class="border p-2 w-full mb-3" />
        <input name="createdAt" type="date" value="${
          p.createdAt ? new Date(p.createdAt).toISOString().split("T")[0] : ""
        }" placeholder="Created At" class="border p-2 w-full mb-3" />
        <button class="bg-indigo-600 text-white px-4 py-2 rounded w-full">Update Product</button>
      </form>
    `;
    res.end(dashboardLayout("Edit Product", content));
  } else if (req.method === "POST" && url.pathname === "/update-product") {
    let body = "";
    req.on("data", (chunk) => (body += chunk));
    req.on("end", async () => {
      const d = querystring.parse(body);
      await client.connect();
      await client
        .db("nodedb")
        .collection("products")
        .updateOne(
          { _id: new ObjectId(d.id) },
          {
            $set: {
              name: d.name,
              code: d.code,
              brand: d.brand,
              price: Number(d.price),
              productUnit: Number(d.productUnit),
              inStock: Number(d.inStock),
              createdAt: d.createdAt ? new Date(d.createdAt) : new Date(),
            },
          }
        );
      await client.close();
      res.writeHead(302, { Location: "/products" });
      res.end();
    });
  } else if (req.method === "GET" && url.pathname === "/delete-product") {
    const id = url.searchParams.get("id");
    await client.connect();
    await client
      .db("nodedb")
      .collection("products")
      .deleteOne({ _id: new ObjectId(id) });
    await client.close();
    res.writeHead(302, { Location: "/products" });
    res.end();
  }

  // CATEGORIES
  else if (req.method === "GET" && url.pathname === "/categories") {
    await client.connect();
    const cats = await client
      .db("nodedb")
      .collection("categories")
      .find()
      .toArray();
    await client.close();

    const rows = cats
      .map(
        (c) => `
      <tr class="border-b">
        <td class="px-4 py-2">${c.name}</td>
        <td class="px-4 py-2">
          <a href="/edit-category?id=${c._id}" class="text-blue-600 mr-2">Edit</a>
          <a href="/delete-category?id=${c._id}" class="text-red-600">Delete</a>
        </td>
      </tr>
    `
      )
      .join("");

    const content = `
      <div class="flex justify-between mb-4">
        <h1 class="text-2xl font-bold">Categories</h1>
        <a href="/add-category" class="bg-indigo-600 text-white px-4 py-2 rounded">Add Category</a>
      </div>
      <table class="w-full bg-white rounded shadow">
        <tbody>${rows}</tbody>
      </table>
    `;
    res.end(dashboardLayout("Categories", content));
  } else {
    res.writeHead(404);
    res.end("Not Found");
  }
});

server.listen(8080, () => {
  console.log("✅ Server running at http://localhost:8080/dashboard");
});


