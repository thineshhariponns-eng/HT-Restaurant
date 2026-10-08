using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using TeamOmnifield.Web.Data;
using TeamOmnifield.Web.Services;
using TeamOmnifield.Web.ViewModels;

namespace TeamOmnifield.Web.Controllers;

/// <summary>
/// Customer-facing order history. Read-only: a diner looks up the orders placed
/// from their phone number, then opens one to see where it has got to.
/// </summary>
public class OrdersController(AppDbContext db, OrderService orders, CityContextService cityContext) : Controller
{
    public async Task<IActionResult> Index(string? phone)
    {
        var model = new OrderHistoryViewModel { Phone = phone ?? string.Empty };

        if (!string.IsNullOrWhiteSpace(phone))
        {
            var trimmed = phone.Trim();
            var city = cityContext.Current.Slug; // only this location's orders
            model.Searched = true;
            model.Orders = await db.Orders.AsNoTracking()
                .Where(x => x.Phone == trimmed && x.City == city)
                .OrderByDescending(x => x.CreatedUtc)
                .Select(x => new OrderListItemViewModel
                {
                    Id = x.Id,
                    OrderNumber = x.OrderNumber,
                    CustomerName = x.CustomerName,
                    Phone = x.Phone,
                    Total = x.Total,
                    Status = x.Status,
                    CreatedUtc = x.CreatedUtc
                })
                .ToListAsync();
        }

        return View(model);
    }

    public async Task<IActionResult> Details(string orderNumber)
    {
        if (string.IsNullOrWhiteSpace(orderNumber)) return RedirectToAction(nameof(Index));

        var order = await orders.GetByOrderNumberAsync(orderNumber);
        return order is null ? NotFound() : View(order);
    }
}
