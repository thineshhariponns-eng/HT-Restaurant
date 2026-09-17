# Quick manual test script

## 1. Infrastructure

```bash
docker compose up --build -d
docker compose ps
curl http://localhost:8080/health
```

Expected health response:

```json
{"status":"healthy","database":"connected"}
```

## 2. Customer flow

1. Open `http://htrestaurant.com:8080`.
2. Open Menu.
3. Add Chicken Biryani.
4. Open Cart.
5. Proceed to checkout.
6. Enter:
   - Name: Test Customer
   - Phone: 9876543210
   - Address: Erode Test Address
7. Place order.
8. Copy the order number.

## 3. Admin flow

1. Open `http://admin.htrestaurant.com:8080/Account/Login`.
2. Sign in with the seeded local account.
3. Open Orders.
4. Open the created order.
5. Mark Confirmed.
6. Mark Preparing.
7. Mark Ready.
8. Mark OutForDelivery.
9. Mark Delivered.

## 4. API flow

```bash
curl http://localhost:8080/api/orders/<ORDER_NUMBER>
```

## 5. Persistence

```bash
docker compose restart web
```

Reload the admin order queue. The order should still exist.
