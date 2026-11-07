# Munchie's Restaurant Website & Ordering Platform
## Product Blueprint, Functional Requirements & Acceptance Criteria

**Document version:** 1.2  
**Status:** Working baseline — business decisions confirmed  
**Product:** Bilingual restaurant website and online ordering platform  
**Brand direction:** Modern Light, Purple & Yellow  
**Primary market:** Aswan, Egypt  
**Currency:** EGP (LE)

---

## 1. Product Vision

Munchie's will be a bilingual restaurant ordering platform, not just a static digital menu. Customers can discover products, browse categories, customize eligible items, manage a cart, create an account, and submit orders. Restaurant staff manage products, availability, working hours, and incoming orders through an admin dashboard.

### Product goals

- Turn website visitors into customers with a clear, low-friction ordering journey.
- Make menu browsing and product customization easy on mobile and desktop.
- Give restaurant staff control over products, prices, availability, and orders.
- Support Arabic RTL and English LTR from one shared application.
- Keep the platform extensible for delivery zones, online payments, loyalty, and other future capabilities.

### Target customer groups

1. New customers arriving from social media, search, or advertisements.
2. Returning customers who already know what they want.
3. Customers exploring the menu and comparing products.
4. Customers who want to customize eligible sandwiches or meals.
5. Frequent customers who may later benefit from saved addresses and reorder features.

---

## 2. Confirmed Business Decisions

| Area | Confirmed decision |
|---|---|
| Ordering model | Full online ordering |
| Website language | Arabic and English |
| Visual direction | Modern Light |
| Brand colors | Purple and Yellow, used selectively |
| Fulfillment | Delivery and Pickup are intended |
| MVP fulfillment availability | Pickup can launch; Delivery remains unavailable until zones and fees are configured |
| Payment | Cash only in MVP |
| Customer accounts | Registration/login required before checkout |
| Phone verification | No OTP or phone-number verification required |
| Order approval | Manual restaurant approval |
| Delivery pricing | Each delivery zone has its own fee |
| Delivery configuration | Under construction; not ready for customer ordering |
| Cancellation | Customer can cancel before preparation starts; not after status becomes Preparing |
| Working hours | Orders open automatically during configured working hours |
| Manual closure | Admin can manually stop order acceptance at any time |
| Pickup timing | Nearest available time (ASAP); no customer-selected future slot in MVP |

**Important distinction:** Delivery is part of the intended product architecture, but must not be represented as available at launch until delivery zones, fees, and the delivery checkout flow have been configured and tested.

---

## 3. Product Scope and Sitemap

### 3.1 Customer website

| Page | Route | Purpose |
|---|---|---|
| Home | `/` | Introduce the restaurant, highlight categories, best sellers, and offers |
| Menu | `/menu` | Browse, search, filter, and select products |
| Offers | `/offers` | Display active promotions and combos |
| Product Details | `/product/:slug` | Show product details, options, and additions |
| Build Your Own | `/build-your-own` | Future interactive sandwich builder |
| Cart | `/cart` | Review items, quantities, and totals |
| Login | `/login` | Customer authentication |
| Register | `/register` | Customer account creation |
| Forgot Password | `/forgot-password` | Account recovery |
| Checkout | `/checkout` | Select fulfillment, provide details, and submit order |
| Order Confirmation | `/order/:id` | Show successful order submission and order number |
| Order Tracking | `/track-order/:id` | Show order status and timeline |
| Account | `/account` | Manage profile, addresses, and orders |
| Order History | `/account/orders` | View previous orders |
| About | `/about` | Restaurant story and gallery |
| Contact | `/contact` | Branch location and contact details |

### 3.2 Admin dashboard

| Section | Purpose |
|---|---|
| Overview | Daily sales, order counts, and operational summary |
| Orders | Receive, review, accept/reject, and update orders |
| Products | Create and manage products, prices, photos, and availability |
| Categories | Manage menu categories and ordering |
| Ingredients & Additions | Configure product options and additional charges |
| Offers & Coupons | Manage promotions and coupon rules |
| Delivery Zones | Future configuration of zones and fees |
| Customers | View customer records where operationally appropriate |
| Reports | Sales, orders, and product performance |
| Restaurant Operations | Working hours and manual order-acceptance control |
| Settings | Restaurant details, languages, contact information, and permissions |
| Audit Log | Record sensitive administrative actions |

---

## 4. User Experience and Design System

### 4.1 Visual direction

Use a clean, premium light interface. The existing purple and yellow identity should remain recognizable without copying the menu artwork directly.

Suggested starting palette:

| Token | Color | Usage |
|---|---|---|
| Primary Purple | `#512080` | Brand, navigation accents, key sections |
| Brand Yellow | `#FFDA35` | Primary highlights and selected calls to action |
| Warm Cream | `#FFF8E9` | Optional warm backgrounds |
| Dark Text | `#26212B` | Main typography |
| White | `#FFFFFF` | Main surfaces |
| Light Gray | `#F5F3F7` | Secondary surfaces |
| Success | `#27834B` | Success states |
| Danger | `#E84D45` | Errors and destructive actions |

These are proposed design tokens and can be refined during visual design.

### 4.2 Typography

- Arabic: IBM Plex Sans Arabic or Alexandria.
- English: Outfit or Plus Jakarta Sans.
- Use clear hierarchy, readable body text, and strong but restrained headings.

### 4.3 UI components

- Responsive navigation and mobile menu.
- Language switcher.
- Product and category cards.
- Product badges (Best Seller, New, Offer).
- Search and filter controls.
- Quantity selector.
- Customization groups and option selectors.
- Cart drawer and cart page.
- Checkout forms and order summary.
- Status badges and order timeline.
- Confirmation dialogs.
- Toast notifications.
- Loading skeletons, empty states, and error states.

### 4.4 Responsive and localization rules

- Design mobile-first.
- Support RTL and LTR across the entire layout, not only text alignment.
- Changing language must not clear the cart or checkout data.
- Product names and descriptions should have Arabic and English values.
- Use EGP as the currency.
- Ensure phone numbers and numeric values remain readable in both directions.
- Review directional icons and animations in RTL.

---

## 5. Customer Website — Page Requirements and Wireframes

## 5.1 Home

**Route:** `/`  
**Priority:** P0

### Sections

1. Announcement bar for promotions or operational notices.
2. Navigation: logo, Home, Menu, Offers, About, language switcher, cart, and Order Now.
3. Hero with a strong headline, prominent food photography, and clear calls to action.
4. Shop by Category.
5. Best Sellers (4–6 products).
6. Active Special Offers.
7. Build Your Own promotional section, only when the feature is enabled.
8. Restaurant differentiators, using only claims confirmed by the restaurant.
9. Branch location and contact details.
10. Footer with navigation and social links.

### Content direction

Possible English headline: **Your Cravings, Our Specialty.**  
Possible Arabic headline: **مزاجك للأكل؟ إحنا جاهزين!**

### Desktop wireframe

```text
+------------------------------------------------------+
| Announcement: Special Offers                         |
+------------------------------------------------------+
| LOGO | Home | Menu | Offers | About | Language | Cart|
+------------------------------------------------------+
| YOUR CRAVINGS, OUR SPECIALTY       | LARGE FOOD IMAGE |
| Supporting text                   |                  |
| [Explore Menu] [Order Now]         |                  |
+------------------------------------------------------+
|                  SHOP BY CATEGORY                    |
| [Burgers] [Sandwiches] [Fries] [Fat Burger] [VIP]    |
+------------------------------------------------------+
|                    BEST SELLERS                       |
| [Product Card] [Product Card] [Product Card] [More]  |
+------------------------------------------------------+
|                    SPECIAL OFFERS                     |
|                  [PROMOTIONAL BANNER]                 |
+------------------------------------------------------+
|                 BUILD YOUR OWN                        |
+------------------------------------------------------+
|             RESTAURANT DIFFERENTIATORS                 |
+------------------------------------------------------+
|                 BRANCH LOCATION                       |
+------------------------------------------------------+
|                       FOOTER                           |
+------------------------------------------------------+
```

### Acceptance criteria

- Customer can reach the menu from the main navigation and hero.
- Best sellers and offers are populated from active admin-managed content.
- Unavailable products cannot be added to cart.
- Mobile layout remains usable without horizontal overflow.
- Language switching preserves cart state.

## 5.2 Menu

**Route:** `/menu`  
**Priority:** P0

### Initial category structure

- Burgers
- Sandwiches
- Fat Burger
- VIP Menu
- Hot Dogs
- Fries (Cup & Cono)
- Additions

The Protein Menu needs confirmation: it may be a standalone category or nutritional information attached to products.

### Page elements

- Page title and introduction.
- Search by Arabic or English product name.
- Category navigation.
- Optional filters and sorting.
- Product grid.
- Cart indicator or cart drawer.

### Product card

```text
+------------------------------+
|                              |
|         PRODUCT IMAGE        |
|                              |
|  BEST SELLER                 |
+------------------------------+
|  Product Name                |
|  Short description           |
|                              |
|  140 LE           [ADD]      |
+------------------------------+
```

### Acceptance criteria

- Only active categories and available products are shown.
- Search supports Arabic and English names.
- Selecting a category filters the product list.
- Sorting and filters can be cleared.
- Product price and availability are retrieved from trusted backend data.
- Products requiring choices open customization before being added.
- Products requiring no choices can be added directly.

## 5.3 Product Details

**Route:** `/product/:slug`  
**Priority:** P0

### Elements

- Product image/gallery.
- Product name and description.
- Ingredients.
- Base price.
- Product-specific customization groups.
- Additions and extra charges.
- Quantity selector.
- Special instructions, if enabled.
- Add to Cart.
- Related products.

### Acceptance criteria

- Only options configured for that product are displayed.
- Required choices must be completed.
- Price updates when valid additions are selected.
- Quantity must be at least one.
- Backend revalidates all options and prices during order submission.

## 5.4 Offers

**Route:** `/offers`  
**Priority:** P0 if offers are available

Possible future promotion concepts (not confirmed existing offers):

- Burger Combo.
- Duo Meal.
- Family Box.
- Student Deal.

Each offer should support:

- Arabic and English title and description.
- Included products and quantities.
- Price or discount rule.
- Start and end dates.
- Active/inactive status.
- Optional usage limits and minimum order.

### Acceptance criteria

- Expired or inactive offers are not displayed as orderable.
- Discount rules are validated on the backend.
- Offer price and included items are shown clearly.
- Admin can activate, deactivate, and edit offers.

## 5.5 Build Your Own

**Route:** `/build-your-own`  
**Priority:** P2 / Future

Proposed steps:

1. Choose main ingredient.
2. Choose bread.
3. Choose toppings.
4. Choose sauces and extras.
5. Review the creation and price.
6. Add to cart.

This feature must only expose ingredients, combinations, and prices approved by the restaurant. Do not invent available ingredients or allow invalid combinations.

## 5.6 Cart

**Route:** `/cart`  
**Priority:** P0

### Elements

- Product image and name.
- Selected options and additions.
- Quantity controls.
- Remove action.
- Subtotal.
- Delivery fee when Delivery is enabled.
- Valid discounts.
- Final total.
- Checkout action.

### Acceptance criteria

- Customer can update quantities and remove items.
- Different customization combinations are represented separately when needed.
- Cart survives page refresh and browser reopening.
- Cart survives login/register redirect.
- Prices and availability are revalidated before order creation.
- If a product or price changes, customer is informed and must review the updated total.

## 5.7 Login and Registration

**Routes:** `/login`, `/register`, `/forgot-password`  
**Priority:** P0

### Registration fields

- Full Name.
- Mobile Number.
- Email Address.
- Password.
- Confirm Password.

### Authentication decisions

- No OTP.
- No phone-number verification.
- Email/password authentication.
- Validate email and phone formats.
- Prevent duplicate accounts according to the configured unique identifiers.
- Provide password recovery.
- Protect customer-specific routes.

### Acceptance criteria

- A valid customer can register without OTP.
- Invalid fields show understandable errors.
- Passwords are never stored in plaintext.
- A logged-out customer attempting checkout is redirected to login/register.
- After successful authentication, the customer returns to the intended checkout flow with the cart preserved.

## 5.8 Checkout

**Route:** `/checkout`  
**Priority:** P0 for Pickup; Delivery remains disabled until configuration is complete.

### Step 1 — Fulfillment

- Pickup: available for MVP.
- Delivery: disabled until delivery zones and fees are configured and tested.

### Step 2 — Customer details

Use the authenticated customer's profile, allowing corrections where appropriate.

### Step 3 — Pickup details

- Show branch address.
- Show nearest available pickup timing (ASAP).
- Do not ask the customer to select a future time slot in MVP.

### Step 4 — Payment

- Cash at Pickup.
- Cash on Delivery only when Delivery is enabled.

### Step 5 — Order summary

- Items and quantities.
- Additions.
- Subtotal.
- Applicable delivery fee.
- Discount.
- Final total.

### Step 6 — Submit

- Place Order.
- Show confirmation and order number after successful backend creation.

### Acceptance criteria

- Checkout requires login.
- Pickup does not include a delivery fee.
- Delivery cannot be submitted while delivery configuration is unavailable.
- Only Cash payment is offered in MVP.
- Backend calculates and validates the final price.
- Repeated submission does not create duplicate orders.
- Cart is cleared only after successful order creation.

## 5.9 Order Confirmation, Tracking, and History

**Routes:** `/order/:id`, `/track-order/:id`, `/account/orders`

### Customer capabilities

- View order ID.
- View items and total.
- View payment method and payment status.
- View fulfillment type.
- View current status and timeline.
- View past orders.

### Acceptance criteria

- Customers can only access their own orders.
- Status changes are reflected without requiring manual refresh.
- Each status transition is recorded.
- Order history preserves original prices and item details.
- Customer cancellation is available only before preparation starts.

## 5.10 About and Contact

**Routes:** `/about`, `/contact`

Content:

- Restaurant story and brand identity.
- Food gallery.
- Branch location.
- Phone and social media.
- Working hours.

Known menu details to verify before publishing:

- Location: حديقة الورد أمام الراية – فرع الكورنيش.
- Phone: `01025707026`.

---

## 6. Admin Dashboard Requirements

**Route:** `/admin`  
**Priority:** P0

### 6.1 Admin access and roles

Suggested roles:

- Super Admin: full access.
- Manager: operational and menu management permissions.
- Order Operator: order processing permissions.

Acceptance criteria:

- Dashboard requires authenticated, authorized access.
- Role permissions are enforced by the backend, not just hidden UI controls.
- Sensitive actions are recorded in an audit log.

### 6.2 Overview

Display:

- Orders today.
- Completed orders.
- Pending orders.
- Revenue from completed and paid orders.
- Best-selling products.
- Recent orders.
- Sales chart.

### 6.3 Orders Management

Admin capabilities:

- View new orders in real time.
- Filter by status, date, and fulfillment type.
- Search by order ID or customer phone.
- Open full order details.
- Accept or reject pending orders.
- Record rejection reason.
- Move accepted orders through valid statuses.
- Record cash payment after receiving it.
- Print or display kitchen-friendly order details.

Acceptance criteria:

- New orders appear as Pending.
- Accept changes status to Confirmed.
- Reject requires a reason.
- Preparing prevents customer cancellation.
- Pickup cannot transition to Out for Delivery.
- Completed orders cannot be casually reopened.
- All transitions are recorded with actor and timestamp.
- New-order notifications do not create duplicate records.

### 6.4 Products Management

Admin can:

- Create, edit, archive, and activate products.
- Change prices.
- Upload and replace images.
- Manage Arabic and English names/descriptions.
- Assign categories.
- Configure ingredients and customization groups.
- Mark Best Seller or New.
- Control availability.

Acceptance criteria:

- Saved changes appear on the customer website.
- Archived products are not orderable.
- Price changes do not alter historical order snapshots.
- Invalid customization combinations are rejected.

### 6.5 Categories Management

Admin can:

- Create and edit categories.
- Upload category images.
- Reorder categories.
- Activate/deactivate categories.

### 6.6 Ingredients and Additions

Admin can:

- Create additions.
- Set prices.
- Set availability.
- Associate additions with eligible products or customization groups.
- Define required, optional, single-select, or multi-select behavior.

### 6.7 Offers and Coupons

Support:

- Fixed discounts.
- Percentage discounts.
- Product-specific offers.
- Minimum order values.
- Start/end dates.
- Usage limits.
- Active/inactive states.

All discount calculations must be validated on the backend.

### 6.8 Delivery Zones — Future Activation

Delivery configuration is currently under construction.

Planned fields:

| Field | Purpose |
|---|---|
| Zone ID | Unique identifier |
| Name AR / EN | Localized zone name |
| Delivery Fee | Zone-specific fee |
| Active | Availability |
| Minimum Order | Optional threshold |
| Estimated Time | Optional estimate |

Acceptance criteria before activation:

- Admin can create, edit, and disable zones.
- Each zone has its own fee.
- Only active zones are selectable.
- No delivery order can be submitted without a valid active zone and fee.
- Delivery must remain unavailable until all configuration and tests are complete.

### 6.9 Restaurant Operations — Working Hours and Manual Closure

This module controls whether the website accepts new orders.

#### Automatic schedule

Admin configures opening and closing times for each day of the week.

#### Manual override

Admin can manually close order acceptance at any time, including during normal working hours.

#### Availability rules

1. Outside working hours: order acceptance is closed.
2. During working hours: order acceptance is open unless manually closed.
3. Manual closure overrides the schedule.
4. Existing orders continue processing after new-order acceptance is closed.
5. Customers can still browse the menu when ordering is closed.
6. The site displays a clear closed message and next opening time where available.

Acceptance criteria:

- Schedule uses `Africa/Cairo`.
- Opening and closing times work across midnight.
- Admin can manually close ordering.
- Admin can reopen ordering manually when appropriate.
- Manual closure expires at the next scheduled opening unless explicitly configured otherwise.
- The backend rejects new orders while closed, even if a customer has an old checkout page open.
- Closing the restaurant does not cancel accepted orders.

### 6.10 Reports

- Sales by date range.
- Order count by status.
- Fulfillment breakdown.
- Best-selling products.
- Export CSV/Excel.

Revenue reporting must distinguish created orders from completed and paid orders.

---

## 7. Functional Requirements and Acceptance Criteria

| ID | Requirement | Acceptance criteria |
|---|---|---|
| FR-001 | Customer registration | Valid unique account can be created without OTP |
| FR-002 | Login/logout | Valid credentials grant access; logout ends session |
| FR-003 | Password recovery | Secure, time-limited recovery |
| FR-004 | Customer profile | Customer can update profile and addresses |
| FR-005 | Authenticated checkout | Checkout cannot be submitted anonymously |
| FR-006 | Public browsing | Menu and products are accessible without login |
| FR-007 | Bilingual content | Arabic and English content are supported |
| FR-008 | Product listing | Only active, available products are orderable |
| FR-009 | Search | Arabic and English product search works |
| FR-010 | Categories | Active categories filter products correctly |
| FR-011 | Product details | Details and eligible options are displayed |
| FR-012 | Customization | Required selections are validated |
| FR-013 | Cart | Items and quantities can be managed |
| FR-014 | Cart persistence | Cart survives refresh and authentication redirect |
| FR-015 | Price validation | Backend recalculates totals |
| FR-016 | Pickup | Pickup is available without delivery fee |
| FR-017 | Delivery | Disabled until zones and fees are configured |
| FR-018 | Cash payment | Cash is the only MVP payment method |
| FR-019 | Order creation | Unique order created once after validation |
| FR-020 | Manual approval | New order remains Pending until staff acts |
| FR-021 | Order rejection | Rejection requires a reason |
| FR-022 | Order tracking | Customer sees current status and timeline |
| FR-023 | Cancellation | Customer cancellation stops when Preparing begins |
| FR-024 | Admin product management | Authorized staff can manage menu data |
| FR-025 | Admin order management | Staff can review and update orders |
| FR-026 | Working hours | Schedule controls order acceptance automatically |
| FR-027 | Manual closure | Admin can override schedule and close ordering |
| FR-028 | Notifications | Customer and admin receive relevant updates |
| FR-029 | Historical snapshots | Old orders preserve original prices and item details |
| FR-030 | Audit log | Sensitive admin actions are recorded |

---

## 8. Order Lifecycle and State Machine

### Order statuses

| Status | Meaning |
|---|---|
| Pending | Waiting for restaurant approval |
| Confirmed | Accepted by restaurant |
| Preparing | Kitchen has started preparation |
| Ready | Ready for pickup or dispatch |
| Out for Delivery | Delivery order is on its way |
| Completed | Delivered or collected |
| Rejected | Rejected by restaurant |
| Cancelled | Cancelled under the cancellation rules |

### Valid flow

```text
PENDING
  ├── CONFIRMED
  │     └── PREPARING
  │            └── READY
  │                  ├── PICKUP → COMPLETED
  │                  └── DELIVERY → OUT FOR DELIVERY → COMPLETED
  ├── REJECTED
  └── CANCELLED

CONFIRMED → CANCELLED is permitted before Preparing begins.
PREPARING → customer cancellation is not permitted.
```

### Cancellation acceptance criteria

- Customer can cancel while Pending.
- Customer can cancel while Confirmed, provided Preparing has not started.
- Customer cannot cancel from Preparing onward.
- Cancellation requires confirmation.
- Cancellation is validated atomically on the backend to prevent a race with the Preparing transition.
- Admin cancellation, where permitted, requires a reason and audit entry.

### Payment status

Payment status is independent from order status:

- Unpaid.
- Paid.

An order is not marked Paid merely because it was submitted or accepted. Authorized staff record payment after receiving cash.

---

## 9. Business Rules

| ID | Rule |
|---|---|
| BR-001 | Registration is mandatory before checkout |
| BR-002 | Phone OTP is not required |
| BR-003 | Browsing does not require registration |
| BR-004 | Cash is the only MVP payment method |
| BR-005 | New orders start as Pending |
| BR-006 | Restaurant approval is manual |
| BR-007 | Pickup has no delivery fee |
| BR-008 | Delivery requires an active configured zone |
| BR-009 | Each delivery zone has its own fee |
| BR-010 | Delivery remains disabled until configured |
| BR-011 | Backend is the source of truth for prices and discounts |
| BR-012 | Historical orders preserve price snapshots |
| BR-013 | Customer cancellation is blocked once Preparing starts |
| BR-014 | Working hours automatically control order acceptance |
| BR-015 | Manual closure overrides the working-hours schedule |
| BR-016 | Existing accepted orders continue after new-order acceptance closes |
| BR-017 | Pickup uses the nearest available time (ASAP) |
| BR-018 | Pickup does not offer customer-selected future time slots in MVP |
| BR-019 | Payment is marked Paid only after cash is received and recorded |

---

## 10. Non-Functional Requirements

| ID | Requirement | Acceptance criteria |
|---|---|---|
| NFR-001 | Responsive design | Works on mobile, tablet, and desktop |
| NFR-002 | Performance | Optimized images and efficient page loading |
| NFR-003 | Security | Authentication, authorization, and data access are enforced server-side |
| NFR-004 | Reliability | Orders are persisted safely |
| NFR-005 | Realtime | Order updates appear without manual refresh |
| NFR-006 | Accessibility | Keyboard navigation, labels, contrast, and accessible controls |
| NFR-007 | Localization | Correct RTL/LTR behavior |
| NFR-008 | Scalability | Supports additional products, categories, and zones |
| NFR-009 | Data integrity | No duplicate orders or corrupted totals |
| NFR-010 | Auditability | Sensitive actions are traceable |
| NFR-011 | Timezone | Operational schedule uses `Africa/Cairo` |
| NFR-012 | Privacy | Customers can only access their own account and orders |

### Critical edge cases

- Double-clicking Place Order must not create duplicate orders.
- Network interruption during submission must not cause duplicate creation on retry.
- Price changes during checkout must trigger revalidation and customer review.
- Product becoming unavailable during checkout must block submission.
- Restaurant closing while checkout is open must block new order creation.
- Customer cancellation racing with the Preparing transition must be resolved atomically.
- Manual closure must not stop processing existing orders.
- Day schedules crossing midnight must be evaluated correctly.
- Delivery requests must be blocked while zone configuration is incomplete.

---

## 11. Technical Architecture

### Recommended stack

| Layer | Technology |
|---|---|
| Frontend | React + Vite + TypeScript |
| Styling | Tailwind CSS |
| Routing | React Router |
| Backend | Firebase Cloud Functions |
| Database | Cloud Firestore |
| Authentication | Firebase Authentication |
| Images | Firebase Storage |
| Hosting | Firebase Hosting |
| Realtime updates | Firestore listeners |
| Notifications | In-app notifications; optional FCM |

### Proposed data collections

| Collection | Main purpose |
|---|---|
| `users` | Customer and admin profiles |
| `addresses` | Saved customer addresses |
| `products` | Product catalog |
| `categories` | Menu categories |
| `ingredients` | Ingredients and additions |
| `customizationGroups` | Product-specific options |
| `deliveryZones` | Future delivery configuration |
| `orders` | Order records and snapshots |
| `orderEvents` | Status history |
| `offers` | Promotions |
| `coupons` | Discount codes |
| `notifications` | User notifications |
| `settings` | Restaurant settings |
| `adminUsers` | Admin roles and permissions |
| `auditLogs` | Sensitive administrative activity |

### Product record example

```ts
{
  id: "munchies-beef",
  name: {
    ar: "مانشيز بيف",
    en: "Munchies Beef"
  },
  description: {
    ar: "...",
    en: "..."
  },
  price: 140,
  image: "...",
  categoryId: "burgers",
  isAvailable: true,
  isBestSeller: true,
  isNew: false,
  customizationGroups: [],
  createdAt: "...",
  updatedAt: "..."
}
```

### Order record example

```ts
{
  orderId: "ORD-1024",
  customerId: "...",
  customerSnapshot: {
    name: "...",
    phone: "..."
  },
  items: [],
  orderType: "pickup",
  addressSnapshot: null,
  paymentMethod: "cash",
  paymentStatus: "unpaid",
  subtotal: 0,
  deliveryFee: 0,
  discount: 0,
  total: 0,
  status: "pending",
  createdAt: "...",
  updatedAt: "..."
}
```

### Security requirements

- Never trust prices or discounts sent by the browser.
- Calculate totals in trusted backend code.
- Enforce customer ownership of orders.
- Enforce admin roles on the backend.
- Do not allow customers to write arbitrary order statuses.
- Use atomic transactions or equivalent concurrency controls for order submission and cancellation.
- Preserve product, address, and fee snapshots on orders.
- Do not store plaintext passwords or payment-card data.
- Protect sensitive admin actions with audit records.

**Deployment note:** Firebase Cloud Functions and other production capabilities may require the Blaze plan. Estimate costs and configure billing alerts before launch.

---

## 12. MVP and Future Releases

### MVP — Launch requirements

- Bilingual Home and Menu.
- Product details and eligible customization.
- Registration and login without OTP.
- Cart persistence.
- Pickup checkout.
- Cash at Pickup.
- Manual order approval.
- Admin order management.
- Order status tracking.
- Customer cancellation before Preparing.
- Working-hours automation.
- Manual order-acceptance closure.
- Product and category management.
- Basic customer account and order history.
- Core notifications.
- Security and end-to-end testing.

### Phase 2

- Delivery zone configuration.
- Zone-specific delivery fees.
- Delivery address selection.
- Delivery checkout.
- Cash on Delivery.
- Delivery-specific status flow.
- Delivery reports.

### Future enhancements

- Online payments.
- Build Your Own Sandwich.
- Loyalty and rewards.
- Customer reorder.
- Advanced analytics.
- Scheduled pickup.
- Advanced delivery tracking.
- Marketing automation.

---

## 13. Release Acceptance Scenario

The MVP is not ready merely because the pages look complete. The following end-to-end scenario must pass:

1. Customer registers without OTP.
2. Customer browses the menu.
3. Customer selects a product and valid additions.
4. Customer adds the product to the cart.
5. Customer logs in if not already authenticated.
6. Cart remains intact.
7. Customer selects Pickup.
8. System shows ASAP as the pickup timing.
9. Customer selects Cash at Pickup.
10. Backend validates products, options, and prices.
11. Customer submits the order.
12. Exactly one order is created with Pending status.
13. Admin receives the new-order notification.
14. Admin accepts the order.
15. Customer sees Confirmed.
16. Admin starts preparation.
17. Customer can no longer cancel.
18. Admin marks the order Ready.
19. Customer is notified.
20. Customer collects the order.
21. Admin records cash received and marks payment Paid.
22. Admin marks the order Completed.

The release must also pass tests for restaurant closure, duplicate submissions, price changes, unavailable products, and unauthorized access.

---

## 14. Outstanding Business Inputs

The following details must be collected before the corresponding features are activated:

| Input | Status |
|---|---|
| Exact working hours for each day | To be provided |
| Delivery zone names and fees | Under construction |
| Final product names and prices | Must be verified against the restaurant's current menu |
| Product images | Restaurant assets required |
| Product-specific additions and prices | To be confirmed |
| Cancellation policy wording | To be approved |
| Final branch address and map pin | To be verified |
| Restaurant-approved claims and brand story | To be provided |
| Pickup preparation-time estimate | Optional; needs operational input |

---

## 15. Recommended Implementation Sequence

1. Finalize and verify product catalog data.
2. Approve the visual design system.
3. Design Home, Menu, Product Details, Login/Register, Cart, and Checkout.
4. Design the Admin Orders and Restaurant Operations screens.
5. Implement database and authentication.
6. Implement product and category management.
7. Implement cart and secure checkout.
8. Implement manual order approval and status management.
9. Implement working-hours schedule and manual closure.
10. Implement customer tracking and notifications.
11. Perform security, responsive, localization, and end-to-end tests.
12. Launch Pickup MVP.
13. Activate Delivery only after zone configuration and full testing.

---

**Document owner:** Munchie's Website Project  
**Current baseline:** Version 1.2  
**Next design milestone:** Admin Dashboard Wireframes — Orders Management and Restaurant Operations.
