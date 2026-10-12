using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using TeamOmnifield.Web.Data;
using TeamOmnifield.Web.Services;

namespace TeamOmnifield.Web.Controllers;

public class HomeController(AppDbContext db, HostContextService host) : Controller
{
    // "/" is the brand welcome page; the ordering storefront home lives at "/chennai".
    public async Task<IActionResult> Index()
    {
        if (host.Current == SiteHost.Admin) return RedirectToAction("Index", "Dashboard", new { area = "Admin" });
        if (host.Current == SiteHost.TeamOmnifield) return RedirectToAction("Index", "Team");
        var availableMenuItems = await db.Products.AsNoTracking()
            .Where(x => x.IsAvailable && x.ImageUrl != "" && x.Category != null && x.Category.IsActive)
            .Include(x => x.Category)
            .OrderBy(x => x.Category!.DisplayOrder)
            .ThenBy(x => x.Id)
            .ToListAsync();
        var menuItemsByCategory = availableMenuItems.GroupBy(x => x.CategoryId).ToList();
        ViewBag.MenuItems = menuItemsByCategory.Select(group => group.First())
            .Concat(menuItemsByCategory.SelectMany(group => group.Skip(1)))
            .Take(6)
            .ToList();
        var showcaseNames = new[]
        {
            "Grill Chicken", "Chilli Chicken", "Paneer Tikka",
            "Gobi Manchurian", "Vanilla Ice Cream", "Masala Lassi"
        };
        ViewBag.MenuShowcase = await db.Products.AsNoTracking()
            .Where(x => showcaseNames.Contains(x.Name) && x.IsAvailable && x.ImageUrl != "")
            .ToListAsync();
        return View("Portal");
    }

    [Route("about")]
    public IActionResult About() => View();

    [Route("chennai")]
    public Task<IActionResult> Chennai() => CityStorefront(CityContextService.Cities["chennai"]);

    [Route("hyderabad")]
    public Task<IActionResult> Hyderabad() => CityStorefront(CityContextService.Cities["hyderabad"]);

    [Route("kolkata")]
    public Task<IActionResult> Kolkata() => CityStorefront(CityContextService.Cities["kolkata"]);

    // Every city shares the same ordering storefront (menu, cart, orders); only the marketing copy varies by city.
    // The choice is remembered in a cookie (CityContextService) so the header/footer keep showing it across the whole
    // project - customer storefront, Admin and Platform alike - not just this page.
    private async Task<IActionResult> CityStorefront(CityInfo city)
    {
        if (host.Current == SiteHost.Admin) return RedirectToAction("Index", "Dashboard", new { area = "Admin" });
        if (host.Current == SiteHost.TeamOmnifield) return RedirectToAction("Index", "Team");
        Response.Cookies.Append(CityContextService.CookieName, city.Slug, new CookieOptions { Expires = DateTimeOffset.UtcNow.AddYears(1), IsEssential = true, SameSite = SameSiteMode.Lax });
        ViewBag.Host = host.Current;
        ViewBag.City = city;
        ViewBag.Featured = await db.Products.AsNoTracking().Where(x => x.IsAvailable).OrderBy(x => x.Id).Take(4).ToListAsync();
        return View("Index");
    }

    public IActionResult Error() => View();

    // Catches every unmatched route or unrecognized hostname (see UseStatusCodePagesWithReExecute in Program.cs).
    [Route("/error/{code:int}")]
    public IActionResult HandleStatusCode(int code) => code == 404 ? View("NotFound") : View("Error");
}
