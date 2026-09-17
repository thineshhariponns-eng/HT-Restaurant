# TeamOmnifield Build & Evaluation Checklist

## Phase 0 — Repository

- [ ] Clone `ht-omnifield` repository.
- [ ] Create README.
- [ ] Create SPECIFICATION.md.
- [ ] Create CHECKLIST.md.
- [ ] Add `.gitignore`.
- [ ] Create feature branches per evaluation rules.

## Phase 1 — Infrastructure

- [ ] Dockerfile for ASP.NET Core.
- [ ] Docker Compose.
- [ ] PostgreSQL container.
- [ ] PostgreSQL named volume.
- [ ] Nginx reverse proxy.
- [ ] Host-based routing.
- [ ] Health checks.
- [ ] Local hosts file entries (or run `scripts/setup-hosts.ps1` as Administrator).

## Phase 2 — Backend

- [ ] .NET 10 MVC project.
- [ ] EF Core PostgreSQL provider.
- [ ] DbContext.
- [ ] Entities.
- [ ] Database initialization.
- [ ] Seed categories/products.
- [ ] Seed admin account.
- [ ] Services.
- [ ] Validation.
- [ ] Order number generation.
- [ ] Status transition rules.
- [ ] Health endpoint.
- [ ] Order lookup API.

## Phase 3 — Customer UI

- [ ] Home page.
- [ ] Menu page.
- [ ] Category navigation.
- [ ] Product cards.
- [ ] Cart.
- [ ] Checkout.
- [ ] Confirmation.
- [ ] Responsive CSS.
- [ ] Error messages.

## Phase 4 — Admin UI

- [ ] Login.
- [ ] Logout.
- [ ] Authorization.
- [ ] Dashboard.
- [ ] Order queue.
- [ ] Order detail.
- [ ] Status update.
- [ ] Product list.
- [ ] Product create/edit.
- [ ] Product activation.

## Phase 5 — TeamOmnifield

- [ ] Central dashboard.
- [ ] Database health.
- [ ] Order metrics.
- [ ] Revenue metric.
- [ ] Links to customer/admin applications.

## Phase 6 — Testing

- [ ] Service unit tests.
- [ ] Status transition tests.
- [ ] Order total tests.
- [ ] Validation tests.
- [ ] API smoke test.
- [ ] Manual checkout test.
- [ ] Manual admin workflow test.
- [ ] Container restart test.

## Phase 7 — Security

- [ ] Passwords hashed.
- [ ] No plaintext secrets.
- [ ] Admin authorization.
- [ ] Anti-forgery tokens.
- [ ] Server-side totals.
- [ ] Server-side product availability check.
- [ ] Input validation.
- [ ] Production secrets excluded from Git.

## Phase 8 — GitHub quality

- [ ] Small logical commits.
- [ ] Clear commit messages.
- [ ] Pull request description.
- [ ] Tests included with feature changes.
- [ ] README updated.
- [ ] No generated build artifacts committed.
- [ ] No `.env` secrets committed.

## Final demo checklist

- [ ] `docker compose up --build -d`
- [ ] `docker compose ps` shows healthy services.
- [ ] htrestaurant.com opens.
- [ ] Customer creates an order.
- [ ] Admin logs in.
- [ ] Admin confirms order.
- [ ] Admin moves order through fulfillment.
- [ ] TeamOmnifield dashboard shows metrics.
- [ ] Restart web container.
- [ ] Order still exists.
- [ ] Tests pass.
