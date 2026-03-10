import { useEffect, useState } from "react";
import "./App.css";

type Product = {
  id: string;
  title: string;
  description: string;
  price: number;
};

const API_BASE = "http://localhost:3000/posts";
const ITEMS_PER_PAGE = 5;

export default function App() {
  const [products, setProducts] = useState<Product[]>([]);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [loading, setLoading] = useState<boolean>(false);

  const [editingId, setEditingId] = useState<string | null>(null);

  const [editForm, setEditForm] = useState({
    title: "",
    description: "",
    price: "",
  });

  const [addForm, setAddForm] = useState({
    title: "",
    description: "",
    price: "",
  });

  const [searchTerm, setSearchTerm] = useState<string>("");

  // ================= FETCH PRODUCTS =================
  const fetchProducts = async () => {
    try {
      setLoading(true);
      const res = await fetch(
        `${API_BASE}?_page=${currentPage}&_limit=${ITEMS_PER_PAGE}`
      );
      const totalCount = res.headers.get("X-Total-Count");
      if (totalCount) {
        setTotalPages(Math.ceil(Number(totalCount) / ITEMS_PER_PAGE));
      }
      const data = await res.json();
      setProducts(data);
    } catch (error) {
      console.error("Error fetching products:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, [currentPage]);

  const formatPrice = (price: number) => `$${price.toLocaleString()}`;

  // ================= ADD PRODUCT =================
  const addProduct = async () => {
    if (!addForm.title || !addForm.price) {
      alert("Title and Price are required");
      return;
    }

    await fetch(API_BASE, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: addForm.title,
        description: addForm.description,
        price: Number(addForm.price),
      }),
    });

    setAddForm({ title: "", description: "", price: "" });
    fetchProducts();
  };

  // ================= DELETE PRODUCT =================
  const deleteProduct = async (id: string) => {
    await fetch(`${API_BASE}/${id}`, { method: "DELETE" });
    fetchProducts();
  };

  // ================= EDIT PRODUCT =================
  const startEdit = (product: Product) => {
    setEditingId(product.id);
    setEditForm({
      title: product.title,
      description: product.description,
      price: String(product.price),
    });
  };

  const saveEdit = async (id: string) => {
    await fetch(`${API_BASE}/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: editForm.title,
        description: editForm.description,
        price: Number(editForm.price),
      }),
    });
    setEditingId(null);
    fetchProducts();
  };

  // ================= SEARCH FILTER =================
  const filteredProducts = products.filter((product) =>
    product.title.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="container">
      <h2>Luxury Product Manager</h2>

      {/* SEARCH */}
      <input
        className="search-input"
        type="text"
        placeholder="Search products..."
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
      />

      {/* TABLE */}
      <table>
        <thead>
          <tr>
            <th>Title</th>
            <th>Description</th>
            <th>Price</th>
            <th>Actions</th>
          </tr>
        </thead>

        <tbody>
          {loading ? (
            <tr>
              <td colSpan={4}>Loading...</td>
            </tr>
          ) : filteredProducts.length === 0 ? (
            <tr>
              <td colSpan={4}>No products found</td>
            </tr>
          ) : (
            filteredProducts.map((product) => (
              <tr key={product.id}>
                <td>
                  {editingId === product.id ? (
                    <input
                      value={editForm.title}
                      onChange={(e) =>
                        setEditForm({ ...editForm, title: e.target.value })
                      }
                    />
                  ) : (
                    product.title
                  )}
                </td>
                <td>
                  {editingId === product.id ? (
                    <input
                      value={editForm.description}
                      onChange={(e) =>
                        setEditForm({ ...editForm, description: e.target.value })
                      }
                    />
                  ) : (
                    product.description
                  )}
                </td>
                <td>
                  {editingId === product.id ? (
                    <input
                      type="number"
                      value={editForm.price}
                      onChange={(e) =>
                        setEditForm({ ...editForm, price: e.target.value })
                      }
                    />
                  ) : (
                    formatPrice(product.price)
                  )}
                </td>
                <td>
                  {editingId === product.id ? (
                    <>
                      <button onClick={() => saveEdit(product.id)}>Save</button>
                      <button onClick={() => setEditingId(null)}>Cancel</button>
                    </>
                  ) : (
                    <>
                      <button onClick={() => startEdit(product)}>Edit</button>
                      <button onClick={() => deleteProduct(product.id)}>Delete</button>
                    </>
                  )}
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>

      {/* ADD PRODUCT */}
      <div className="add-section">
        <h3>Add Product</h3>
        <input
          placeholder="Title"
          value={addForm.title}
          onChange={(e) => setAddForm({ ...addForm, title: e.target.value })}
        />
        <input
          placeholder="Description"
          value={addForm.description}
          onChange={(e) =>
            setAddForm({ ...addForm, description: e.target.value })
          }
        />
        <input
          type="number"
          placeholder="Price"
          value={addForm.price}
          onChange={(e) => setAddForm({ ...addForm, price: e.target.value })}
        />
        <button onClick={addProduct}>Add</button>
      </div>

      {/* PAGINATION */}
      <div className="pagination">
        <button
          disabled={currentPage === 1}
          onClick={() => setCurrentPage((prev) => prev - 1)}
        >
          ← Previous
        </button>

        {Array.from({ length: totalPages }, (_, index) => index + 1).map(
          (page) => (
            <button
              key={page}
              className={currentPage === page ? "active" : ""}
              onClick={() => setCurrentPage(page)}
            >
              {page}
            </button>
          )
        )}

        <button
          disabled={currentPage === totalPages}
          onClick={() => setCurrentPage((prev) => prev + 1)}
        >
          Next →
        </button>
      </div>
    </div>
  );
}