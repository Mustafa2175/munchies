/**
 * @module config/routes
 * @description Centralised route path constants and dynamic route helpers
 * for the Munchie's platform (customer, auth, and admin areas).
 */

// ─── Customer Routes ─────────────────────────────────────────────────────────

export const ROUTES = {
  /** Public / Customer */
  HOME: '/',
  MENU: '/menu',
  PRODUCT: '/menu/:slug',
  CATEGORY: '/menu/category/:slug',
  CART: '/cart',
  CHECKOUT: '/checkout',
  ORDER_SUCCESS: '/order-success/:id',
  ORDER_TRACKING: '/order/:id',
  TRACK_ORDER: '/track-order',
  ORDERS: '/account/orders',
  ACCOUNT: '/account',
  ACCOUNT_ORDERS: '/account/orders',
  PROFILE: '/account',
  ADDRESSES: '/account/addresses',
  OFFERS: '/offers',
  NOT_FOUND: '/404',

  /** Authentication */
  AUTH: '/auth',
  LOGIN: '/login',
  REGISTER: '/register',
  FORGOT_PASSWORD: '/forgot-password',
  RESET_PASSWORD: '/reset-password',

  /** Admin */
  ADMIN: '/admin',
  ADMIN_DASHBOARD: '/admin/dashboard',
  ADMIN_ORDERS: '/admin/orders',
  ADMIN_ORDER_DETAIL: '/admin/orders/:id',
  ADMIN_MENU: '/admin/menu',
  ADMIN_PRODUCTS: '/admin/menu/products',
  ADMIN_PRODUCT_NEW: '/admin/menu/products/new',
  ADMIN_PRODUCT_EDIT: '/admin/menu/products/:id/edit',
  ADMIN_CATEGORIES: '/admin/menu/categories',
  ADMIN_CATEGORY_NEW: '/admin/menu/categories/new',
  ADMIN_CATEGORY_EDIT: '/admin/menu/categories/:id/edit',
  ADMIN_USERS: '/admin/users',
  ADMIN_USER_DETAIL: '/admin/users/:id',
  ADMIN_STAFF: '/admin/staff',
  ADMIN_STAFF_NEW: '/admin/staff/new',
  ADMIN_STAFF_EDIT: '/admin/staff/:id/edit',
  ADMIN_SETTINGS: '/admin/settings',
  ADMIN_OPERATIONS: '/admin/operations',
  ADMIN_ANALYTICS: '/admin/analytics',
  ADMIN_NOTIFICATIONS: '/admin/notifications',
  ADMIN_AUDIT_LOG: '/admin/audit-log',
  ADMIN_LOGIN: '/admin/login',
} as const;

// ─── Dynamic Route Helpers ───────────────────────────────────────────────────

/**
 * Generate the route for a specific product page.
 * @param slug - The product's URL-friendly slug.
 */
export function getProductRoute(slug: string): string {
  return ROUTES.PRODUCT.replace(':slug', slug);
}

/**
 * Generate the route for a specific category page.
 * @param slug - The category's URL-friendly slug.
 */
export function getCategoryRoute(slug: string): string {
  return ROUTES.CATEGORY.replace(':slug', slug);
}

/**
 * Generate the route for order tracking (customer).
 * @param id - The order ID.
 */
export function getOrderRoute(id: string): string {
  return ROUTES.ORDER_TRACKING.replace(':id', id);
}

/**
 * Generate the route for the order success page.
 * @param id - The order ID.
 */
export function getOrderSuccessRoute(id: string): string {
  return ROUTES.ORDER_SUCCESS.replace(':id', id);
}

/**
 * Generate the admin order detail route.
 * @param id - The order ID.
 */
export function getAdminOrderRoute(id: string): string {
  return ROUTES.ADMIN_ORDER_DETAIL.replace(':id', id);
}

/**
 * Generate the admin product edit route.
 * @param id - The product document ID.
 */
export function getAdminProductEditRoute(id: string): string {
  return ROUTES.ADMIN_PRODUCT_EDIT.replace(':id', id);
}

/**
 * Generate the admin category edit route.
 * @param id - The category document ID.
 */
export function getAdminCategoryEditRoute(id: string): string {
  return ROUTES.ADMIN_CATEGORY_EDIT.replace(':id', id);
}

/**
 * Generate the admin user detail route.
 * @param id - The user document ID.
 */
export function getAdminUserRoute(id: string): string {
  return ROUTES.ADMIN_USER_DETAIL.replace(':id', id);
}

/**
 * Validates that a redirect target is a safe internal relative path (prevents open redirects).
 */
export function getSafeRedirectPath(
  rawRedirect: string | null | undefined,
  fallback: string = ROUTES.HOME
): string {
  if (!rawRedirect) return fallback;
  const trimmed = rawRedirect.trim();
  if (!trimmed.startsWith('/') || trimmed.startsWith('//')) {
    return fallback;
  }
  if (
    trimmed.startsWith(ROUTES.LOGIN) ||
    trimmed.startsWith(ROUTES.REGISTER) ||
    trimmed.startsWith(ROUTES.FORGOT_PASSWORD)
  ) {
    return fallback;
  }
  return trimmed;
}

/**
 * Generate the admin staff edit route.
 * @param id - The staff member document ID.
 */
export function getAdminStaffEditRoute(id: string): string {
  return ROUTES.ADMIN_STAFF_EDIT.replace(':id', id);
}
