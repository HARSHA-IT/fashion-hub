from database import Base, engine, SessionLocal
from models import Product

Base.metadata.create_all(bind=engine)
db = SessionLocal()
items = [
    ("Relaxed Linen Shirt","Men","Easy everyday linen shirt",1299,"https://images.unsplash.com/photo-1596755094514-f87e34085b2c?w=900",25),
    ("Everyday Oversized Tee","Men","Soft cotton oversized tee",699,"https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=900",40),
    ("Classic Tailored Trousers","Men","Versatile tailored trousers",1599,"https://images.unsplash.com/photo-1473966968600-fa801b869a1a?w=900",20),
    ("Soft Knit Co-ord Set","Women","Comfortable knit co-ord set",1899,"https://images.unsplash.com/photo-1551163943-3f6a855d1153?w=900",18),
    ("Everyday Midi Dress","Women","An easy-to-wear midi dress",1499,"https://images.unsplash.com/photo-1539008835657-9e8e9680c956?w=900",22),
    ("Minimal Cotton Shirt","Women","Classic cotton shirt",1199,"https://images.unsplash.com/photo-1598554747436-c9293d6a588f?w=900",25),
    ("Weekend Denim","Men","Everyday denim jeans",1799,"https://images.unsplash.com/photo-1542272604-787c3835535d?w=900",15),
    ("Structured Day Bag","Women","Structured everyday bag",999,"https://images.unsplash.com/photo-1584917865442-de89df76afd3?w=900",12),
]
for name, category, description, price, image_url, stock in items:
    exists = db.query(Product).filter(Product.name == name).first()
    if not exists:
        db.add(Product(name=name, category=category, description=description, price=price, image_url=image_url, stock=stock))
db.commit()
db.close()
print("Fashion Hub sample products are ready.")
