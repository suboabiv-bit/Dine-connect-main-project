
const imageFiles = import.meta.glob("./*.{png,jpg,jpeg,webp}", {
  eager: true,
  import: "default",
});

const getImage = (keyword) => {
  const key = Object.keys(imageFiles).find((path) =>
    path.toLowerCase().includes(keyword)
  );
  return key ? imageFiles[key] : "";
};

export const CATEGORIES = [
  "Burgers",
  "Pizza",
  "Sides",
  "Drinks",
];

export const DEFAULT_ITEMS = [
  {
    id: 1,
    emoji: "🍔",
    img: getImage("classiccheeseburger"),
    category: "Burgers",
    name: "Classic Cheeseburger",
    description: "Grilled beef patty, cheddar, tomato and garlic aioli.",
    price: 1200,
    available: true,
  },
  {
    id: 2,
    emoji: "🍔",
    img: getImage("crispychicken"),
    category: "Burgers",
    name: "Crispy Chicken Burger",
    description: "Crispy fried chicken, lettuce and spicy mayo.",
    price: 1100,
    available: true,
  },
  {
    id: 3,
    emoji: "🍕",
    img: getImage("margherita"),
    category: "Pizza",
    name: "Margherita Pizza",
    description: "Fresh tomato, mozzarella and basil.",
    price: 1800,
    available: true,
  },
  {
    id: 4,
    emoji: "🍕",
    img: getImage("bbqpizza"),
    category: "Pizza",
    name: "BBQ Chicken Pizza",
    description: "Smoky BBQ chicken with red onion.",
    price: 2100,
    available: true,
  },
  {
    id: 5,
    emoji: "🍟",
    img: getImage("frenchfries"),
    category: "Sides",
    name: "French Fries",
    description: "Hand-cut, double-fried and salted.",
    price: 450,
    available: true,
  },
  {
    id: 6,
    emoji: "🥗",
    img: getImage("freshsalad"),
    category: "Sides",
    name: "Fresh Garden Salad",
    description: "Seasonal greens with lemon dressing.",
    price: 650,
    available: true,
  },
  {
    id: 7,
    emoji: "🥤",
    img: getImage("icedtea"),
    category: "Drinks",
    name: "Iced Tea",
    description: "Chilled lemon iced tea.",
    price: 350,
    available: true,
  },
  {
    id: 8,
    emoji: "🧃",
    img: getImage("freshjuice"),
    category: "Drinks",
    name: "Fresh Juice",
    description: "Seasonal fruit, no added sugar.",
    price: 400,
    available: true,
  },
];

const CATEGORY_EMOJI = {
  burger: "🍔",
  pizza: "🍕",
  side: "🍟",
  drink: "🥤",
};

export const normalizeMenuItems = (items) => items.map((item) => ({
  ...item,
  id: item._id || item.id,
  menuItemId: item._id || item.menuItemId,
  img: item.image || item.img || "",
  emoji: item.emoji || Object.entries(CATEGORY_EMOJI)
    .find(([keyword]) => String(item.category || "").toLowerCase().includes(keyword))?.[1] || "🍽️",
  description: item.description || "",
}));
