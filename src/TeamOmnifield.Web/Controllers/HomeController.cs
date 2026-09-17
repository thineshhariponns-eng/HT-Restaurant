using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using TeamOmnifield.Web.Data;
using TeamOmnifield.Web.Services;

namespace TeamOmnifield.Web.Controllers;

public class HomeController(AppDbContext db, HostContextService host) : Controller
{
    public async Task<IActionResult> Index()
    {
        if (host.Current == SiteHost.Admin) return RedirectToAction("Index", "Dashboard", new { area = "Admin" });
        if (host.Current == SiteHost.TeamOmnifield) return RedirectToAction("Index", "Team");
        ViewBag.Host = host.Current;
        ViewBag.Featured = await db.Products.AsNoTracking().Where(x => x.IsAvailable).OrderBy(x => x.Id).Take(4).ToListAsync();
        return View();
    }

    public IActionResult Error() => View();
}
