import React, { useEffect, useState, useCallback } from "react";
import "./App.css";

interface Product {
  id: string;
  title: string;
  description: string;
  price: number;
}

const API_BASE = "http://localhost:3000/posts";
const ITEMS_PER_PAGE = 5;

export default function App() {
  const [products, setProducts] = useState<Product[]>([]);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [totalItems, setTotalItems] = useState<number>(0); // Added for visibility
  const [loading, setLoading] = useState<boolean>(false);
  const [searchTerm, setSearchTerm] = useState<string>("");

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState({ title: "", description: "", price: "" });
  const [addForm, setAddForm] = useState({ title: "", description: "", price: "" });

 const fetchProducts = useCallback(async () => {
    try {
      setLoading(true);
      
      const searchQuery = searchTerm ? `&q=${searchTerm}` : "";
      // Added _total=true which some v1.0 versions use to trigger the header
      const url = `${API_BASE}?_page=${currentPage}&_limit=${ITEMS_PER_PAGE}${searchQuery}`;
      
      const res = await fetch(url);
      const data = await res.json();

      // Look for the header (standard way)
      const countHeader = res.headers.get("X-Total-Count");
      
      if (countHeader) {
        const total = Number(countHeader);
        setTotalItems(total);
        setTotalPages(Math.ceil(total / ITEMS_PER_PAGE));
      } else {
        // FALLBACK: If header is missing, we estimate
        // If we got a full page of results (5), assume there might be another page
        // If we got fewer than 5, we know we are at the end.
        if (data.length === ITEMS_PER_PAGE) {
          setTotalPages(currentPage + 1);
        } else {
          setTotalPages(currentPage);
        }
        // Set total items to at least what we see
        setTotalItems(prev => Math.max(prev, (currentPage - 1) * ITEMS_PER_PAGE + data.length));
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
    setCurrentPage(1); // Always reset to page 1 when searching
  };

  // ================= ACTIONS =================
  const addProduct = async () => {
    if (!addForm.title || !addForm.price) return alert("Fill in required fields");
    
    await fetch(API_BASE, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...addForm, price: Number(addForm.price) }),
    });

    setAddForm({ title: "", description: "", price: "" });
    // If we were on page 1, fetchProducts triggers. 
    // If we added the 6th item while on page 1, fetchProducts will now see totalPages = 2
    fetchProducts();
  };

  const deleteProduct = async (id: string) => {
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
    <div className="container">
      <header>
        <h2>Luxury Product Manager</h2>
        <p>Total Products: <strong>{totalItems}</strong></p>
      </header>

      <input
        className="search-input"
        type="text"
        placeholder="Search products..."
        value={searchTerm}
        onChange={handleSearch}
      />

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
            <tr><td colSpan={4}>Loading...</td></tr>
          ) : products.length === 0 ? (
            <tr><td colSpan={4}>No results found</td></tr>
          ) : (
            products.map((p) => (
              <tr key={p.id}>
                {editingId === p.id ? (
                  <>
                    <td><input value={editForm.title} onChange={e => setEditForm({...editForm, title: e.target.value})} /></td>
                    <td><input value={editForm.description} onChange={e => setEditForm({...editForm, description: e.target.value})} /></td>
                    <td><input type="number" value={editForm.price} onChange={e => setEditForm({...editForm, price: e.target.value})} /></td>
                    <td>
                      <button onClick={() => saveEdit(p.id)}>Save</button>
                      <button onClick={() => setEditingId(null)}>Cancel</button>
                    </td>
                  </>
                ) : (
                  <>
                    <td>{p.title}</td>
                    <td>{p.description}</td>
                    <td>${p.price.toLocaleString()}</td>
                    <td>
                      <button onClick={() => {
                        setEditingId(p.id);
                        setEditForm({ title: p.title, description: p.description, price: String(p.price) });
                      }}>Edit</button>
                      <button onClick={() => deleteProduct(p.id)}>Delete</button>
                    </td>
                  </>
                )}
              </tr>
            ))
          )}
        </tbody>
      </table>

      {/* PAGINATION SECTION */}
      <div className="pagination">
        <button 
          disabled={currentPage === 1 || loading} 
          onClick={() => setCurrentPage(p => p - 1)}
        >
          Previous
        </button>

        {/* Dynamic Page Buttons */}
        {Array.from({ length: totalPages }, (_, i) => i + 1).map(pageNum => (
          <button
            key={pageNum}
            className={currentPage === pageNum ? "active" : ""}
            onClick={() => setCurrentPage(pageNum)}
          >
            {pageNum}
          </button>
        ))}

        <button 
          disabled={currentPage >= totalPages || loading} 
          onClick={() => setCurrentPage(p => p + 1)}
        >
          Next
        </button>
      </div>

      <div className="add-section">
        <h3>Add Product</h3>
        <input placeholder="Title" value={addForm.title} onChange={e => setAddForm({...addForm, title: e.target.value})} />
        <input placeholder="Description" value={addForm.description} onChange={e => setAddForm({...addForm, description: e.target.value})} />
        <input type="number" placeholder="Price" value={addForm.price} onChange={e => setAddForm({...addForm, price: e.target.value})} />
        <button onClick={addProduct}>Add</button>
      </div>
    </div>
  );
}