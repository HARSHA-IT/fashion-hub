
import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { Package, ArrowRight, RefreshCw } from 'lucide-react';
import { money } from './data';

const API = import.meta.env.VITE_API_URL || 'http://localhost:8000';

function formatDate(value) {
  if (!value) return 'Date unavailable';

  return new Date(value).toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'long',
    year: 'numeric'
  });
}

export default function MyOrders() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadOrders = async () => {
    const token = localStorage.getItem('fh-token');

    if (!token) {
      setError('Please sign in to view your orders.');
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError('');

      const response = await axios.get(`${API}/my-orders`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      setOrders(Array.isArray(response.data) ? response.data : []);
    } catch (err) {
      console.error(
        'My orders error:',
        err.response?.data || err.message
      );

      setError(
        err.response?.data?.detail ||
        'Could not load your orders. Please try again.'
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadOrders();
  }, []);

  return (
    <main className="wrap page my-orders-page">
      <div className="breadcrumbs">HOME / MY ACCOUNT / MY ORDERS</div>

      <div className="my-orders-heading">
        <div>
          <span className="eyebrow">YOUR FASHION HUB ACCOUNT</span>
          <h1>My <em>orders.</em></h1>
          <p className="muted">
            Keep track of your purchases and delivery updates.
          </p>
        </div>

        <button
          className="outline-btn"
          onClick={loadOrders}
          disabled={loading}
        >
          <RefreshCw size={16} />
          REFRESH
        </button>
      </div>

      {loading ? (
        <div className="empty">Loading your orders...</div>
      ) : error ? (
        <div className="empty">
          <p>{error}</p>
          <Link className="btn btn-dark" to="/account">
            GO TO ACCOUNT
          </Link>
        </div>
      ) : orders.length === 0 ? (
        <div className="empty my-orders-empty">
          <Package size={48} />
          <h2>No orders yet.</h2>
          <p>Your orders will appear here after checkout.</p>
          <Link className="btn btn-dark" to="/shop">
            EXPLORE THE COLLECTION <ArrowRight size={16} />
          </Link>
        </div>
      ) : (
        <div className="my-orders-list">
          {orders.map(order => (
            <article className="my-order-card" key={order.id}>
              <div className="my-order-top">
                <div>
                  <span className="eyebrow">ORDER NUMBER</span>
                  <h3>#{order.id}</h3>
                  <span className="muted">
                    Placed on {formatDate(order.created_at)}
                  </span>
                </div>

                <div className="my-order-status">
                  <span className="eyebrow">ORDER STATUS</span>
                  <strong>{order.status}</strong>
                </div>
              </div>

              <div className="my-order-items">
                {order.items?.length ? (
                  order.items.map(item => (
                    <div className="my-order-item" key={item.id}>
                      <div>
                        <b>{item.product_name}</b>
                        <span className="muted">
                          Quantity: {item.quantity}
                        </span>
                      </div>

                      <strong>{money(item.subtotal)}</strong>
                    </div>
                  ))
                ) : (
                  <p className="muted">
                    Product details are not available for this order.
                  </p>
                )}
              </div>

              <div className="my-order-bottom">
                <div>
                  <span className="muted">Delivery address</span>
                  <p>{order.address}</p>
                </div>

                <div className="my-order-total">
                  <span className="muted">ORDER TOTAL</span>
                  <strong>{money(order.total)}</strong>
                </div>
              </div>
            </article>
          ))}
        </div>
      )}
    </main>
  );
}
