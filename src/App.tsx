import React, { useEffect, useState, useCallback } from "react";
import "./App.css";

interface Product {
  id: string;
  title: string;
  description: string;
  price: number;
}

const envBase = (import.meta.env.VITE_API_BASE || "http://localhost:3001").replace(/\/$/, "");
const API_BASE = `${envBase}/posts`;
const ITEMS_PER_PAGE = 5;

export default function App() {
  const [products, setProducts] = useState<Product[]>([]);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [totalItems, setTotalItems] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(false);
  const [searchTerm, setSearchTerm] = useState<string>("");

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState({ title: "", description: "", price: "" });
  const [addForm, setAddForm] = useState({ title: "", description: "", price: "" });

  const fetchProducts = useCallback(async () => {
    try {
      setLoading(true);
      
      const searchQuery = searchTerm ? `&q=${encodeURIComponent(searchTerm)}` : "";
      
      // UNIVERSAL PAGINATION LOGIC:
      // We send _page/_limit (Old Server) AND _start/_end (New Server)
      // One of these WILL work regardless of your json-server version.
      const start = (currentPage - 1) * ITEMS_PER_PAGE;
      const end = start + ITEMS_PER_PAGE;
      
      const url = `${API_BASE}?_page=${currentPage}&_limit=${ITEMS_PER_PAGE}&_start=${start}&_end=${end}${searchQuery}`;
      
      console.log("Fetching Page:", currentPage, "URL:", url);

      const res = await fetch(url);
      if (!res.ok) throw new Error("Server not responding");
      
      const data = await res.json();

      const countHeader = res.headers.get("X-Total-Count");
      if (countHeader) {
        const total = Number(countHeader);
        setTotalItems(total);
        setTotalPages(Math.ceil(total / ITEMS_PER_PAGE));
      } else {
        // Fallback for page count
        setTotalPages(data.length < ITEMS_PER_PAGE ? currentPage : currentPage + 1);
      }

      setProducts(data);
    } catch (error) {
      console.error("Fetch Error:", error);
    } finally {
      setLoading(false);
    }
  }, [currentPage, searchTerm]);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
    setCurrentPage(1); 
  };

  const addProduct = async () => {
    if (!addForm.title || !addForm.price) return alert("Fill in required fields");
    
    const newProduct = {
      id: Date.now().toString(), 
      title: addForm.title,
      description: addForm.description,
      price: Number(addForm.price)
    };

    try {
      setLoading(true);
      const response = await fetch(API_BASE, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newProduct),
      });

      if (response.ok) {
        setAddForm({ title: "", description: "", price: "" });
        setSearchTerm("");
        setCurrentPage(1);
        fetchProducts();
      }
    } catch (err) {
      alert("Error adding product. Is json-server running on 3001?");
    } finally {
      setLoading(false);
    }
  };

  const deleteProduct = async (id: string) => {
    if(!window.confirm("Delete this item?")) return;
    await fetch(`${API_BASE}/${id}`, { method: "DELETE" });
    fetchProducts();
  };

  const saveEdit = async (id: string) => {
    await fetch(`${API_BASE}/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...editForm, price: Number(editForm.price) }),
    });
    setEditingId(null);
    fetchProducts();
  };

  return (
    <div className="container" style={{ padding: '20px', maxWidth: '1000px', margin: '0 auto' }}>
      <header>
        <h1> Apple Store Inventory</h1>
        <p>Total Stock Items: <strong>{totalItems}</strong></p>
      </header>

      <input
        className="search-input"
        type="text"
        placeholder="Search models (iPhone, Mac...)"
        value={searchTerm}
        onChange={handleSearch}
        style={{ width: '100%', padding: '10px', marginBottom: '20px' }}
      />

      <div className="table-container">
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ background: '#f5f5f7' }}>
              <th>Product</th>
              <th>Details</th>
              <th>Price</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={4}>Updating...</td></tr>
            ) : products.length === 0 ? (
              <tr><td colSpan={4}>Inventory Empty</td></tr>
            ) : (
              products.map((p) => (
                <tr key={p.id} style={{ borderBottom: '1px solid #ddd' }}>
                  {editingId === p.id ? (
                    <>
                      <td><input value={editForm.title} onChange={e => setEditForm({...editForm, title: e.target.value})} /></td>
                      <td><input value={editForm.description} onChange={e => setEditForm({...editForm, description: e.target.value})} /></td>
                      <td><input type="number" value={editForm.price} onChange={e => setEditForm({...editForm, price: e.target.value})} /></td>
                      <td>
                        <button onClick={() => saveEdit(p.id)}>Save</button>
                        <button onClick={() => setEditingId(null)}>X</button>
                      </td>
                    </>
                  ) : (
                    <>
                      <td><strong>{p.title}</strong></td>
                      <td>{p.description}</td>
                      <td>${p.price.toLocaleString()}</td>
                      <td>
                        <button onClick={() => {
                          setEditingId(p.id);
                          setEditForm({ title: p.title, description: p.description, price: String(p.price) });
                        }}>Edit</button>
                        <button className="delete-btn" onClick={() => deleteProduct(p.id)}>Delete</button>
                      </td>
                    </>
                  )}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <div className="pagination" style={{ margin: '20px 0', display: 'flex', gap: '5px' }}>
        <button disabled={currentPage === 1} onClick={() => setCurrentPage(p => p - 1)}>Prev</button>
        {Array.from({ length: totalPages }, (_, i) => i + 1).map(pageNum => (
          <button
            key={pageNum}
            style={{ backgroundColor: currentPage === pageNum ? '#0071e3' : '#f5f5f7', color: currentPage === pageNum ? 'white' : 'black' }}
            onClick={() => setCurrentPage(pageNum)}
          >
            {pageNum}
          </button>
        ))}
        <button disabled={currentPage >= totalPages} onClick={() => setCurrentPage(p => p + 1)}>Next</button>
      </div>

      <div className="add-section" style={{ background: '#f5f5f7', padding: '20px', borderRadius: '12px' }}>
        <h3>Add New Device</h3>
        <div className="form-group" style={{ display: 'flex', gap: '10px' }}>
          <input placeholder="Title" value={addForm.title} onChange={e => setAddForm({...addForm, title: e.target.value})} />
          <input placeholder="Description" value={addForm.description} onChange={e => setAddForm({...addForm, description: e.target.value})} />
          <input type="number" placeholder="Price" value={addForm.price} onChange={e => setAddForm({...addForm, price: e.target.value})} />
          <button className="add-btn" onClick={addProduct}>Add Product</button>
        </div>
      </div>
    </div>
  );
}