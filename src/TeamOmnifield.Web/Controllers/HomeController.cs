using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using TeamOmnifield.Web.Data;
using TeamOmnifield.Web.Services;

namespace TeamOmnifield.Web.Controllers;

public class HomeController(AppDbContext db, HostContextService host) : Controller
{
    // "/" is the brand welcome page; the ordering storefront home lives at "/chennai".
    public IActionResult Index()
    {
        if (host.Current == SiteHost.Admin) return RedirectToAction("Index", "Dashboard", new { area = "Admin" });
        if (host.Current == SiteHost.TeamOmnifield) return RedirectToAction("Index", "Team");
        return View("Portal");
    }

    [Route("about")]
    public IActionResult About() => View();

    [Route("chennai")]
    public async Task<IActionResult> Chennai()
    {
        if (host.Current == SiteHost.Admin) return RedirectToAction("Index", "Dashboard", new { area = "Admin" });
        if (host.Current == SiteHost.TeamOmnifield) return RedirectToAction("Index", "Team");
        ViewBag.Host = host.Current;
        ViewBag.Featured = await db.Products.AsNoTracking().Where(x => x.IsAvailable).OrderBy(x => x.Id).Take(4).ToListAsync();
        return View("Index");
    }

    public IActionResult Error() => View();
}
