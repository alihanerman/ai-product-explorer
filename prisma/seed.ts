// prisma/seed.ts

import { PrismaClient } from "@prisma/client";
import * as bcrypt from "bcryptjs";

// Prisma istemcisini başlat
const prisma = new PrismaClient();

// Resim URL'lerini bir haritada (map) saklayalım. Bu, kategori ve markaya göre doğru resmi seçmeyi kolaylaştırır.
const imageUrls = {
  phone: {
    Apple:
      "https://njzwljh5hbgbdvlu.public.blob.vercel-storage.com/iphone.webp",
    default:
      "https://njzwljh5hbgbdvlu.public.blob.vercel-storage.com/android.webp",
  },
  tablet: {
    Apple: "https://njzwljh5hbgbdvlu.public.blob.vercel-storage.com/ipad.webp",
    default:
      "https://njzwljh5hbgbdvlu.public.blob.vercel-storage.com/androidTab.webp",
  },
  desktop: {
    Apple: "https://njzwljh5hbgbdvlu.public.blob.vercel-storage.com/imac.webp",
    default:
      "https://njzwljh5hbgbdvlu.public.blob.vercel-storage.com/desktop.webp",
  },
  laptop: {
    Apple:
      "https://njzwljh5hbgbdvlu.public.blob.vercel-storage.com/macair.webp",
    default:
      "https://njzwljh5hbgbdvlu.public.blob.vercel-storage.com/thinkpad.webp",
  },
};

// Ürün verilerini oluştur
const getProducts = () => [
  // Apple Ürünleri
  {
    name: "iPhone 15 Pro",
    category: "phone",
    brand: "Apple",
    price: 1299.99,
    rating: 4.8,
    weight_kg: 0.187,
    cpu: "A17 Pro",
    ram_gb: 8,
    storage_gb: 256,
    screen_inch: 6.1,
    battery_wh: 15,
    image_url: imageUrls.phone.Apple,
  },
  {
    name: "iPhone 15",
    category: "phone",
    brand: "Apple",
    price: 899.0,
    rating: 4.6,
    weight_kg: 0.171,
    cpu: "A16 Bionic",
    ram_gb: 6,
    storage_gb: 128,
    screen_inch: 6.1,
    battery_wh: 14,
    image_url: imageUrls.phone.Apple,
  },
  {
    name: 'iPad Pro 12.9"',
    category: "tablet",
    brand: "Apple",
    price: 1099.0,
    rating: 4.9,
    weight_kg: 0.682,
    cpu: "M2",
    ram_gb: 8,
    storage_gb: 256,
    screen_inch: 12.9,
    battery_wh: 40,
    image_url: imageUrls.tablet.Apple,
  },
  {
    name: "iPad Air",
    category: "tablet",
    brand: "Apple",
    price: 599.0,
    rating: 4.7,
    weight_kg: 0.462,
    cpu: "M1",
    ram_gb: 8,
    storage_gb: 64,
    screen_inch: 10.9,
    battery_wh: 28,
    image_url: imageUrls.tablet.Apple,
  },
  {
    name: 'MacBook Air 15"',
    category: "laptop",
    brand: "Apple",
    price: 1299.0,
    rating: 4.8,
    weight_kg: 1.51,
    cpu: "M2",
    ram_gb: 8,
    storage_gb: 256,
    screen_inch: 15.3,
    battery_wh: 66,
    image_url: imageUrls.laptop.Apple,
  },
  {
    name: 'MacBook Pro 14"',
    category: "laptop",
    brand: "Apple",
    price: 1999.0,
    rating: 4.9,
    weight_kg: 1.6,
    cpu: "M3 Pro",
    ram_gb: 18,
    storage_gb: 512,
    screen_inch: 14.2,
    battery_wh: 70,
    image_url: imageUrls.laptop.Apple,
  },
  {
    name: 'iMac 24"',
    category: "desktop",
    brand: "Apple",
    price: 1499.0,
    rating: 4.7,
    weight_kg: 4.48,
    cpu: "M3",
    ram_gb: 8,
    storage_gb: 512,
    screen_inch: 24,
    battery_wh: 0,
    image_url: imageUrls.desktop.Apple,
  },

  // Android / Windows / Diğer Ürünler
  {
    name: "Samsung Galaxy S24 Ultra",
    category: "phone",
    brand: "Samsung",
    price: 1199.99,
    rating: 4.7,
    weight_kg: 0.232,
    cpu: "Snapdragon 8 Gen 3",
    ram_gb: 12,
    storage_gb: 512,
    screen_inch: 6.8,
    battery_wh: 19,
    image_url: imageUrls.phone.default,
  },
  {
    name: "Google Pixel 8 Pro",
    category: "phone",
    brand: "Google",
    price: 999.0,
    rating: 4.6,
    weight_kg: 0.213,
    cpu: "Google Tensor G3",
    ram_gb: 12,
    storage_gb: 256,
    screen_inch: 6.7,
    battery_wh: 18,
    image_url: imageUrls.phone.default,
  },
  {
    name: "Samsung Galaxy Z Fold 5",
    category: "phone",
    brand: "Samsung",
    price: 1799.0,
    rating: 4.5,
    weight_kg: 0.253,
    cpu: "Snapdragon 8 Gen 2",
    ram_gb: 12,
    storage_gb: 512,
    screen_inch: 7.6,
    battery_wh: 17,
    image_url: imageUrls.phone.default,
  },
  {
    name: "Samsung Galaxy Tab S9",
    category: "tablet",
    brand: "Samsung",
    price: 799.0,
    rating: 4.6,
    weight_kg: 0.498,
    cpu: "Snapdragon 8 Gen 2",
    ram_gb: 8,
    storage_gb: 128,
    screen_inch: 11,
    battery_wh: 32,
    image_url: imageUrls.tablet.default,
  },
  {
    name: "Lenovo Tab P12",
    category: "tablet",
    brand: "Lenovo",
    price: 349.99,
    rating: 4.4,
    weight_kg: 0.615,
    cpu: "MediaTek Dimensity 7050",
    ram_gb: 8,
    storage_gb: 128,
    screen_inch: 12.7,
    battery_wh: 39,
    image_url: imageUrls.tablet.default,
  },
  {
    name: "Dell XPS 15",
    category: "laptop",
    brand: "Dell",
    price: 2199.0,
    rating: 4.7,
    weight_kg: 1.92,
    cpu: "Intel Core i9-13900H",
    ram_gb: 32,
    storage_gb: 1024,
    screen_inch: 15.6,
    battery_wh: 86,
    image_url: imageUrls.laptop.default,
  },
  {
    name: "Lenovo ThinkPad X1 Carbon Gen 11",
    category: "laptop",
    brand: "Lenovo",
    price: 1599.5,
    rating: 4.8,
    weight_kg: 1.12,
    cpu: "Intel Core i7-1355U",
    ram_gb: 16,
    storage_gb: 512,
    screen_inch: 14,
    battery_wh: 57,
    image_url: imageUrls.laptop.default,
  },
  {
    name: "HP Spectre x360",
    category: "laptop",
    brand: "HP",
    price: 1249.99,
    rating: 4.5,
    weight_kg: 1.36,
    cpu: "Intel Core i7-1355U",
    ram_gb: 16,
    storage_gb: 512,
    screen_inch: 13.5,
    battery_wh: 66,
    image_url: imageUrls.laptop.default,
  },
  {
    name: "Asus ROG Zephyrus G14",
    category: "laptop",
    brand: "Asus",
    price: 1899.0,
    rating: 4.6,
    weight_kg: 1.72,
    cpu: "AMD Ryzen 9 7940HS",
    ram_gb: 16,
    storage_gb: 1024,
    screen_inch: 14,
    battery_wh: 76,
    image_url: imageUrls.laptop.default,
  },
  {
    name: "HP Pavilion Gaming Desktop",
    category: "desktop",
    brand: "HP",
    price: 999.99,
    rating: 4.4,
    weight_kg: 8.5,
    cpu: "AMD Ryzen 7 5700G",
    ram_gb: 16,
    storage_gb: 1024,
    screen_inch: 0,
    battery_wh: 0,
    image_url: imageUrls.desktop.default,
  },
  {
    name: "Dell Inspiron 27 All-in-One",
    category: "desktop",
    brand: "Dell",
    price: 1199.0,
    rating: 4.5,
    weight_kg: 7.2,
    cpu: "Intel Core i7-1355U",
    ram_gb: 16,
    storage_gb: 512,
    screen_inch: 27,
    battery_wh: 0,
    image_url: imageUrls.desktop.default,
  },
  // Biraz daha çeşitlilik
  {
    name: "OnePlus 12",
    category: "phone",
    brand: "OnePlus",
    price: 799.0,
    rating: 4.5,
    weight_kg: 0.22,
    cpu: "Snapdragon 8 Gen 3",
    ram_gb: 16,
    storage_gb: 512,
    screen_inch: 6.82,
    battery_wh: 20,
    image_url: imageUrls.phone.default,
  },
  {
    name: "Microsoft Surface Laptop 5",
    category: "laptop",
    brand: "Microsoft",
    price: 1199.0,
    rating: 4.3,
    weight_kg: 1.27,
    cpu: "Intel Core i5-1235U",
    ram_gb: 8,
    storage_gb: 512,
    screen_inch: 13.5,
    battery_wh: 47,
    image_url: imageUrls.laptop.default,
  },
  {
    name: "Razer Blade 16",
    category: "laptop",
    brand: "Razer",
    price: 2699.99,
    rating: 4.6,
    weight_kg: 2.45,
    cpu: "Intel Core i9-13950HX",
    ram_gb: 32,
    storage_gb: 2048,
    screen_inch: 16,
    battery_wh: 95,
    image_url: imageUrls.laptop.default,
  },
  {
    name: "Google Pixel Tablet",
    category: "tablet",
    brand: "Google",
    price: 499.0,
    rating: 4.2,
    weight_kg: 0.493,
    cpu: "Google Tensor G2",
    ram_gb: 8,
    storage_gb: 128,
    screen_inch: 10.95,
    battery_wh: 27,
    image_url: imageUrls.tablet.default,
  },
  {
    name: "Xiaomi 14 Ultra",
    category: "phone",
    brand: "Xiaomi",
    price: 1150.0,
    rating: 4.7,
    weight_kg: 0.224,
    cpu: "Snapdragon 8 Gen 3",
    ram_gb: 16,
    storage_gb: 512,
    screen_inch: 6.73,
    battery_wh: 19,
    image_url: imageUrls.phone.default,
  },
  {
    name: "Lenovo Yoga 9i",
    category: "laptop",
    brand: "Lenovo",
    price: 1399.0,
    rating: 4.6,
    weight_kg: 1.4,
    cpu: "Intel Core i7-1360P",
    ram_gb: 16,
    storage_gb: 1024,
    screen_inch: 14,
    battery_wh: 75,
    image_url: imageUrls.laptop.default,
  },
  {
    name: "Mac mini",
    category: "desktop",
    brand: "Apple",
    price: 599.0,
    rating: 4.8,
    weight_kg: 1.18,
    cpu: "M2",
    ram_gb: 8,
    storage_gb: 256,
    screen_inch: 0,
    battery_wh: 0,
    image_url: imageUrls.desktop.Apple, // iMac resmi uygun olur
  },
  {
    name: "Acer Predator Orion 3000",
    category: "desktop",
    brand: "Acer",
    price: 1499.99,
    rating: 4.5,
    weight_kg: 9.8,
    cpu: "Intel Core i7-12700F",
    ram_gb: 16,
    storage_gb: 1024,
    screen_inch: 0,
    battery_wh: 0,
    image_url: imageUrls.desktop.default,
  },
  {
    name: "iPhone SE",
    category: "phone",
    brand: "Apple",
    price: 429.0,
    rating: 4.4,
    weight_kg: 0.144,
    cpu: "A15 Bionic",
    ram_gb: 4,
    storage_gb: 64,
    screen_inch: 4.7,
    battery_wh: 8,
    image_url: imageUrls.phone.Apple,
  },
  {
    name: "Samsung Galaxy A54",
    category: "phone",
    brand: "Samsung",
    price: 449.99,
    rating: 4.3,
    weight_kg: 0.202,
    cpu: "Exynos 1380",
    ram_gb: 8,
    storage_gb: 128,
    screen_inch: 6.4,
    battery_wh: 19,
    image_url: imageUrls.phone.default,
  },
  {
    name: 'MacBook Pro 16"',
    category: "laptop",
    brand: "Apple",
    price: 2499.0,
    rating: 4.9,
    weight_kg: 2.15,
    cpu: "M3 Max",
    ram_gb: 36,
    storage_gb: 1024,
    screen_inch: 16.2,
    battery_wh: 100,
    image_url: imageUrls.laptop.Apple,
  },
  {
    name: "Microsoft Surface Pro 9",
    category: "tablet",
    brand: "Microsoft",
    price: 999.0,
    rating: 4.5,
    weight_kg: 0.879,
    cpu: "Intel Core i5-1235U",
    ram_gb: 8,
    storage_gb: 256,
    screen_inch: 13,
    battery_wh: 47,
    image_url: imageUrls.tablet.default, // Genel tablet resmi kullanılabilir
  },
  {
    name: "Alienware Aurora R15",
    category: "desktop",
    brand: "Dell",
    price: 2899.99,
    rating: 4.7,
    weight_kg: 16.5,
    cpu: "Intel Core i9-13900KF",
    ram_gb: 32,
    storage_gb: 2048,
    screen_inch: 0,
    battery_wh: 0,
    image_url: imageUrls.desktop.default,
  },
];

async function main() {
  console.log("Start seeding ...");

  // Önceki verileri temizle (opsiyonel ama önerilir)
  // İlişkilerden dolayı silme sırası önemli: Önce Favorite, sonra User ve Product.
  await prisma.favorite.deleteMany();
  console.log("Deleted records in favorite table");

  await prisma.user.deleteMany();
  console.log("Deleted records in user table");

  await prisma.product.deleteMany();
  console.log("Deleted records in product table");

  // --- KULLANICI OLUŞTUR ---
  const salt = await bcrypt.genSalt(10);
  const hashedPassword = await bcrypt.hash("password123", salt);

  await prisma.user.create({
    data: {
      email: "test@example.com",
      name: "Test User",
      password: hashedPassword,
    },
  });
  console.log("Created user: test@example.com");

  // --- ÜRÜNLERİ OLUŞTUR ---
  const products = getProducts();
  await prisma.product.createMany({
    data: products,
  });
  console.log(`Created ${products.length} products`);

  console.log("Seeding finished.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    // Veritabanı bağlantısını kapat
    await prisma.$disconnect();
  });
