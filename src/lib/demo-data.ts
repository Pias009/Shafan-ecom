export type DemoProduct = {
  id: string;
  name: string;
  brand: string;
  category: "Skincare" | "Haircare" | "Fragrance";
  price: number;
  discountPrice?: number;
  imageUrl: string;
  hot?: boolean;
  features: string[];
  details: string;
};

export const demoBrands = [
  { id: "b1", name: "Anua", icon: "🅰" },
  { id: "b2", name: "Axis-Y", icon: "🅱" },
  { id: "b3", name: "Beauty of Jason", icon: "💄" },
  { id: "b4", name: "Celimax", icon: "🌿" },
  { id: "b5", name: "Cerave", icon: "💧" },
  { id: "b6", name: "CosRx", icon: "✨" },
  { id: "b7", name: "Dr.Althea", icon: "👨‍⚕️" },
  { id: "b8", name: "Eucerin", icon: "🛡️" },
  { id: "b9", name: "Embryolisse", icon: "🌸" },
  { id: "b10", name: "I am from", icon: "👤" },
  { id: "b11", name: "K18", icon: "🔢" },
  { id: "b12", name: "Kiehl's", icon: "🏢" },
  { id: "b13", name: "Ksecret- Seoul 1988", icon: "🇰🇷" },
  { id: "b14", name: "La Roche Posay", icon: "⚕️" },
  { id: "b15", name: "Millie", icon: "💖" },
  { id: "b16", name: "Medicube", icon: "💊" },
  { id: "b17", name: "PanOxyl", icon: "🧴" },
  { id: "b18", name: "paula's choice", icon: "👩" },
  { id: "b19", name: "Purito Seoul", icon: "🌱" },
  { id: "b20", name: "Skin 1004", icon: "🔟" },
  { id: "b21", name: "Some by mi", icon: "🍯" },
  { id: "b22", name: "The Ordinary", icon: "⚗️" },
  { id: "b23", name: "Timeless", icon: "⏳" },
  // Keep existing demo brands for backward compatibility
  { id: "b24", name: "Frost & Co", icon: "❄" },
  { id: "b25", name: "AquaGlass", icon: "💧" },
  { id: "b26", name: "NoirMint", icon: "🌿" },
  { id: "b27", name: "SkyPearl", icon: "☁" },
  { id: "b28", name: "Violet Lab", icon: "✦" },
  { id: "b29", name: "Glow Forge", icon: "◈" },
] as const;

export const demoCategories = [
  {
    id: "c1",
    label: "Skincare",
    description: "Clean, icy hydration.",
  },
  {
    id: "c2",
    label: "Haircare",
    description: "Smooth, glass shine.",
  },
  {
    id: "c3",
    label: "Body Care",
    description: "Nourish & refresh.",
  },
  {
    id: "c4",
    label: "Fragrance",
    description: "Cool, modern notes.",
  },
] as const;

export const demoProducts: DemoProduct[] = [
  {
    id: "p1",
    name: "Icy Gel Cleanser",
    brand: "Frost & Co",
    category: "Skincare",
    price: 24,
    discountPrice: 19,
    imageUrl: "https://images.unsplash.com/photo-1580870069867-74c57ee1bb07?auto=format&fit=crop&w=1200&q=80",
    hot: true,
    features: ["Gentle surfactants", "No fragrance", "pH-balanced"],
    details: "A cooling cleanser built for daily use. Leaves skin clean and comfortable with a glassy finish.",
  },
  {
    id: "p2",
    name: "Glass Skin Serum",
    brand: "AquaGlass",
    category: "Skincare",
    price: 32,
    imageUrl: "https://images.unsplash.com/photo-1556228578-0d85b1a4d571?auto=format&fit=crop&w=1200&q=80",
    hot: true,
    features: ["Hyaluronic complex", "Niacinamide", "Fast absorption"],
    details: "A lightweight, high-slip serum for a visible glow and soft-focus finish.",
  },
  {
    id: "p3",
    name: "Mint Cloud Mist",
    brand: "NoirMint",
    category: "Skincare",
    price: 18,
    imageUrl: "https://images.unsplash.com/photo-1612810436541-336f8fd55eb5?auto=format&fit=crop&w=1200&q=80",
    features: ["Fine atomizer", "Cooling feel", "Makeup friendly"],
    details: "Refresh on demand with an ultra-fine mist that sits like glass, not droplets.",
  },
  {
    id: "p4",
    name: "Silk Glass Shampoo",
    brand: "Glow Forge",
    category: "Haircare",
    price: 28,
    discountPrice: 22,
    imageUrl: "https://images.unsplash.com/photo-1611930021866-9f6bf2d2d4a1?auto=format&fit=crop&w=1200&q=80",
    hot: true,
    features: ["Low-foam cleanse", "Softens", "Color safe"],
    details: "A modern shampoo for shine without heaviness—built for daily routines.",
  },
  {
    id: "p5",
    name: "Mirror Gloss Conditioner",
    brand: "SkyPearl",
    category: "Haircare",
    price: 30,
    imageUrl: "https://images.unsplash.com/photo-1620916566393-7a19f78146ee?auto=format&fit=crop&w=1200&q=80",
    features: ["Slip + detangle", "Silicone-smart", "Fresh finish"],
    details: "Detangles fast and leaves a reflective shine with a clean rinse.",
  },
  {
    id: "p6",
    name: "Violet Night Eau",
    brand: "Violet Lab",
    category: "Fragrance",
    price: 58,
    imageUrl: "https://images.unsplash.com/photo-1541643600914-78b084683601?auto=format&fit=crop&w=1200&q=80",
    features: ["Iris + cedar", "Cool amber", "Long wear"],
    details: "A cool, modern fragrance with a transparent opening and deep, smooth dry-down.",
  },
];

