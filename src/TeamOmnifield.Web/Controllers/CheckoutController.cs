using Microsoft.AspNetCore.Mvc;
using TeamOmnifield.Web.Services;
using TeamOmnifield.Web.ViewModels;

namespace TeamOmnifield.Web.Controllers;

public class CheckoutController(CartService cartService, OrderService orderService, TurnstileService turnstile) : Controller
{
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
        try
        {
            var order = await orderService.CreateAsync(model, cartService.Get());
            cartService.Clear();
            return RedirectToAction(nameof(Success), new { orderNumber = order.OrderNumber });
        }
        catch (InvalidOperationException ex)
        {
            ModelState.AddModelError(string.Empty, ex.Message);
            return View(model);
        }
    }

    public async Task<IActionResult> Success(string orderNumber)
    {
        var order = await orderService.GetByOrderNumberAsync(orderNumber);
        return order is null ? NotFound() : View(order);
    }
}
