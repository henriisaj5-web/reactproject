import { useEffect, useState } from "react";
import "./App.css";

type Product = {
  id: number;
  title: string;
  description: string;
  price: number;
};

const API_BASE = import.meta.env.VITE_API_BASE;

export default function App() {
  const [currentPage, setCurrentPage] = useState(1);
  const [page1Products, setPage1Products] = useState<Product[]>([]);
  const [page2Products, setPage2Products] = useState<Product[]>([]);
  const [page3Products, setPage3Products] = useState<Product[]>([]);

  const [editingId, setEditingId] = useState<number | null>(null);

  const [editForm, setEditForm] = useState({
    title: "",
    description: "",
    price: ""
  });

  const [addForm, setAddForm] = useState({
    title: "",
    description: "",
    price: ""
  });

  const [searchTerm, setSearchTerm] = useState("");
  const [searchTriggered, setSearchTriggered] = useState(false);

  const [selectedProducts, setSelectedProducts] = useState<number[]>([]);
  const [selectAll, setSelectAll] = useState(false);

  const TOTAL_PAGES = 3; // Dynamic total pages
  const pageKey = `page${currentPage}Products`;

  // ================= FETCH =================
  useEffect(() => {
    fetch(`${API_BASE}/page1Products`).then(r => r.json()).then(setPage1Products);
    fetch(`${API_BASE}/page2Products`).then(r => r.json()).then(setPage2Products);
    fetch(`${API_BASE}/page3Products`).then(r => r.json()).then(setPage3Products);
  }, []);

  // reset search and selection when switching pages
  useEffect(() => {
    setSearchTerm("");
    setSearchTriggered(false);
    setSelectedProducts([]);
    setSelectAll(false);
  }, [currentPage]);

  const getCurrentProducts = () => {
    if (currentPage === 1) return page1Products;
    if (currentPage === 2) return page2Products;
    return page3Products;
  };

  const setCurrentProducts = (data: Product[]) => {
    if (currentPage === 1) setPage1Products(data);
    else if (currentPage === 2) setPage2Products(data);
    else setPage3Products(data);
  };

  const formatPrice = (price: number) => `$${price.toLocaleString()}`;

  // ================= ADD =================
  const addProduct = () => {
    if (!addForm.title || !addForm.price) return alert("Title and Price required");

    fetch(`${API_BASE}/${pageKey}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: addForm.title,
        description: addForm.description,
        price: Number(addForm.price)
      })
    })
      .then(r => r.json())
      .then(data => {
        setCurrentProducts([...getCurrentProducts(), data]);
        setAddForm({ title: "", description: "", price: "" });
      });
  };

  // ================= DELETE =================
  const deleteProduct = (id: number) => {
    fetch(`${API_BASE}/${pageKey}/${id}`, { method: "DELETE" })
      .then(() => setCurrentProducts(getCurrentProducts().filter(p => p.id !== id)));
    setSelectedProducts(selectedProducts.filter(pid => pid !== id));
  };

  // ================= EDIT =================
  const startEdit = (p: Product) => {
    setEditingId(p.id);
    setEditForm({
      title: p.title,
      description: p.description,
      price: String(p.price)
    });
  };

  const saveEdit = (id: number) => {
    fetch(`${API_BASE}/${pageKey}/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: editForm.title,
        description: editForm.description,
        price: Number(editForm.price)
      })
    })
      .then(r => r.json())
      .then(updated => {
        setCurrentProducts(getCurrentProducts().map(p => (p.id === id ? updated : p)));
        setEditingId(null);
      });
  };

  // ================= SEARCH =================
  const handleSearchInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
    setSearchTriggered(false);
  };

  const filteredProducts = getCurrentProducts().filter(p =>
    p.title.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // keep selectAll checkbox in sync
  useEffect(() => {
    if (filteredProducts.length === 0) {
      setSelectAll(false);
      return;
    }
    setSelectAll(filteredProducts.every(p => selectedProducts.includes(p.id)));
  }, [selectedProducts, filteredProducts]);

  return (
    <div className="container">
      <h2>Luxury Product Manager</h2>

      {/* SEARCH */}
      <div className="search-bar">
        <input
          type="text"
          placeholder={`Search products on page ${currentPage}...`}
          value={searchTerm}
          onChange={handleSearchInput}
        />
        <button className="search-btn" onClick={() => setSearchTriggered(true)}>
          Search
        </button>
      </div>

      {/* TABLE */}
      <table>
        <thead>
          <tr>
            <th>
              <input
                type="checkbox"
                checked={selectAll}
                onChange={(e) => {
                  const checked = e.target.checked;
                  setSelectAll(checked);
                  setSelectedProducts(
                    checked ? filteredProducts.map(p => p.id) : []
                  );
                }}
              />
            </th>
            <th>Title</th>
            <th>Description</th>
            <th>Price</th>
            <th>Actions</th>
          </tr>
        </thead>

        <tbody>
          {filteredProducts.length === 0 ? (
            <tr>
              <td colSpan={5} className="no-results">
                No products found
              </td>
            </tr>
          ) : (
            filteredProducts.map(p => (
              <tr key={p.id}>
                <td>
                  <input
                    type="checkbox"
                    checked={selectedProducts.includes(p.id)}
                    onChange={(e) => {
                      const checked = e.target.checked;
                      setSelectedProducts(
                        checked
                          ? [...selectedProducts, p.id]
                          : selectedProducts.filter(id => id !== p.id)
                      );
                    }}
                  />
                </td>
                <td>
                  {editingId === p.id ? (
                    <input
                      value={editForm.title}
                      onChange={e =>
                        setEditForm({ ...editForm, title: e.target.value })
                      }
                    />
                  ) : searchTerm && searchTriggered ? (
                    <span
                      dangerouslySetInnerHTML={{
                        __html: p.title.replace(
                          new RegExp(`(${searchTerm})`, "gi"),
                          `<span class="highlight">$1</span>`
                        )
                      }}
                    />
                  ) : searchTerm ? (
                    <span
                      dangerouslySetInnerHTML={{
                        __html: p.title.replace(
                          new RegExp(`(${searchTerm})`, "gi"),
                          `<span class="plain-highlight">$1</span>`
                        )
                      }}
                    />
                  ) : (
                    p.title
                  )}
                </td>
                <td>
                  {editingId === p.id ? (
                    <input
                      value={editForm.description}
                      onChange={e =>
                        setEditForm({ ...editForm, description: e.target.value })
                      }
                    />
                  ) : (
                    p.description
                  )}
                </td>
                <td>
                  {editingId === p.id ? (
                    <input
                      type="number"
                      value={editForm.price}
                      onChange={e =>
                        setEditForm({ ...editForm, price: e.target.value })
                      }
                    />
                  ) : (
                    formatPrice(p.price)
                  )}
                </td>
                <td>
                  {editingId === p.id ? (
                    <>
                      <button onClick={() => saveEdit(p.id)}>Save</button>
                      <button className="cancel" onClick={() => setEditingId(null)}>
                        Cancel
                      </button>
                    </>
                  ) : (
                    <>
                      <button onClick={() => startEdit(p)}>Edit</button>
                      <button className="delete" onClick={() => deleteProduct(p.id)}>
                        Delete
                      </button>
                    </>
                  )}
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>

      {/* ADD FORM */}
      <div className="add-form">
        <h3>Add Product (Page {currentPage})</h3>
        <div className="add-row">
          <input
            placeholder="Title"
            value={addForm.title}
            onChange={e => setAddForm({ ...addForm, title: e.target.value })}
          />
          <input
            placeholder="Description"
            value={addForm.description}
            onChange={e => setAddForm({ ...addForm, description: e.target.value })}
          />
          <input
            type="number"
            placeholder="Price"
            value={addForm.price}
            onChange={e => setAddForm({ ...addForm, price: e.target.value })}
          />
          <button className="add" onClick={addProduct}>
            Add
          </button>
        </div>
      </div>

      {/* PAGINATION */}
      <div className="pagination">
        <button
          className="nav-btn"
          disabled={currentPage === 1}
          onClick={() => setCurrentPage(p => p - 1)}
        >
          ← Previous
        </button>

        {Array.from({ length: TOTAL_PAGES }, (_, i) => i + 1).map(page => (
          <button
            key={page}
            className={`page-btn ${currentPage === page ? "active" : ""}`}
            onClick={() => setCurrentPage(page)}
          >
            {page}
          </button>
        ))}

        <button
          className="nav-btn"
          disabled={currentPage === TOTAL_PAGES}
          onClick={() => setCurrentPage(p => p + 1)}
        >
          Next →
        </button>
      </div>
    </div>
  );
}