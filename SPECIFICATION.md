# TeamOmnifield — Complete Functional & Technical Specification

**Version:** 1.0  
**Evaluation:** Full Stack Development — Harsha & Thinesh  
**Application:** TeamOmnifield  
**Client storefront:** HTRestaurantErode / htrestaurant.com  
**Owner fulfillment:** admin.htrestaurant.com  
**System domain:** teamomnifield.ai  
**Runtime:** ASP.NET Core MVC on .NET 10  
**Database:** PostgreSQL  
**Deployment target:** Fully containerized local machine

## 1. Purpose

Build a realistic restaurant order-management web application that demonstrates end-to-end full-stack ability: responsive UI, MVC, C#, EF Core, PostgreSQL, validation, authentication/authorization, business workflows, REST endpoints, testing, Docker, reverse proxying and operational diagnostics.

The customer-facing site accepts restaurant orders. The restaurant owners use a protected admin site to view, confirm, prepare and fulfill those orders. TeamOmnifield provides a central operational dashboard and demonstrates that the application can serve multiple hostnames from one containerized application.

## 2. Scope

### In scope

- Restaurant storefront
- Menu/category/product management
- Shopping cart
- Checkout and order creation
- Order number generation
- Order status workflow
- Admin authentication
- Admin order queue and order details
- Admin product CRUD
- Operational dashboard
- Host-based application behavior
- PostgreSQL persistence
- EF Core
- API health endpoint
- Docker Compose orchestration
- Nginx reverse proxy
- Automated unit tests
- Seed data
- Validation and error handling

### Out of scope for MVP

- Real payment gateway
- Real SMS/WhatsApp provider
- Real email provider
- Live GPS tracking
- Driver mobile application
- Multi-restaurant tenancy
- Production TLS certificates
- Cloud deployment
- Real customer accounts

These can be extension tasks.

## 3. User roles

### Customer

Unauthenticated user who can browse menu, maintain a cart and submit an order.

### Restaurant Admin

Authenticated owner/operator who can manage products and process orders.

### TeamOmnifield Operator

For MVP this is represented by the same local admin account. Future versions may introduce separate roles and claims.

## 4. Hostnames

| Host | Purpose | Authentication |
|---|---|---|
| `htrestaurant.com` | Customer ordering site | No login |
| `admin.htrestaurant.com` | Owner fulfillment console | Required |
| `teamomnifield.ai` | Central operational dashboard | Local admin login for sensitive views |

For local testing all three resolve to `127.0.0.1` through the hosts file and are served by Nginx on port 8080.

## 5. Customer features

### 5.1 Home page

- Restaurant branding
- Hero/banner
- Opening/ordering message
- Call-to-action to view menu
- Highlights

### 5.2 Menu

- Categories
- Product name
- Description
- Price
- Availability
- Image URL placeholder
- Add-to-cart action

### 5.3 Cart

- Product lines
- Quantity increase/decrease
- Remove item
- Subtotal
- Delivery fee
- Grand total
- Empty-cart state

### 5.4 Checkout

Required:
- Customer name
- Phone
- Delivery address

Optional:
- Notes

Rules:
- At least one cart item
- Quantity >= 1
- Product must still be active/available
- Price is read from the server/database, never trusted from the browser
- Order total is calculated server-side
- Order is persisted transactionally

### 5.5 Order confirmation

Display:
- Order number
- Customer name
- Items
- Total
- Current status
- Timestamp

## 6. Admin features

### 6.1 Login

- Email/password
- Cookie authentication
- Unauthorized users redirected to login
- Logout

### 6.2 Dashboard

Display:
- Pending orders
- Preparing orders
- Ready orders
- Delivered orders
- Cancelled orders
- Today's order count
- Today's sales total

### 6.3 Order queue

Columns:
- Order number
- Customer
- Phone
- Total
- Created time
- Status
- Action

Filters:
- Status
- Search by order number/customer/phone

### 6.4 Order detail

Display all customer and item information.

Admin can transition status using allowed transitions.

Allowed transitions:

```text
Pending -> Confirmed | Cancelled
Confirmed -> Preparing | Cancelled
Preparing -> Ready | Cancelled
Ready -> OutForDelivery | Cancelled
OutForDelivery -> Delivered | Cancelled
Delivered -> terminal
Cancelled -> terminal
```

## 7. Product management

Admin can:
- Create product
- Edit product
- Activate/deactivate product
- Change price
- Change category
- Change description

Delete is intentionally avoided for the MVP so historical order items are never accidentally invalidated.

## 8. TeamOmnifield dashboard

The `teamomnifield.ai` host shows:
- Application name
- Environment
- Database health
- Total orders
- Pending orders
- Today's revenue
- Current operational statuses
- Links to storefront/admin

Sensitive operational data should require authentication in a production deployment. For evaluation, the dashboard can be visited after admin login.

## 9. Data model

### Category

- Id
- Name
- DisplayOrder
- IsActive

### Product

- Id
- CategoryId
- Name
- Description
- Price
- IsAvailable
- CreatedUtc
- UpdatedUtc

### Order

- Id
- OrderNumber
- CustomerName
- Phone
- DeliveryAddress
- Notes
- Status
- Subtotal
- DeliveryFee
- Total
- CreatedUtc
- UpdatedUtc

### OrderItem

- Id
- OrderId
- ProductId nullable
- ProductNameSnapshot
- UnitPrice
- Quantity
- LineTotal

`ProductNameSnapshot` and `UnitPrice` preserve historical order data if a product is later edited.

### AdminUser

- Id
- Email
- PasswordHash
- DisplayName
- IsActive
- CreatedUtc

## 10. Business rules

1. Order numbers are unique.
2. Product price is calculated from the database.
3. Delivery fee is configurable in application configuration and defaults to 40.
4. Order totals are calculated on the server.
5. A customer cannot create an empty order.
6. Unavailable products cannot be ordered.
7. Admin cannot make an invalid status transition.
8. Delivered and Cancelled orders are terminal.
9. Order history remains after product changes.
10. All timestamps are stored in UTC.

## 11. API requirements

Minimum endpoints:

- `GET /health`
- `GET /api/orders/{orderNumber}`

Future endpoints:

- `GET /api/products`
- `POST /api/orders`
- `PUT /api/admin/orders/{id}/status`

## 12. Security requirements

- Cookie authentication for admin
- Password hashing using framework-supported password hashing
- `[Authorize]` on admin controllers
- Anti-forgery validation for MVC POST forms
- Server-side model validation
- Do not store plaintext passwords
- Do not trust browser-supplied prices
- Do not commit production secrets
- Use environment variables for database configuration

## 13. Architecture

```text
Presentation
  Controllers + Razor Views + CSS/JS
       |
Application
  Services / business rules / DTOs
       |
Infrastructure
  EF Core DbContext + PostgreSQL
       |
PostgreSQL container
```

The controller layer should remain thin. Business rules belong in services, not Razor views or controllers. This follows the separation-of-concerns guidance in ASP.NET Core MVC. citeturn0search4turn0search0

## 14. Container architecture

Services:

1. `web` — ASP.NET Core MVC
2. `postgres` — PostgreSQL 18
3. `nginx` — reverse proxy and local hostname routing

Network:
- private Docker network for service-to-service communication
- only Nginx exposes a host port

Persistence:
- named PostgreSQL volume

## 15. Non-functional requirements

### Performance

- Pages should load quickly on a local environment.
- Use asynchronous EF Core calls.
- Avoid N+1 queries.

### Reliability

- PostgreSQL health check
- Application health endpoint
- Graceful database connection retry during startup

### Maintainability

- Clear folders
- Dependency injection
- Service abstraction
- ViewModels instead of binding persistence entities directly where practical
- Automated tests

### UX

- Responsive layout
- Clear validation messages
- Clear order status labels
- Accessible form labels and buttons

## 16. Acceptance criteria

### Customer acceptance

- [ ] Customer can open htrestaurant.com.
- [ ] Menu is loaded from PostgreSQL.
- [ ] Customer can add/remove/change quantities.
- [ ] Checkout validates required fields.
- [ ] Order is persisted.
- [ ] Order number is shown after successful checkout.
- [ ] Total is correct.

### Admin acceptance

- [ ] Admin login works.
- [ ] Unauthorized admin access is blocked.
- [ ] Admin sees orders from PostgreSQL.
- [ ] Admin can open order details.
- [ ] Admin can transition valid statuses.
- [ ] Invalid status transitions are rejected.
- [ ] Admin can manage products.

### Platform acceptance

- [ ] Docker Compose starts all services.
- [ ] PostgreSQL data survives web container restart.
- [ ] Hostnames work through the local hosts file.
- [ ] Health endpoint returns healthy database status.
- [ ] Tests execute successfully.
- [ ] No secrets are committed.

## 17. Evaluation rubric

| Area | Weight |
|---|---:|
| Requirements understanding | 10% |
| ASP.NET Core MVC / C# | 20% |
| PostgreSQL / EF Core / data modeling | 15% |
| Business logic and order workflow | 15% |
| Frontend / responsive UI | 15% |
| Authentication/security/validation | 10% |
| Docker/containerization | 10% |
| Testing/code quality | 5% |
| **Total** | **100%** |

## 18. Suggested evaluation discussion

Each candidate should be able to explain:

- Why MVC was selected
- Why controllers should stay thin
- How DI works
- Why order item snapshots are stored
- How totals are protected from browser manipulation
- How EF Core talks to PostgreSQL
- Why PostgreSQL belongs in a separate container
- How Nginx routes hostnames
- How authentication protects admin operations
- How status transitions are enforced
- How the application could be deployed to production
- What would be changed for payments, notifications, concurrency and scale

## 19. Future enhancements

- ASP.NET Core Identity with roles
- Redis for distributed session/cache
- Real payment integration
- WhatsApp/SMS notification service
- Email service
- Kitchen display system
- Driver tracking
- Customer order tracking URL
- PostgreSQL migrations in CI/CD
- Observability with OpenTelemetry
- Cloud deployment
- Separate frontend SPA if justified
