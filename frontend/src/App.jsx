
import React, { useEffect, useMemo, useState } from 'react';
import {
  Link,
  Route,
  Routes,
  Navigate,
  useNavigate
} from 'react-router-dom';

import {
  Heart, ShoppingBag, Search, Menu, X, ArrowRight,
  UserRound, Plus, Minus, Trash2, CheckCircle2, LogOut
} from 'lucide-react';

import axios from 'axios';
import { products as sampleProducts, money } from './data';
import Admin from './Admin';
import MyOrders from './MyOrders';

const API = (import.meta.env.VITE_API_URL || 'http://localhost:8000').replace(/\/$/, '');

const read = key => {
  try {
    return JSON.parse(localStorage.getItem(key)) || [];
  } catch {
    return [];
  }
};

const save = (key, value) => {
  localStorage.setItem(key, JSON.stringify(value));
};


// ==================================================
// NORMALIZE PRODUCTS
// ==================================================

function normalizeProduct(item) {
  const fallback = sampleProducts.find(
    p => String(p.id) === String(item.id)
  );

  let sizes = item.sizes || fallback?.sizes || ['S', 'M', 'L', 'XL'];

  if (typeof sizes === 'string') {
    try {
      sizes = JSON.parse(sizes);
    } catch {
      sizes = sizes.split(',').map(s => s.trim());
    }
  }

  // Handle uploaded images from the backend.
  const rawImage =
    item.image ||
    item.image_url ||
    item.imageUrl ||
    item.image_path ||
    '';

  const image = rawImage
    ? rawImage.startsWith('/')
      ? `${API}${rawImage}`
      : rawImage
    : fallback?.image || 'https://placehold.co/600x800?text=Fashion+Hub';

  return {
    id: item.id,
    name: item.name || item.title || fallback?.name || 'Fashion Item',
    category: item.category || fallback?.category || 'Women',
    type: item.type || item.subcategory || fallback?.type || 'Essentials',
    price: Number(item.price ?? fallback?.price ?? 0),
    oldPrice: Number(
      item.old_price ?? item.oldPrice ?? fallback?.oldPrice ?? item.price ?? 0
    ),
    image,
    tag: item.tag || fallback?.tag || 'NEW',
    color: item.color || fallback?.color || 'Classic',
    sizes: Array.isArray(sizes) ? sizes : ['S', 'M', 'L', 'XL']
  };
}


// ==================================================
// HEADER
// ==================================================

function Header({ wishCount, cartCount, onLogout }) {
  const [open, setOpen] = useState(false);

  return (
    <header className="header">
      <div className="topline">
        COMPLIMENTARY SHIPPING ON ORDERS ABOVE ₹1,999
      </div>

      <nav className="nav wrap">
        <button
          className="icon-btn mobile-menu"
          onClick={() => setOpen(!open)}
          aria-label="Menu"
        >
          {open ? <X /> : <Menu />}
        </button>

        <Link className="logo" to="/">
          FASHION<span>HUB.</span>
        </Link>

        <div className={`navlinks ${open ? 'show' : ''}`}>
          <Link onClick={() => setOpen(false)} to="/shop">
            NEW ARRIVALS
          </Link>

          <Link onClick={() => setOpen(false)} to="/shop?category=Women">
            WOMEN
          </Link>

          <Link onClick={() => setOpen(false)} to="/shop?category=Men">
            MEN
          </Link>

          <Link onClick={() => setOpen(false)} to="/my-orders">
            MY ORDERS
          </Link>

          <a href="#story" onClick={() => setOpen(false)}>
            OUR STORY
          </a>
        </div>

        <div className="nav-actions">
          <Link className="icon-btn count-wrap" to="/wishlist" aria-label="Wishlist">
            <Heart />
            <i>{wishCount}</i>
          </Link>

          <Link className="icon-btn count-wrap" to="/cart" aria-label="Cart">
            <ShoppingBag />
            <i>{cartCount}</i>
          </Link>

          <button
            className="icon-btn"
            onClick={onLogout}
            aria-label="Logout"
            title="Logout"
          >
            <LogOut />
          </button>
        </div>
      </nav>
    </header>
  );
}


// ==================================================
// FOOTER
// ==================================================

function Footer() {
  return (
    <footer id="story">
      <div className="wrap footer-grid">
        <div>
          <Link className="logo light" to="/">
            FASHION<span>HUB.</span>
          </Link>
          <p>Thoughtful essentials. Effortless everyday style.</p>
        </div>

        <div>
          <b>EXPLORE</b>
          <Link to="/shop">Shop all</Link>
          <Link to="/shop?category=Women">Women</Link>
          <Link to="/shop?category=Men">Men</Link>
        </div>

        <div>
          <b>HELP</b>
          <a href="mailto:hello@fashionhub.example">Contact us</a>
          <span>Shipping & returns</span>
          <span>Size guide</span>
        </div>

        <div>
          <b>STAY IN THE LOOP</b>
          <p>New drops, styling notes and more.</p>

          <form
            className="subscribe"
            onSubmit={e => {
              e.preventDefault();
              alert('Thanks for subscribing!');
            }}
          >
            <input type="email" placeholder="Your email address" required />
            <button aria-label="Subscribe">
              <ArrowRight />
            </button>
          </form>
        </div>
      </div>

      <div className="wrap copyright">
        © 2026 FASHION HUB. DEMO STORE.
      </div>
    </footer>
  );
}


// ==================================================
// PRODUCT CARD
// ==================================================

function ProductCard({ p, wish, onWish, onAdd }) {
  return (
    <article className="product-card">
      <div className="product-image">
        <Link to={`/product/${p.id}`}>
          <img src={p.image} alt={p.name} />
        </Link>

        <span className="tag">{p.tag}</span>

        <button
          className={`wish ${wish ? 'active' : ''}`}
          onClick={() => onWish(p.id)}
          aria-label="Toggle wishlist"
        >
          <Heart fill={wish ? 'currentColor' : 'none'} />
        </button>

        <button className="quick-add" onClick={() => onAdd(p)}>
          ADD TO BAG <Plus size={15} />
        </button>
      </div>

      <div className="product-meta">
        <div>
          <span className="muted">{p.category} · {p.type}</span>

          <Link to={`/product/${p.id}`} className="product-name">
            {p.name}
          </Link>
        </div>

        <b>{money(p.price)}</b>
      </div>

      <div className="swatch-line">
        <span className="swatch"></span>
        <small>{p.color}</small>
      </div>
    </article>
  );
}


// ==================================================
// HOME PAGE
// ==================================================

function Home({ products, wishlist, onWish, onAdd }) {
  return (
    <>
      <section className="hero">
        <img
          src="https://images.unsplash.com/photo-1483985988355-763728e1935b?w=1800"
          alt="Fashion collection"
        />

        <div className="hero-shade"></div>

        <div className="hero-copy">
          <span className="eyebrow">THE EVERYDAY EDIT · 2026</span>

          <h1>
            Wear your<br />
            <em>own story.</em>
          </h1>

          <p>Considered pieces for wherever life takes you.</p>

          <Link className="btn btn-light" to="/shop">
            SHOP THE COLLECTION <ArrowRight size={17} />
          </Link>
        </div>

        <div className="hero-index">01 / NEW SEASON</div>
      </section>

      <section className="wrap section">
        <div className="section-head">
          <div>
            <span className="eyebrow">CURATED FOR YOU</span>
            <h2>Find your <em>everyday.</em></h2>
          </div>

          <Link className="text-link" to="/shop">
            VIEW ALL <ArrowRight size={16} />
          </Link>
        </div>

        <div className="category-banners">
          <Link to="/shop?category=Women" className="category-tile">
            <img
              src="https://images.unsplash.com/photo-1485968579580-b6d095142e6e?w=1000"
              alt="Women's collection"
            />
            <span>THE WOMEN'S EDIT <ArrowRight /></span>
          </Link>

          <Link to="/shop?category=Men" className="category-tile">
            <img
              src="https://images.unsplash.com/photo-1516257984-b1b4d707412e?w=1000"
              alt="Men's collection"
            />
            <span>THE MEN'S EDIT <ArrowRight /></span>
          </Link>
        </div>
      </section>

      <section className="section soft">
        <div className="wrap">
          <div className="section-head">
            <div>
              <span className="eyebrow">THE PIECES EVERYONE LOVES</span>
              <h2>Current <em>favourites.</em></h2>
            </div>

            <Link className="text-link" to="/shop">
              SHOP ALL <ArrowRight size={16} />
            </Link>
          </div>

          <div className="product-grid">
            {products.slice(0, 4).map(p => (
              <ProductCard
                key={p.id}
                p={p}
                wish={wishlist.includes(p.id)}
                onWish={onWish}
                onAdd={onAdd}
              />
            ))}
          </div>
        </div>
      </section>

      <section className="manifesto wrap">
        <span className="eyebrow">LESS, BUT BETTER</span>

        <h2>
          Good style is<br />
          <em>never complicated.</em>
        </h2>

        <p>
          Versatile silhouettes, easy textures and pieces you'll reach for
          again and again.
        </p>

        <Link to="/shop" className="text-link">
          DISCOVER FASHION HUB <ArrowRight size={16} />
        </Link>
      </section>
    </>
  );
}


// ==================================================
// SHOP PAGE
// ==================================================

function Shop({ products, wishlist, onWish, onAdd }) {
  const [category, setCategory] = useState(
    new URLSearchParams(window.location.search).get('category') || 'All'
  );

  const [query, setQuery] = useState('');
  const [sort, setSort] = useState('featured');

  const filtered = useMemo(() => {
    return products
      .filter(p =>
        (category === 'All' || p.category.toLowerCase() === category.toLowerCase()) &&
        p.name.toLowerCase().includes(query.toLowerCase())
      )
      .sort((a, b) =>
        sort === 'low'
          ? a.price - b.price
          : sort === 'high'
            ? b.price - a.price
            : 0
      );
  }, [products, category, query, sort]);

  return (
    <main className="wrap page">
      <div className="breadcrumbs">HOME / SHOP</div>

      <div className="page-title">
        <div>
          <span className="eyebrow">MADE FOR EVERY DAY</span>
          <h1>Shop <em>all.</em></h1>
        </div>

        <span className="muted">{filtered.length} PIECES</span>
      </div>

      <div className="shop-tools">
        <div className="filters">
          {['All', 'Women', 'Men'].map(c => (
            <button
              className={category === c ? 'selected' : ''}
              onClick={() => setCategory(c)}
              key={c}
            >
              {c}
            </button>
          ))}
        </div>

        <div className="tool-right">
          <label className="searchbox">
            <Search size={17} />

            <input
              value={query}
              onChange={e => setQuery(e.target.value)}
              placeholder="Search pieces"
            />
          </label>

          <select value={sort} onChange={e => setSort(e.target.value)}>
            <option value="featured">Featured</option>
            <option value="low">Price: low to high</option>
            <option value="high">Price: high to low</option>
          </select>
        </div>
      </div>

      {filtered.length ? (
        <div className="product-grid">
          {filtered.map(p => (
            <ProductCard
              key={p.id}
              p={p}
              wish={wishlist.includes(p.id)}
              onWish={onWish}
              onAdd={onAdd}
            />
          ))}
        </div>
      ) : (
        <div className="empty">No pieces found. Try another search.</div>
      )}
    </main>
  );
}


// ==================================================
// PRODUCT DETAILS
// ==================================================

function Product({ products, wishlist, onWish, onAdd }) {
  const id = window.location.pathname.split('/').pop();
  const p = products.find(x => String(x.id) === String(id));

  const [size, setSize] = useState('');

  if (!p) {
    return (
      <main className="page wrap empty">
        Product not found <Link to="/shop">Back to shop</Link>
      </main>
    );
  }

  return (
    <main className="wrap page detail">
      <div className="detail-image">
        <img src={p.image} alt={p.name} />
      </div>

      <div className="detail-info">
        <div className="breadcrumbs">
          HOME / {p.category.toUpperCase()} / {p.name.toUpperCase()}
        </div>

        <span className="eyebrow">{p.category} · {p.type}</span>

        <h1>{p.name}</h1>

        <div className="detail-price">
          {money(p.price)} <del>{money(p.oldPrice)}</del>
        </div>

        <p className="muted">
          An easy-to-style essential, designed for comfort and made to fit
          effortlessly into your everyday wardrobe.
        </p>

        <div className="option-label">
          SELECT SIZE <Link to="/size-guide">SIZE GUIDE</Link>
        </div>

        <div className="sizes">
          {p.sizes.map(s => (
            <button
              className={size === s ? 'chosen' : ''}
              onClick={() => setSize(s)}
              key={s}
            >
              {s}
            </button>
          ))}
        </div>

        <button
          className="btn btn-dark full"
          onClick={() =>
            size ? onAdd(p, size) : alert('Please select a size first')
          }
        >
          ADD TO BAG <ShoppingBag size={17} />
        </button>

        <button className="outline-btn full" onClick={() => onWish(p.id)}>
          <Heart size={17} />
          {wishlist.includes(p.id) ? 'REMOVE FROM WISHLIST' : 'ADD TO WISHLIST'}
        </button>

        <div className="detail-note">
          ✓ Secure checkout &nbsp; · &nbsp; Easy returns*
          <br />
          *Store policies to be configured before launch.
        </div>
      </div>
    </main>
  );
}


// ==================================================
// CART
// ==================================================

function Cart({ cart, setCart }) {
  const update = (id, size, delta) => {
    const next = cart.map(x =>
      x.id === id && x.size === size
        ? { ...x, qty: Math.max(1, x.qty + delta) }
        : x
    );

    setCart(next);
    save('fh-cart', next);
  };

  const remove = (id, size) => {
    const next = cart.filter(x => !(x.id === id && x.size === size));

    setCart(next);
    save('fh-cart', next);
  };

  const total = cart.reduce((s, x) => s + x.price * x.qty, 0);

  return (
    <main className="wrap page">
      <div className="breadcrumbs">HOME / YOUR BAG</div>

      <h1>Your <em>bag.</em></h1>

      {!cart.length ? (
        <div className="empty">
          Your bag is waiting for something good.
          <br />

          <Link className="btn btn-dark" to="/shop">
            EXPLORE THE COLLECTION
          </Link>
        </div>
      ) : (
        <div className="cart-layout">
          <div>
            {cart.map(x => (
              <div className="cart-row" key={`${x.id}-${x.size}`}>
                <img src={x.image} alt={x.name} />

                <div className="cart-desc">
                  <b>{x.name}</b>
                  <span className="muted">Size: {x.size || 'M'}</span>
                  <b>{money(x.price)}</b>

                  <div className="qty">
                    <button onClick={() => update(x.id, x.size, -1)}>
                      <Minus size={14} />
                    </button>

                    {x.qty}

                    <button onClick={() => update(x.id, x.size, 1)}>
                      <Plus size={14} />
                    </button>
                  </div>
                </div>

                <button
                  className="icon-btn"
                  onClick={() => remove(x.id, x.size)}
                  aria-label="Remove"
                >
                  <Trash2 />
                </button>
              </div>
            ))}
          </div>

          <aside className="summary">
            <h3>ORDER SUMMARY</h3>

            <div>
              <span>Subtotal</span>
              <b>{money(total)}</b>
            </div>

            <div>
              <span>Shipping</span>
              <span>{total >= 1999 ? 'FREE' : 'Calculated at checkout'}</span>
            </div>

            <div className="total">
              <span>Total</span>
              <b>{money(total)}</b>
            </div>

            <Link className="btn btn-dark full" to="/checkout">
              CONTINUE TO CHECKOUT <ArrowRight size={17} />
            </Link>

            <p className="muted">
              Taxes and delivery details are confirmed at checkout.
            </p>
          </aside>
        </div>
      )}
    </main>
  );
}


// ==================================================
// WISHLIST
// ==================================================

function Wishlist({ products, wishlist, onWish, onAdd }) {
  const saved = products.filter(p => wishlist.includes(p.id));

  return (
    <main className="wrap page">
      <div className="breadcrumbs">HOME / WISHLIST</div>

      <h1>Your <em>saved pieces.</em></h1>

      {saved.length ? (
        <div className="product-grid">
          {saved.map(p => (
            <ProductCard
              key={p.id}
              p={p}
              wish={true}
              onWish={onWish}
              onAdd={onAdd}
            />
          ))}
        </div>
      ) : (
        <div className="empty">
          Your wishlist is empty.

          <Link className="btn btn-dark" to="/shop">
            FIND YOUR FAVOURITES
          </Link>
        </div>
      )}
    </main>
  );
}


// ==================================================
// CHECKOUT
// ==================================================

function Checkout({ cart, onOrderPlaced }) {
  const [done, setDone] = useState(false);
  const [orderId, setOrderId] = useState(null);
  const [loading, setLoading] = useState(false);

  const [form, setForm] = useState({
    name: localStorage.getItem('fh-name') || '',
    email: localStorage.getItem('fh-email') || '',
    phone: '',
    address: '',
    city: '',
    pincode: ''
  });

  const change = e => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const submit = async e => {
    e.preventDefault();

    const token = localStorage.getItem('fh-token');

    if (!token) {
      alert('Please sign in before placing an order.');
      return;
    }

    if (!cart.length) {
      alert('Your bag is empty.');
      return;
    }

    try {
      setLoading(true);

      const response = await axios.post(
        `${API}/orders`,
        {
          customer_name: form.name,
          email: form.email,
          phone: form.phone,
          address: `${form.address}, ${form.city} - ${form.pincode}`,
          items: cart.map(x => ({
            product_id: x.id,
            quantity: x.qty,
            size: x.size
          }))
        },
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );

      setOrderId(response.data.order_id);
      setDone(true);
      onOrderPlaced();

    } catch (error) {
      console.error(
        'Order error:',
        error.response?.data || error.message
      );

      alert(
        error.response?.data?.detail ||
        'Could not place the order. Please try again.'
      );

    } finally {
      setLoading(false);
    }
  };

  if (done) {
    return (
      <main className="page wrap empty">
        <CheckCircle2 size={48} />

        <h1>Thank you for your order.</h1>

        <p>Your order has been placed successfully.</p>

        {orderId && <p>Order number: #{orderId}</p>}

        <Link className="btn btn-dark" to="/my-orders">
          VIEW MY ORDERS
        </Link>

        <Link className="text-link" to="/shop">
          CONTINUE SHOPPING
        </Link>
      </main>
    );
  }

  return (
    <main className="wrap page">
      <div className="breadcrumbs">HOME / CHECKOUT</div>

      <h1>Delivery <em>details.</em></h1>

      <form className="checkout-form" onSubmit={submit}>
        <div className="form-grid">
          {[
            ['name', 'Full name'],
            ['email', 'Email address'],
            ['phone', 'Phone number'],
            ['city', 'City'],
            ['pincode', 'PIN code']
          ].map(([n, l]) => (
            <label key={n}>
              {l}

              <input
                name={n}
                required
                value={form[n]}
                onChange={change}
                type={n === 'email' ? 'email' : 'text'}
                readOnly={n === 'email'}
              />
            </label>
          ))}

          <label className="wide">
            Full address

            <textarea
              name="address"
              required
              value={form.address}
              onChange={change}
            />
          </label>
        </div>

        <div className="checkout-total">
          <b>Order total</b>

          <b>
            {money(cart.reduce((s, x) => s + x.price * x.qty, 0))}
          </b>
        </div>

        <p className="muted">
          Demo checkout: payment is not collected by this starter.
        </p>

        <button
          className="btn btn-dark"
          type="submit"
          disabled={!cart.length || loading}
        >
          {loading ? 'PLACING ORDER...' : 'PLACE ORDER REQUEST'}
          {!loading && <ArrowRight size={17} />}
        </button>
      </form>
    </main>
  );
}


// ==================================================
// LOGIN AND REGISTER
// ==================================================

function Account({ onLogin }) {
  const navigate = useNavigate();

  const [mode, setMode] = useState('login');

  const [form, setForm] = useState({
    name: '',
    email: '',
    password: ''
  });

  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

  const submit = async e => {
    e.preventDefault();

    try {
      setLoading(true);
      setMessage('');

      const endpoint =
        mode === 'login' ? '/auth/login' : '/auth/register';

      const res = await axios.post(`${API}${endpoint}`, {
        ...form,
        email: form.email.trim().toLowerCase()
      });

      if (mode === 'login' && res.data.access_token) {
        const userRole = res.data.role || 'customer';

        localStorage.setItem('fh-token', res.data.access_token);
        localStorage.setItem('fh-role', userRole);
        localStorage.setItem('fh-email', res.data.email || form.email);
        localStorage.setItem('fh-name', res.data.name || '');

        onLogin(res.data.access_token, userRole);

        navigate(
          userRole === 'admin' ? '/admin' : '/',
          { replace: true }
        );

      } else {
        setMessage('Account created successfully. Please sign in.');

        setMode('login');

        setForm({
          name: '',
          email: form.email,
          password: ''
        });
      }

    } catch (error) {
      console.error(
        'Account error:',
        error.response?.data || error.message
      );

      setMessage(
        error.response?.data?.detail ||
        'Could not connect. Please check that the backend is running.'
      );

    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="wrap page account">
      <span className="eyebrow">WELCOME TO FASHION HUB</span>

      <h1>
        {mode === 'login'
          ? 'Good to see you.'
          : 'Create your account.'}
      </h1>

      <p className="muted">
        Sign in to explore our collections and manage your orders.
      </p>

      <div className="account-tabs">
        <button
          type="button"
          className={mode === 'login' ? 'selected' : ''}
          onClick={() => {
            setMode('login');
            setMessage('');
          }}
        >
          LOGIN
        </button>

        <button
          type="button"
          className={mode === 'register' ? 'selected' : ''}
          onClick={() => {
            setMode('register');
            setMessage('');
          }}
        >
          REGISTER
        </button>
      </div>

      <form onSubmit={submit}>
        {mode === 'register' && (
          <label>
            Full name

            <input
              required
              value={form.name}
              onChange={e =>
                setForm({ ...form, name: e.target.value })
              }
            />
          </label>
        )}

        <label>
          Email address

          <input
            required
            type="email"
            value={form.email}
            onChange={e =>
              setForm({ ...form, email: e.target.value })
            }
          />
        </label>

        <label>
          Password

          <input
            required
            type="password"
            minLength="8"
            value={form.password}
            onChange={e =>
              setForm({ ...form, password: e.target.value })
            }
          />
        </label>

        <button
          className="btn btn-dark full"
          type="submit"
          disabled={loading}
        >
          {loading
            ? 'PLEASE WAIT...'
            : mode === 'login'
              ? 'SIGN IN'
              : 'CREATE ACCOUNT'}
        </button>

        {message && <p className="notice">{message}</p>}
      </form>
    </main>
  );
}


// ==================================================
// MAIN APP
// ==================================================

export default function App() {
  const [catalog, setCatalog] = useState(sampleProducts);

  const [wishlist, setWishlist] = useState(
    () => read('fh-wishlist')
  );

  const [cart, setCart] = useState(
    () => read('fh-cart')
  );

  const [authToken, setAuthToken] = useState(
    localStorage.getItem('fh-token') || ''
  );

  const [userRole, setUserRole] = useState(
    localStorage.getItem('fh-role') || ''
  );

  const [authChecked, setAuthChecked] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function loadProducts() {
      try {
        const response = await axios.get(`${API}/products`);

        const data = Array.isArray(response.data)
          ? response.data
          : response.data.products || response.data.items || [];

        if (!cancelled && data.length > 0) {
          setCatalog(data.map(normalizeProduct));
          console.log('Products loaded from backend:', data);
        }

      } catch (error) {
        console.error(
          'Could not load backend products:',
          error.response?.data || error.message
        );
      }
    }

    loadProducts();

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    setAuthChecked(true);
  }, []);

  const handleLogin = (token, role) => {
    setAuthToken(token);
    setUserRole(role);

    localStorage.setItem('fh-token', token);
    localStorage.setItem('fh-role', role);
  };

  const handleLogout = () => {
    localStorage.removeItem('fh-token');
    localStorage.removeItem('fh-role');
    localStorage.removeItem('fh-email');
    localStorage.removeItem('fh-name');

    setAuthToken('');
    setUserRole('');

    // Keep wishlist and cart saved on this browser.
  };

  const onWish = id => {
    const next = wishlist.includes(id)
      ? wishlist.filter(x => x !== id)
      : [...wishlist, id];

    setWishlist(next);
    save('fh-wishlist', next);
  };

  const onAdd = (p, size = 'M') => {
    const next = [...cart];

    const found = next.find(
      x => String(x.id) === String(p.id) && x.size === size
    );

    if (found) {
      found.qty++;
    } else {
      next.push({ ...p, size, qty: 1 });
    }

    setCart(next);
    save('fh-cart', next);

    alert('Added to your bag');
  };

  const onOrderPlaced = () => {
    setCart([]);
    save('fh-cart', []);
  };

  // Wait until saved login information is read.

  if (!authChecked) {
    return <div className="empty">Loading Fashion Hub...</div>;
  }

  // ================================================
  // LOGIN FIRST: NO ACCESS WITHOUT LOGIN
  // ================================================

  if (!authToken) {
    return (
      <Routes>
        <Route
          path="/account"
          element={<Account onLogin={handleLogin} />}
        />

        <Route
          path="*"
          element={<Navigate to="/account" replace />}
        />
      </Routes>
    );
  }

  // ================================================
  // ADMIN ROLE PROTECTION
  // ================================================

  return (
    <>
      <Header
        wishCount={wishlist.length}
        cartCount={cart.reduce((s, x) => s + x.qty, 0)}
        onLogout={handleLogout}
      />

      <Routes>
        <Route
          path="/"
          element={
            userRole === 'admin'
              ? <Navigate to="/admin" replace />
              : (
                <Home
                  products={catalog}
                  wishlist={wishlist}
                  onWish={onWish}
                  onAdd={onAdd}
                />
              )
          }
        />

        <Route
          path="/shop"
          element={
            userRole === 'admin'
              ? <Navigate to="/admin" replace />
              : (
                <Shop
                  products={catalog}
                  wishlist={wishlist}
                  onWish={onWish}
                  onAdd={onAdd}
                />
              )
          }
        />

        <Route
          path="/product/:id"
          element={
            userRole === 'admin'
              ? <Navigate to="/admin" replace />
              : (
                <Product
                  products={catalog}
                  wishlist={wishlist}
                  onWish={onWish}
                  onAdd={onAdd}
                />
              )
          }
        />

        <Route
          path="/wishlist"
          element={
            userRole === 'admin'
              ? <Navigate to="/admin" replace />
              : (
                <Wishlist
                  products={catalog}
                  wishlist={wishlist}
                  onWish={onWish}
                  onAdd={onAdd}
                />
              )
          }
        />

        <Route
          path="/cart"
          element={
            userRole === 'admin'
              ? <Navigate to="/admin" replace />
              : <Cart cart={cart} setCart={setCart} />
          }
        />

        <Route
          path="/checkout"
          element={
            userRole === 'admin'
              ? <Navigate to="/admin" replace />
              : (
                <Checkout
                  cart={cart}
                  onOrderPlaced={onOrderPlaced}
                />
              )
          }
        />

        <Route
          path="/my-orders"
          element={
            userRole === 'admin'
              ? <Navigate to="/admin" replace />
              : <MyOrders />
          }
        />

        <Route
          path="/admin"
          element={
            userRole === 'admin'
              ? <Admin />
              : <Navigate to="/" replace />
          }
        />

        <Route
          path="/account"
          element={
            <Navigate
              to={userRole === 'admin' ? '/admin' : '/'}
              replace
            />
          }
        />

        <Route
          path="*"
          element={
            <Navigate
              to={userRole === 'admin' ? '/admin' : '/'}
              replace
            />
          }
        />
      </Routes>

      <Footer />
    </>
  );
}
