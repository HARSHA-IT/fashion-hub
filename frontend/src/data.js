export const products = [
 {id:1,name:'Relaxed Linen Shirt',category:'Men',type:'Shirts',price:1299,oldPrice:1799,tag:'BESTSELLER',color:'Sand',sizes:['S','M','L','XL'],image:'https://images.unsplash.com/photo-1596755094514-f87e34085b2c?w=900'},
 {id:2,name:'Everyday Oversized Tee',category:'Men',type:'T-shirts',price:699,oldPrice:999,tag:'NEW',color:'Ivory',sizes:['S','M','L','XL'],image:'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=900'},
 {id:3,name:'Classic Tailored Trousers',category:'Men',type:'Bottoms',price:1599,oldPrice:2199,tag:'TRENDING',color:'Black',sizes:['S','M','L','XL'],image:'https://images.unsplash.com/photo-1473966968600-fa801b869a1a?w=900'},
 {id:4,name:'Soft Knit Co-ord Set',category:'Women',type:'Co-ords',price:1899,oldPrice:2499,tag:'BESTSELLER',color:'Oat',sizes:['S','M','L','XL'],image:'https://images.unsplash.com/photo-1551163943-3f6a855d1153?w=900'},
 {id:5,name:'Everyday Midi Dress',category:'Women',type:'Dresses',price:1499,oldPrice:1999,tag:'NEW',color:'Black',sizes:['S','M','L'],image:'https://images.unsplash.com/photo-1539008835657-9e8e9680c956?w=900'},
 {id:6,name:'Minimal Cotton Shirt',category:'Women',type:'Shirts',price:1199,oldPrice:1599,tag:'JUST IN',color:'White',sizes:['S','M','L','XL'],image:'https://images.unsplash.com/photo-1598554747436-c9293d6a588f?w=900'},
 {id:7,name:'Weekend Denim',category:'Men',type:'Bottoms',price:1799,oldPrice:2299,tag:'TRENDING',color:'Blue',sizes:['S','M','L','XL'],image:'https://images.unsplash.com/photo-1542272604-787c3835535d?w=900'},
 {id:8,name:'Structured Day Bag',category:'Women',type:'Accessories',price:999,oldPrice:1399,tag:'NEW',color:'Tan',sizes:['One size'],image:'https://images.unsplash.com/photo-1584917865442-de89df76afd3?w=900'}
];
export const money = n => new Intl.NumberFormat('en-IN',{style:'currency',currency:'INR',maximumFractionDigits:0}).format(n);
