using Microsoft.EntityFrameworkCore;
using TeamOmnifield.Web.Data;
using TeamOmnifield.Web.Models;
using TeamOmnifield.Web.ViewModels;

namespace TeamOmnifield.Web.Services;

public class OrderService(AppDbContext db, IConfiguration configuration)
{
    private decimal DeliveryFee => configuration.GetValue<decimal>("Restaurant:DeliveryFee", 40m);

    public static readonly IReadOnlyDictionary<string, string> PaymentMethodLabels = new Dictionary<string, string>
    {
        ["upi"] = "UPI",
        ["card"] = "Credit / Debit Card",
        ["netbanking"] = "Net Banking",
        ["cash"] = "Cash on delivery",
    };

    public async Task<Order> CreateAsync(CheckoutViewModel checkout, IReadOnlyDictionary<int, int> cart, string paymentMethod, string city = "")
    {
        if (cart.Count == 0) throw new InvalidOperationException("Cart is empty.");
        if (!PaymentMethodLabels.ContainsKey(paymentMethod)) throw new InvalidOperationException("Choose a valid payment method.");

        var ids = cart.Keys.ToList();
        var products = await db.Products.Where(x => ids.Contains(x.Id) && x.IsAvailable).ToListAsync();
        if (products.Count != ids.Count) throw new InvalidOperationException("One or more products are no longer available.");

        var order = new Order
        {
            OrderNumber = $"HT{DateTime.UtcNow:yyyyMMddHHmmss}{Random.Shared.Next(100, 999)}",
            CustomerName = checkout.CustomerName.Trim(),
            Phone = checkout.Phone.Trim(),
            DeliveryAddress = checkout.DeliveryAddress.Trim(),
            Notes = string.IsNullOrWhiteSpace(checkout.Notes) ? null : checkout.Notes.Trim(),
            PaymentMethod = paymentMethod,
            City = city,
            DeliveryFee = DeliveryFee
        };

        foreach (var product in products)
        {
            var quantity = cart[product.Id];
            if (quantity < 1 || quantity > 20) throw new InvalidOperationException("Invalid quantity.");
            order.Items.Add(new OrderItem
            {
                ProductId = product.Id,
                ProductNameSnapshot = product.Name,
                UnitPrice = product.Price,
                Quantity = quantity,
                LineTotal = product.Price * quantity
            });
        }

        order.Subtotal = order.Items.Sum(x => x.LineTotal);
        order.Total = order.Subtotal + order.DeliveryFee;
        db.Orders.Add(order);
        await db.SaveChangesAsync();
        return order;
    }

    public async Task<Order?> GetByOrderNumberAsync(string orderNumber) =>
        await db.Orders.Include(x => x.Items).SingleOrDefaultAsync(x => x.OrderNumber == orderNumber);

    public async Task<List<OrderListItemViewModel>> GetAdminListAsync(OrderStatus? status, string? search, string? city = null)
    {
        var query = db.Orders.AsNoTracking().AsQueryable();
        if (city is not null) query = query.Where(x => x.City == city);
        if (status.HasValue) query = query.Where(x => x.Status == status.Value);
        if (!string.IsNullOrWhiteSpace(search))
        {
            search = search.Trim();
            query = query.Where(x => x.OrderNumber.Contains(search) || x.CustomerName.Contains(search) || x.Phone.Contains(search));
        }
        return await query.OrderByDescending(x => x.CreatedUtc).Select(x => new OrderListItemViewModel
        {
            Id = x.Id, OrderNumber = x.OrderNumber, CustomerName = x.CustomerName, Phone = x.Phone,
            Total = x.Total, Status = x.Status, CreatedUtc = x.CreatedUtc
        }).ToListAsync();
    }

    public async Task<Order?> GetByIdAsync(int id) => await db.Orders.Include(x => x.Items).SingleOrDefaultAsync(x => x.Id == id);

    public async Task<bool> ChangeStatusAsync(int id, OrderStatus next)
    {
        var order = await db.Orders.FindAsync(id);
        if (order is null || !IsValidTransition(order.Status, next)) return false;
        order.Status = next;
        order.UpdatedUtc = DateTime.UtcNow;
        await db.SaveChangesAsync();
        return true;
    }

    public static bool IsValidTransition(OrderStatus current, OrderStatus next) => current switch
    {
        OrderStatus.Pending => next is OrderStatus.Confirmed or OrderStatus.Cancelled,
        OrderStatus.Confirmed => next is OrderStatus.Preparing or OrderStatus.Cancelled,
        OrderStatus.Preparing => next is OrderStatus.Ready or OrderStatus.Cancelled,
        OrderStatus.Ready => next is OrderStatus.OutForDelivery or OrderStatus.Cancelled,
        OrderStatus.OutForDelivery => next is OrderStatus.Delivered or OrderStatus.Cancelled,
        _ => false
    };

    public async Task<DashboardViewModel> GetDashboardAsync(string? city = null)
    {
        var today = DateTime.UtcNow.Date;
        var todays = db.Orders.AsNoTracking().Where(x => x.CreatedUtc >= today);
        if (city is not null) todays = todays.Where(x => x.City == city);
        var orders = await todays.ToListAsync();
        var highlights = await db.Products.AsNoTracking().Where(x => x.IsAvailable)
            .OrderBy(x => x.Category!.DisplayOrder).ThenBy(x => x.Name).Take(6)
            .Select(x => new MenuHighlightViewModel { Name = x.Name, ImageUrl = x.ImageUrl }).ToListAsync();
        return new DashboardViewModel
        {
            TotalOrdersToday = orders.Count,
            SalesToday = orders.Where(x => x.Status != OrderStatus.Cancelled).Sum(x => x.Total),
            PendingOrders = orders.Count(x => x.Status == OrderStatus.Pending),
            PreparingOrders = orders.Count(x => x.Status == OrderStatus.Preparing),
            ReadyOrders = orders.Count(x => x.Status == OrderStatus.Ready),
            DeliveredOrders = orders.Count(x => x.Status == OrderStatus.Delivered),
            CancelledOrders = orders.Count(x => x.Status == OrderStatus.Cancelled),
            MenuHighlights = highlights
        };
    }
}
