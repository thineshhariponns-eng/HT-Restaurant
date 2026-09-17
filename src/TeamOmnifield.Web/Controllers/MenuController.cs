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
}
