
import React, { useEffect, useState } from 'react';
import { Link, Navigate } from 'react-router-dom';
import axios from 'axios';

const API = import.meta.env.VITE_API_URL || 'http://localhost:8000';

const emptyProduct = {
  name: '',
  category: 'Women',
  description: '',
  price: '',
  image_url: '',
  stock: 0
};

const statuses = [
  'Received',
  'Processing',
  'Shipped',
  'Delivered',
  'Cancelled'
];

function getImageUrl(image) {
  if (!image) return '';

  if (image.startsWith('http://') || image.startsWith('https://')) {
    return image;
  }

  if (image.startsWith('/')) {
    return `${API}${image}`;
  }

  return image;
}

function Admin() {
  const token = localStorage.getItem('fh-token');
  const role = localStorage.getItem('fh-role');

  const [stats, setStats] = useState({
    total_products: 0,
    total_orders: 0,
    total_customers: 0,
    total_sales: 0
  });

  const [products, setProducts] = useState([]);
  const [orders, setOrders] = useState([]);
  const [section, setSection] = useState('overview');
  const [form, setForm] = useState(emptyProduct);
  const [editingId, setEditingId] = useState(null);

  const [selectedImage, setSelectedImage] = useState(null);
  const [previewUrl, setPreviewUrl] = useState('');

  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);

  const headers = {
    Authorization: `Bearer ${token}`
  };

  if (!token || role !== 'admin') {
    return <Navigate to="/account" replace />;
  }

  // ==========================================
  // IMAGE PREVIEW
  // ==========================================

  useEffect(() => {
    if (!selectedImage) {
      setPreviewUrl('');
      return;
    }

    const objectUrl = URL.createObjectURL(selectedImage);

    setPreviewUrl(objectUrl);

    return () => {
      URL.revokeObjectURL(objectUrl);
    };
  }, [selectedImage]);

  // ==========================================
  // LOAD ADMIN DASHBOARD
  // ==========================================

  async function loadDashboard() {
    setLoading(true);
    setMessage('');

    try {
      const [statsRes, productsRes, ordersRes] = await Promise.all([
        axios.get(`${API}/admin/stats`, { headers }),
        axios.get(`${API}/admin/products`, { headers }),
        axios.get(`${API}/admin/orders`, { headers })
      ]);

      setStats(statsRes.data);
      setProducts(productsRes.data);
      setOrders(ordersRes.data);

    } catch (error) {
      console.error(
        'Admin dashboard error:',
        error.response?.data || error.message
      );

      setMessage(
        error.response?.data?.detail ||
        'Could not load dashboard. Please sign in again.'
      );

    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadDashboard();
  }, []);

  // ==========================================
  // HANDLE FORM INPUTS
  // ==========================================

  const changeForm = event => {
    setForm({
      ...form,
      [event.target.name]: event.target.value
    });
  };

  // ==========================================
  // SELECT PRODUCT IMAGE
  // ==========================================

  const handleImageChange = event => {
    const file = event.target.files?.[0];

    if (!file) return;

    const allowedTypes = [
      'image/jpeg',
      'image/png',
      'image/webp'
    ];

    if (!allowedTypes.includes(file.type)) {
      setMessage('Please select a JPG, PNG or WEBP image.');
      event.target.value = '';
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setMessage('Image size must be 5 MB or less.');
      event.target.value = '';
      return;
    }

    setMessage('');
    setSelectedImage(file);
  };

  // ==========================================
  // UPLOAD IMAGE TO BACKEND
  // ==========================================

  const uploadImage = async () => {
    if (!selectedImage) {
      return form.image_url;
    }

    const imageData = new FormData();

    imageData.append('file', selectedImage);

    const response = await axios.post(
      `${API}/admin/upload-image`,
      imageData,
      {
        headers: {
          Authorization: `Bearer ${token}`
        }
      }
    );

    return response.data.image_url;
  };

  // ==========================================
  // RESET PRODUCT FORM
  // ==========================================

  const resetProductForm = () => {
    setForm(emptyProduct);
    setEditingId(null);
    setSelectedImage(null);
    setPreviewUrl('');
  };

  // ==========================================
  // ADD OR UPDATE PRODUCT
  // ==========================================

  const saveProduct = async event => {
    event.preventDefault();

    setMessage('');
    setSaving(true);

    try {
      // Upload image first, if a new image was selected.
      // Otherwise, keep the existing image URL.

      const imageUrl = await uploadImage();

      const productData = {
        ...form,
        price: Number(form.price),
        stock: Number(form.stock),
        image_url: imageUrl
      };

      if (editingId) {
        await axios.put(
          `${API}/admin/products/${editingId}`,
          productData,
          { headers }
        );

        setMessage('Product updated successfully.');

      } else {
        await axios.post(
          `${API}/admin/products`,
          productData,
          { headers }
        );

        setMessage('Product added successfully.');
      }

      resetProductForm();

      await loadDashboard();

    } catch (error) {
      console.error(
        'Product save error:',
        error.response?.data || error.message
      );

      setMessage(
        error.response?.data?.detail ||
        'Could not save product. Please try again.'
      );

    } finally {
      setSaving(false);
    }
  };

  // ==========================================
  // EDIT PRODUCT
  // ==========================================

  const editProduct = product => {
    setForm({
      name: product.name || '',
      category: product.category || 'Women',
      description: product.description || '',
      price: product.price ?? '',
      image_url: product.image_url || '',
      stock: product.stock ?? 0
    });

    setSelectedImage(null);
    setEditingId(product.id);
    setSection('products');

    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    });
  };

  // ==========================================
  // DELETE PRODUCT
  // ==========================================

  const deleteProduct = async id => {
    if (!window.confirm('Are you sure you want to delete this product?')) {
      return;
    }

    try {
      await axios.delete(
        `${API}/admin/products/${id}`,
        { headers }
      );

      setMessage('Product deleted successfully.');

      await loadDashboard();

    } catch (error) {
      setMessage(
        error.response?.data?.detail ||
        'Could not delete product.'
      );
    }
  };

  // ==========================================
  // UPDATE ORDER STATUS
  // ==========================================

  const updateOrderStatus = async (id, status) => {
    try {
      await axios.patch(
        `${API}/admin/orders/${id}/status`,
        { status },
        { headers }
      );

      setSelectedOrder(previous =>
        previous && previous.id === id
          ? { ...previous, status }
          : previous
      );

      setMessage(`Order #${id} status updated.`);

      await loadDashboard();

    } catch (error) {
      setMessage(
        error.response?.data?.detail ||
        'Could not update order.'
      );
    }
  };

  // ==========================================
  // FORMAT MONEY
  // ==========================================

  const formatMoney = amount =>
    `₹${Number(amount || 0).toLocaleString('en-IN')}`;

  // ==========================================
  // FORMAT DATE
  // ==========================================

  const formatDate = date => {
    if (!date) return 'Date not available';

    const parsedDate = new Date(date);

    if (Number.isNaN(parsedDate.getTime())) {
      return 'Date not available';
    }

    return parsedDate.toLocaleString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // ==========================================
  // LOADING SCREEN
  // ==========================================

  if (loading) {
    return (
      <main className="admin-loading">
        Loading your dashboard...
      </main>
    );
  }

  // ==========================================
  // ADMIN DASHBOARD
  // ==========================================

  return (
    <main className="admin-page">

      <aside className="admin-sidebar">

        <Link to="/" className="admin-logo">
          FASHION<span>HUB.</span>
        </Link>

        <p className="admin-label">ADMIN PANEL</p>

        <button
          className={section === 'overview' ? 'active' : ''}
          onClick={() => setSection('overview')}
        >
          Overview
        </button>

        <button
          className={section === 'products' ? 'active' : ''}
          onClick={() => setSection('products')}
        >
          Products
        </button>

        <button
          className={section === 'orders' ? 'active' : ''}
          onClick={() => setSection('orders')}
        >
          Orders
        </button>

        <div className="admin-sidebar-bottom">

          <Link to="/">
            View Store ↗
          </Link>

          <button
            onClick={() => {
              localStorage.removeItem('fh-token');
              localStorage.removeItem('fh-role');
              window.location.href = '/account';
            }}
          >
            Sign out
          </button>

        </div>
      </aside>

      <section className="admin-content">

        <header className="admin-topbar">

          <div>
            <span className="eyebrow">
              FASHION HUB MANAGEMENT
            </span>

            <h1>
              {section === 'overview'
                ? 'Overview'
                : section === 'products'
                  ? 'Products'
                  : 'Orders'}
            </h1>
          </div>

          <span className="admin-user">
            Administrator
          </span>

        </header>

        {message && (
          <div className="admin-message">
            {message}
          </div>
        )}

        {/* ==================================
            OVERVIEW
        ================================== */}

        {section === 'overview' && (
          <>

            <div className="admin-stats">

              <div className="admin-stat">
                <span>Total Products</span>
                <strong>{stats.total_products}</strong>
                <small>Products in your store</small>
              </div>

              <div className="admin-stat">
                <span>Total Orders</span>
                <strong>{stats.total_orders}</strong>
                <small>Customer orders received</small>
              </div>

              <div className="admin-stat">
                <span>Total Customers</span>
                <strong>{stats.total_customers}</strong>
                <small>Registered customers</small>
              </div>

              <div className="admin-stat">
                <span>Total Sales</span>
                <strong>{formatMoney(stats.total_sales)}</strong>
                <small>Order value recorded</small>
              </div>

            </div>

            <div className="admin-panel">

              <div className="admin-panel-heading">

                <h2>Recent Orders</h2>

                <button onClick={() => setSection('orders')}>
                  View all →
                </button>

              </div>

              {orders.length === 0 ? (
                <p className="admin-empty">
                  No orders received yet.
                </p>
              ) : (

                <div className="admin-table-wrap">

                  <table className="admin-table">

                    <thead>
                      <tr>
                        <th>Order</th>
                        <th>Customer</th>
                        <th>Total</th>
                        <th>Status</th>
                      </tr>
                    </thead>

                    <tbody>

                      {orders.slice(0, 5).map(order => (
                        <tr key={order.id}>
                          <td>#{order.id}</td>
                          <td>{order.customer_name}</td>
                          <td>{formatMoney(order.total)}</td>
                          <td>{order.status}</td>
                        </tr>
                      ))}

                    </tbody>

                  </table>

                </div>
              )}

            </div>

          </>
        )}

        {/* ==================================
            PRODUCTS
        ================================== */}

        {section === 'products' && (
          <>

            <div className="admin-panel">

              <h2>
                {editingId ? 'Edit Product' : 'Add New Product'}
              </h2>

              <form
                className="admin-product-form"
                onSubmit={saveProduct}
              >

                <label>
                  Product name

                  <input
                    name="name"
                    value={form.name}
                    onChange={changeForm}
                    required
                  />
                </label>

                <label>
                  Category

                  <select
                    name="category"
                    value={form.category}
                    onChange={changeForm}
                  >
                    <option value="Women">Women</option>
                    <option value="Men">Men</option>
                  </select>
                </label>

                <label>
                  Price (₹)

                  <input
                    type="number"
                    name="price"
                    min="0.01"
                    step="0.01"
                    value={form.price}
                    onChange={changeForm}
                    required
                  />
                </label>

                <label>
                  Stock quantity

                  <input
                    type="number"
                    name="stock"
                    min="0"
                    value={form.stock}
                    onChange={changeForm}
                    required
                  />
                </label>

                {/* DIRECT IMAGE UPLOAD */}

                <div className="admin-wide admin-image-upload">

                  <label htmlFor="product-image">
                    Product Image
                  </label>

                  <input
                    id="product-image"
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    onChange={handleImageChange}
                  />

                  <small>
                    Choose a JPG, PNG or WEBP image. Maximum size: 5 MB.
                  </small>

                  {(previewUrl || form.image_url) && (
                    <div className="admin-image-preview">

                      <img
                        src={
                          previewUrl ||
                          getImageUrl(form.image_url)
                        }
                        alt="Product preview"
                        style={{
                          width: '160px',
                          height: '180px',
                          objectFit: 'cover',
                          borderRadius: '10px',
                          marginTop: '12px'
                        }}
                      />

                      <p>
                        {selectedImage
                          ? 'New image selected'
                          : 'Current product image'}
                      </p>

                    </div>
                  )}

                </div>

                <label className="admin-wide">
                  Description

                  <textarea
                    name="description"
                    value={form.description}
                    onChange={changeForm}
                  />
                </label>

                <div className="admin-form-actions admin-wide">

                  <button
                    className="admin-primary"
                    type="submit"
                    disabled={saving}
                  >
                    {saving
                      ? 'Saving...'
                      : editingId
                        ? 'Update Product'
                        : 'Add Product'}
                  </button>

                  {editingId && (
                    <button
                      type="button"
                      className="admin-secondary"
                      disabled={saving}
                      onClick={resetProductForm}
                    >
                      Cancel
                    </button>
                  )}

                </div>

              </form>

            </div>

            {/* ALL PRODUCTS */}

            <div className="admin-panel">

              <h2>
                All Products ({products.length})
              </h2>

              <div className="admin-table-wrap">

                <table className="admin-table">

                  <thead>
                    <tr>
                      <th>Product</th>
                      <th>Category</th>
                      <th>Price</th>
                      <th>Stock</th>
                      <th>Actions</th>
                    </tr>
                  </thead>

                  <tbody>

                    {products.map(product => (
                      <tr key={product.id}>

                        <td>{product.name}</td>

                        <td>{product.category}</td>

                        <td>{formatMoney(product.price)}</td>

                        <td>{product.stock}</td>

                        <td>

                          <div className="admin-actions">

                            <button
                              onClick={() => editProduct(product)}
                            >
                              Edit
                            </button>

                            <button
                              className="delete-action"
                              onClick={() => deleteProduct(product.id)}
                            >
                              Delete
                            </button>

                          </div>

                        </td>

                      </tr>
                    ))}

                  </tbody>

                </table>

              </div>

            </div>

          </>
        )}

        {/* ==================================
            ORDERS
        ================================== */}

        {section === 'orders' && (

          <div className="admin-panel">

            <h2>
              Customer Orders ({orders.length})
            </h2>

            {orders.length === 0 ? (
              <p className="admin-empty">
                No orders received yet.
              </p>
            ) : (

              <div className="admin-table-wrap">

                <table className="admin-table">

                  <thead>
                    <tr>
                      <th>Order</th>
                      <th>Customer</th>
                      <th>Email</th>
                      <th>Total</th>
                      <th>Status</th>
                      <th>Update status</th>
                      <th>Details</th>
                    </tr>
                  </thead>

                  <tbody>

                    {orders.map(order => (
                      <tr key={order.id}>

                        <td>#{order.id}</td>

                        <td>{order.customer_name}</td>

                        <td>{order.email}</td>

                        <td>{formatMoney(order.total)}</td>

                        <td>{order.status}</td>

                        <td>

                          <select
                            value={order.status}
                            onChange={event =>
                              updateOrderStatus(
                                order.id,
                                event.target.value
                              )
                            }
                          >

                            {statuses.map(status => (
                              <option
                                key={status}
                                value={status}
                              >
                                {status}
                              </option>
                            ))}

                          </select>

                        </td>

                        <td>

                          <button
                            className="admin-view-button"
                            onClick={() => setSelectedOrder(order)}
                          >
                            View Details
                          </button>

                        </td>

                      </tr>
                    ))}

                  </tbody>

                </table>

              </div>
            )}

          </div>

        )}

      </section>

      {/* ==================================
          ORDER DETAILS MODAL
      ================================== */}

      {selectedOrder && (

        <div className="order-modal-overlay">

          <div
            className="order-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="order-modal-title"
          >

            <div className="order-modal-header">

              <div>
                <span className="eyebrow">
                  FASHION HUB
                </span>

                <h2 id="order-modal-title">
                  Order #{selectedOrder.id}
                </h2>
              </div>

              <button
                className="order-modal-close"
                onClick={() => setSelectedOrder(null)}
                aria-label="Close order details"
              >
                ×
              </button>

            </div>

            <div className="order-modal-body">

              <div className="order-detail-grid">

                <div>
                  <span>Customer name</span>
                  <strong>
                    {selectedOrder.customer_name || 'Not provided'}
                  </strong>
                </div>

                <div>
                  <span>Email address</span>
                  <strong>
                    {selectedOrder.email || 'Not provided'}
                  </strong>
                </div>

                <div>
                  <span>Phone number</span>
                  <strong>
                    {selectedOrder.phone || 'Not provided'}
                  </strong>
                </div>

                <div>
                  <span>Order date</span>
                  <strong>
                    {formatDate(selectedOrder.created_at)}
                  </strong>
                </div>

                <div className="order-address">
                  <span>Delivery address</span>
                  <strong>
                    {selectedOrder.address || 'Not provided'}
                  </strong>
                </div>

              </div>

              <div className="order-items-section">

                <h3>Purchased Products</h3>

                {selectedOrder.items &&
                selectedOrder.items.length > 0 ? (

                  <div className="admin-table-wrap">

                    <table className="admin-table order-items-table">

                      <thead>
                        <tr>
                          <th>Product</th>
                          <th>Price</th>
                          <th>Quantity</th>
                          <th>Subtotal</th>
                        </tr>
                      </thead>

                      <tbody>

                        {selectedOrder.items.map((item, index) => (
                          <tr key={item.id || index}>

                            <td>
                              {item.product_name || 'Product'}
                            </td>

                            <td>
                              {formatMoney(item.unit_price)}
                            </td>

                            <td>
                              {item.quantity}
                            </td>

                            <td>
                              {formatMoney(
                                item.subtotal ??
                                Number(item.unit_price || 0) *
                                Number(item.quantity || 0)
                              )}
                            </td>

                          </tr>
                        ))}

                      </tbody>

                    </table>

                  </div>

                ) : (

                  <p className="admin-empty">
                    Product details are not available for this order.
                  </p>

                )}

              </div>

              <div className="order-modal-total">

                <span>Total Amount</span>

                <strong>
                  {formatMoney(selectedOrder.total)}
                </strong>

              </div>

              <div className="order-modal-status">

                <span>Order status</span>

                <select
                  value={selectedOrder.status}
                  onChange={event =>
                    updateOrderStatus(
                      selectedOrder.id,
                      event.target.value
                    )
                  }
                >

                  {statuses.map(status => (
                    <option key={status} value={status}>
                      {status}
                    </option>
                  ))}

                </select>

              </div>

            </div>

            <div className="order-modal-footer">

              <button
                className="admin-primary"
                onClick={() => setSelectedOrder(null)}
              >
                Close Details
              </button>

            </div>

          </div>

        </div>

      )}

    </main>
  );
}

export default Admin;
