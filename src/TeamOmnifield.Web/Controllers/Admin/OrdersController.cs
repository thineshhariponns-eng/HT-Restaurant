using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using TeamOmnifield.Web.Models;
using TeamOmnifield.Web.Services;

namespace TeamOmnifield.Web.Controllers.Admin;

[Area("Admin"), Authorize]
public class OrdersController(OrderService orders) : Controller
{
    public async Task<IActionResult> Index(OrderStatus? status, string? search) => View(await orders.GetAdminListAsync(status, search));

    public async Task<IActionResult> Details(int id)
    {
        var order = await orders.GetByIdAsync(id);
        return order is null ? NotFound() : View(order);
    }

    [HttpPost, ValidateAntiForgeryToken]
    public async Task<IActionResult> ChangeStatus(int id, OrderStatus status)
    {
        if (!await orders.ChangeStatusAsync(id, status)) TempData["Error"] = "Invalid status transition.";
        return RedirectToAction(nameof(Details), new { id });
    }
}
