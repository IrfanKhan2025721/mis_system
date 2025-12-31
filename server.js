const http = require("http");
const { MongoClient, ObjectId } = require("mongodb");
const querystring = require("querystring");

// MongoDB
const uri =
  "mongodb+srv://irfankhanahmadzai044_db_user:atlasuse3489@cluster0.nduiq7f.mongodb.net/?appName=Cluster0";
const client = new MongoClient(uri);

// Dashboard Layout
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
<body class="bg-gray-100">
<div class="flex min-h-screen">

  <!-- Sidebar -->
  <aside class="w-64 bg-gray-900 text-white p-6">
    <h1 class="text-2xl font-bold text-indigo-400 mb-6 flex items-center gap-2">
      <i data-feather="bar-chart-2"></i> MIS Dashboard
    </h1>
    <nav class="space-y-3">
      <a href="/dashboard" class="block hover:text-indigo-400">Dashboard</a>
      <a href="/products" class="block hover:text-indigo-400">Products</a>
      <a href="/categories" class="block hover:text-indigo-400">Categories</a>
    </nav>
  </aside>

  <!-- Content -->
  <main class="flex-1 p-8">
    ${content}
  </main>

</div>

<script>feather.replace()</script>
</body>
</html>
`;
}

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, `http://${req.headers.host}`);

  /* DASHBOARD */
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
      <h1 class="text-3xl font-bold mb-6">Dashboard</h1>
      <div class="grid grid-cols-2 gap-6">
        <div class="bg-white p-6 rounded shadow">
          <p class="text-gray-500">Products</p>
          <p class="text-3xl font-bold">${productsCount}</p>
        </div>
        <div class="bg-white p-6 rounded shadow">
          <p class="text-gray-500">Categories</p>
          <p class="text-3xl font-bold">${categoriesCount}</p>
        </div>
      </div>
    `;
    res.end(dashboardLayout("Dashboard", content));
  } else if (req.method === "GET" && url.pathname === "/products") {

  /* PRODUCTS */
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
      <tr class="border-b">
        <td class="px-3 py-2">${p.name}</td>
        <td class="px-3 py-2">${p.code}</td>
        <td class="px-3 py-2">${p.brand}</td>
        <td class="px-3 py-2">${p.price}</td>
        <td class="px-3 py-2">
          <a href="/edit-product?id=${p._id}" class="text-blue-600">Edit</a> |
          <a href="/delete-product?id=${p._id}" class="text-red-600">Delete</a>
        </td>
      </tr>
    `
      )
      .join("");

    const content = `
      <div class="flex justify-between mb-4">
        <h1 class="text-2xl font-bold">Products</h1>
        <a href="/add-product" class="bg-indigo-600 text-white px-4 py-2 rounded">+ Add</a>
      </div>
      <table class="w-full bg-white rounded shadow">
        <thead class="bg-gray-800 text-white">
          <tr>
            <th class="px-3 py-2">Name</th>
            <th class="px-3 py-2">Code</th>
            <th class="px-3 py-2">Brand</th>
            <th class="px-3 py-2">Price</th>
            <th class="px-3 py-2">Actions</th>
          </tr>
        </thead>
        <tbody>${rows}</tbody>
      </table>
    `;
    res.end(dashboardLayout("Products", content));
  } else if (req.method === "GET" && url.pathname === "/add-product") {

  /* ADD PRODUCT */
    const content = `
      <form action="/save-product" method="POST" class="bg-white p-6 rounded shadow w-96 mx-auto">
        <h1 class="text-2xl font-bold mb-4">Add Product</h1>
        <input name="name" placeholder="Name" class="border p-2 w-full mb-3" required />
        <input name="code" placeholder="Code" class="border p-2 w-full mb-3" required />
        <input name="brand" placeholder="Brand" class="border p-2 w-full mb-3" />
        <input name="price" type="number" placeholder="Price" class="border p-2 w-full mb-3" required />
        <button class="bg-indigo-600 text-white px-4 py-2 rounded w-full">Save</button>
      </form>
    `;
    res.end(dashboardLayout("Add Product", content));
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
          createdAt: new Date(),
        });
      await client.close();
      res.writeHead(302, { Location: "/products" });
      res.end();
    });
  } else if (req.method === "GET" && url.pathname === "/edit-product") {

  /* EDIT PRODUCT */
    const id = url.searchParams.get("id");
    await client.connect();
    const p = await client
      .db("nodedb")
      .collection("products")
      .findOne({ _id: new ObjectId(id) });
    await client.close();

    const content = `
      <form action="/update-product" method="POST" class="bg-white p-6 rounded shadow w-96 mx-auto">
        <h1 class="text-2xl font-bold mb-4">Edit Product</h1>
        <input type="hidden" name="id" value="${p._id}">
        <input name="name" value="${p.name}" class="border p-2 w-full mb-3" required />
        <input name="code" value="${p.code}" class="border p-2 w-full mb-3" required />
        <input name="brand" value="${p.brand}" class="border p-2 w-full mb-3" />
        <input name="price" type="number" value="${p.price}" class="border p-2 w-full mb-3" />
        <button class="bg-indigo-600 text-white px-4 py-2 rounded w-full">Update</button>
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
            },
          }
        );
      await client.close();
      res.writeHead(302, { Location: "/products" });
      res.end();
    });
  } else if (req.method === "GET" && url.pathname === "/delete-product") {

  /* DELETE */
    const id = url.searchParams.get("id");
    await client.connect();
    await client
      .db("nodedb")
      .collection("products")
      .deleteOne({ _id: new ObjectId(id) });
    await client.close();
    res.writeHead(302, { Location: "/products" });
    res.end();
  } else {
    res.writeHead(404);
    res.end("Not Found");
  }
});

server.listen(8080, () => {
  console.log("✅ Server running: http://localhost:8080/dashboard");
});
