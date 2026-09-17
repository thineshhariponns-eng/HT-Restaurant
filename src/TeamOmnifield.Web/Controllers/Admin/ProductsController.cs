using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using TeamOmnifield.Web.Data;
using TeamOmnifield.Web.Models;
using TeamOmnifield.Web.ViewModels;

namespace TeamOmnifield.Web.Controllers.Admin;

[Area("Admin"), Authorize]
public class ProductsController(AppDbContext db) : Controller
{
    public async Task<IActionResult> Index() => View(await db.Products.Include(x => x.Category).OrderBy(x => x.Category!.DisplayOrder).ThenBy(x => x.Name).ToListAsync());

    [HttpGet]
    public async Task<IActionResult> Create() { ViewBag.Categories = await Categories(); return View("Edit", new ProductEditViewModel()); }

    [HttpPost, ValidateAntiForgeryToken]
    public async Task<IActionResult> Create(ProductEditViewModel model)
    {
        if (!ModelState.IsValid) { ViewBag.Categories = await Categories(); return View("Edit", model); }
        db.Products.Add(new Product { Name = model.Name.Trim(), Description = model.Description.Trim(), Price = model.Price, ImageUrl = model.ImageUrl.Trim(), CategoryId = model.CategoryId, IsAvailable = model.IsAvailable });
        await db.SaveChangesAsync();
        return RedirectToAction(nameof(Index));
    }

    [HttpGet]
    public async Task<IActionResult> Edit(int id)
    {
        var p = await db.Products.FindAsync(id);
        if (p is null) return NotFound();
        ViewBag.Categories = await Categories();
        return View(new ProductEditViewModel { Id = p.Id, Name = p.Name, Description = p.Description, Price = p.Price, ImageUrl = p.ImageUrl, CategoryId = p.CategoryId, IsAvailable = p.IsAvailable });
    }

    [HttpPost, ValidateAntiForgeryToken]
    public async Task<IActionResult> Edit(ProductEditViewModel model)
    {
        if (!ModelState.IsValid) { ViewBag.Categories = await Categories(); return View(model); }
        var p = await db.Products.FindAsync(model.Id);
        if (p is null) return NotFound();
        p.Name = model.Name.Trim(); p.Description = model.Description.Trim(); p.Price = model.Price; p.ImageUrl = model.ImageUrl.Trim(); p.CategoryId = model.CategoryId; p.IsAvailable = model.IsAvailable; p.UpdatedUtc = DateTime.UtcNow;
        await db.SaveChangesAsync();
        return RedirectToAction(nameof(Index));
    }

    private async Task<List<Category>> Categories() => await db.Categories.Where(x => x.IsActive).OrderBy(x => x.DisplayOrder).ToListAsync();
}
