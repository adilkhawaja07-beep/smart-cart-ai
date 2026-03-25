/**
 * Application Constants
 * Centralized configuration to avoid magic strings throughout the codebase
 */

// Pricing
export const PRICING = {
  DELIVERY_THRESHOLD: 50,
  BASE_DELIVERY_FEE: 4.99,
  TAX_RATE: 0.08,
} as const;

// Feature flags
export const FEATURES = {
  ENABLE_RECIPES: true,
  ENABLE_ANALYTICS: true,
  ENABLE_INVENTORY_TRACKING: true,
} as const;

// Orders
export const ORDER_STATUSES = ["pending", "processing", "shipped", "delivered", "cancelled"] as const;

export const STATUS_CONFIG = {
  pending: { label: "Pending", color: "text-amber-600", bgColor: "bg-amber-100 text-amber-700" },
  processing: { label: "Processing", color: "text-blue-600", bgColor: "bg-blue-100 text-blue-700" },
  shipped: { label: "Shipped", color: "text-purple-600", bgColor: "bg-purple-100 text-purple-700" },
  delivered: { label: "Delivered", color: "text-primary", bgColor: "bg-primary/10 text-primary" },
  cancelled: { label: "Cancelled", color: "text-destructive", bgColor: "bg-destructive/10 text-destructive" },
} as const;

// Chart configuration
export const CHART_COLORS = [
  "hsl(145, 45%, 32%)",   // Primary green
  "hsl(38, 60%, 55%)",    // Honey yellow
  "hsl(16, 55%, 55%)",    // Warm orange
  "hsl(95, 50%, 50%)",    // Light green
  "hsl(200, 60%, 50%)",   // Blue
  "hsl(270, 50%, 55%)",   // Purple
] as const;

// Storage keys
export const STORAGE_KEYS = {
  CART: "freshcart-cart",
  USER_PREFERENCES: "freshcart-preferences",
} as const;

// API endpoints
export const API_ENDPOINTS = {
  CHAT: (baseUrl: string) => `${baseUrl}/functions/v1/chat`,
} as const;

// Navigation
export const NAV_LINKS = [
  { label: "Shop", href: "/shop" },
  { label: "Categories", href: "/categories" },
  { label: "Deals", href: "/deals" },
  { label: "About", href: "/about" },
] as const;

// Dashboard tabs
export const DASHBOARD_TABS = [
  { key: "overview", label: "Overview" },
  { key: "sales", label: "Sales" },
  { key: "inventory", label: "Inventory" },
  { key: "orders", label: "Orders" },
  { key: "products", label: "Add Products" },
  { key: "manage", label: "Manage" },
  { key: "ai", label: "AI Insights" },
] as const;

export type DashboardTab = (typeof DASHBOARD_TABS)[number]["key"];

// Product defaults
export const PRODUCT_DEFAULTS = {
  UNIT: "each",
  INITIAL_STOCK: 30,
  REORDER_LEVEL: 10,
} as const;

// Image upload
export const IMAGE_UPLOAD = {
  MAX_SIZE: 5 * 1024 * 1024, // 5MB
  TIMEOUT: 60000, // 60 seconds
  ACCEPTED_TYPES: ["image/jpeg", "image/png", "image/webp", "image/gif"],
} as const;
