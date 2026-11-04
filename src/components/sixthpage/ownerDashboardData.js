import gardenBowlImage from "../thirdpage/freshsalad.png";
import chickenImage from "../thirdpage/crispychickenburger.png";
import burgerImage from "../thirdpage/classiccheeseburger.png";
import pizzaImage from "../thirdpage/margheritapizza.png";

export const ownerDemoData = {
  metrics: [
    { label: "Total sales", value: "Rs. 1,284,500", caption: "All-time demo revenue", icon: "↗" },
    { label: "Today's sales", value: "Rs. 48,250", caption: "Demo sales for today", icon: "◷" },
    { label: "Total orders", value: "1,248", caption: "Orders in sample data", icon: "≡" },
    { label: "Food items sold", value: "3,672", caption: "Units across all orders", icon: "✣" },
  ],
  dailySales: [
    { label: "Mon", amount: 32800 },
    { label: "Tue", amount: 41200 },
    { label: "Wed", amount: 36750 },
    { label: "Thu", amount: 48900 },
    { label: "Fri", amount: 52600 },
    { label: "Sat", amount: 68400 },
    { label: "Sun", amount: 48250 },
  ],
  monthlySales: [
    { label: "Jan", amount: 482000 },
    { label: "Feb", amount: 536000 },
    { label: "Mar", amount: 498000 },
    { label: "Apr", amount: 612000 },
    { label: "May", amount: 584000 },
    { label: "Jun", amount: 691000 },
  ],
  bestSellers: [
    { name: "Garden Harvest Bowl", quantity: 286, revenue: 257400, image: gardenBowlImage },
    { name: "Chargrilled Chicken", quantity: 241, revenue: 313300, image: chickenImage },
    { name: "Classic Beef Burger", quantity: 198, revenue: 217800, image: burgerImage },
    { name: "Wood-fired Margherita", quantity: 176, revenue: 193600, image: pizzaImage },
  ],
  recentOrders: [
    { number: "#1048", table: "T-04", items: "Garden Harvest Bowl, Lemonade", quantity: 3, total: 4850, date: "Today, 12:42 PM", status: "Completed" },
    { number: "#1047", table: "T-08", items: "Chargrilled Chicken, Fries", quantity: 2, total: 3900, date: "Today, 12:18 PM", status: "Preparing" },
    { number: "#1046", table: "T-02", items: "Beef Burger, Iced Tea", quantity: 2, total: 2750, date: "Today, 11:56 AM", status: "Ready" },
    { number: "#1045", table: "T-06", items: "Margherita Pizza", quantity: 1, total: 1100, date: "Today, 11:34 AM", status: "Completed" },
    { number: "#1044", table: "T-01", items: "Harvest Bowl, Soup", quantity: 2, total: 2450, date: "Today, 11:09 AM", status: "Completed" },
  ],
};