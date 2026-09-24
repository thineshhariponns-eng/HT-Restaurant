using System.Text.Json;
using Microsoft.AspNetCore.Mvc;
using TeamOmnifield.Web.Services;
using TeamOmnifield.Web.ViewModels;

namespace TeamOmnifield.Web.Controllers;

public class CheckoutController(CartService cartService, OrderService orderService, TurnstileService turnstile) : Controller
{
    private const string PendingKey = "TEAMOMNIFIELD_PENDING_CHECKOUT";

    private CheckoutViewModel? GetPending()
    {
        var json = HttpContext.Session.GetString(PendingKey);
        return json is null ? null : JsonSerializer.Deserialize<CheckoutViewModel>(json);
    }

    [HttpGet]
    public IActionResult Index()
    {
        if (cartService.Get().Count == 0) return RedirectToAction("Index", "Cart");
        return View(new CheckoutViewModel());
    }

    [HttpPost, ValidateAntiForgeryToken]
    public async Task<IActionResult> Index(CheckoutViewModel model)
    {
        if (!await turnstile.VerifyAsync(Request.Form["cf-turnstile-response"], HttpContext.Connection.RemoteIpAddress?.ToString()))
        {
            ModelState.AddModelError(string.Empty, "Spam verification failed. Please try again.");
            Response.StatusCode = StatusCodes.Status400BadRequest;
            return View(model);
        }
        if (!ModelState.IsValid) return View(model);
        HttpContext.Session.SetString(PendingKey, JsonSerializer.Serialize(model));
        return RedirectToAction(nameof(Payment));
    }

    // Demo payment step: UI only, nothing is charged. The order is created when payment is confirmed.
    [HttpGet]
    public IActionResult Payment()
    {
        if (cartService.Get().Count == 0) return RedirectToAction("Index", "Cart");
        var pending = GetPending();
        if (pending is null) return RedirectToAction(nameof(Index));
        return View(pending);
    }

    [HttpPost, ActionName("Payment"), ValidateAntiForgeryToken]
    public async Task<IActionResult> ConfirmPayment()
    {
        var pending = GetPending();
        if (pending is null) return RedirectToAction(nameof(Index));
        try
        {
            var order = await orderService.CreateAsync(pending, cartService.Get());
            cartService.Clear();
            HttpContext.Session.Remove(PendingKey);
            return RedirectToAction(nameof(Success), new { orderNumber = order.OrderNumber, paid = true });
        }
        catch (InvalidOperationException ex)
        {
            TempData["PaymentError"] = ex.Message;
            return RedirectToAction(nameof(Payment));
        }
    }

    public async Task<IActionResult> Success(string orderNumber)
    {
        var order = await orderService.GetByOrderNumberAsync(orderNumber);
        return order is null ? NotFound() : View(order);
    }
}
