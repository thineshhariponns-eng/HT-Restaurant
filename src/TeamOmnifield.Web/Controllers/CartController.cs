using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using TeamOmnifield.Web.Data;
using TeamOmnifield.Web.Services;
using TeamOmnifield.Web.ViewModels;

namespace TeamOmnifield.Web.Controllers;

public class CartController(AppDbContext db, CartService cartService, IConfiguration configuration) : Controller
{
    public async Task<IActionResult> Index()
    {
        var cart = cartService.Get();
        var products = await db.Products.Where(x => cart.Keys.Contains(x.Id) && x.IsAvailable).ToListAsync();
        var model = new CartViewModel
        {
            Items = products.Select(p => new CartLineViewModel { ProductId = p.Id, Name = p.Name, UnitPrice = p.Price, Quantity = cart[p.Id] }).ToList(),
            DeliveryFee = configuration.GetValue<decimal>("Restaurant:DeliveryFee", 40m)
        };
        return View(model);
    }

    [HttpPost, ValidateAntiForgeryToken]
    public async Task<IActionResult> Add(int productId, int quantity = 1)
    {
        if (quantity < 1) quantity = 1;
        var product = await db.Products.SingleOrDefaultAsync(x => x.Id == productId && x.IsAvailable);
        if (product is null) return NotFound();
        var cart = cartService.Get();
        cart[productId] = Math.Min(20, cart.GetValueOrDefault(productId) + quantity);
        cartService.Save(cart);
        return RedirectToAction(nameof(Index));
    }

    [HttpPost, ValidateAntiForgeryToken]
    public IActionResult Update(int productId, int quantity)
    {
        var cart = cartService.Get();
        if (quantity <= 0) cart.Remove(productId); else cart[productId] = Math.Min(20, quantity);
        cartService.Save(cart);
        return RedirectToAction(nameof(Index));
    }

    [HttpPost, ValidateAntiForgeryToken]
    public IActionResult Remove(int productId)
    {
        var cart = cartService.Get();
        cart.Remove(productId);
        cartService.Save(cart);
        return RedirectToAction(nameof(Index));
    }
}
