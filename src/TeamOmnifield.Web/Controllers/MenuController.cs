using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using TeamOmnifield.Web.Data;

namespace TeamOmnifield.Web.Controllers;

public class MenuController(AppDbContext db) : Controller
{
    public async Task<IActionResult> Index()
    {
        var categories = await db.Categories.AsNoTracking().Where(x => x.IsActive).Include(x => x.Products.Where(p => p.IsAvailable)).OrderBy(x => x.DisplayOrder).ToListAsync();
        return View(categories);
    }

    /// <summary>One dish, with its category siblings underneath.</summary>
    public async Task<IActionResult> Details(int id)
    {
        var product = await db.Products.AsNoTracking().Include(x => x.Category).SingleOrDefaultAsync(x => x.Id == id);
        if (product is null) return NotFound();

        ViewBag.Related = await db.Products.AsNoTracking()
            .Where(x => x.CategoryId == product.CategoryId && x.Id != product.Id && x.IsAvailable)
            .OrderBy(x => x.Name)
            .Take(3)
            .ToListAsync();

        return View(product);
    }
}
