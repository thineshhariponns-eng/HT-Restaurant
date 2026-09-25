using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using TeamOmnifield.Web.Services;

namespace TeamOmnifield.Web.Controllers.Admin;

/// <summary>
/// Support tickets from the restaurant admin to the consultant. Each ticket lands in the consultant
/// portal's project for whichever city is currently selected (see <see cref="CityContextService"/>) -
/// a ticket raised while Chennai is selected shows up only under the Chennai project in the developer
/// portal, never under Hyderabad's or Kolkata's.
/// </summary>
[Area("Admin"), Authorize(Roles = "Admin")]
public class TicketsController(CityContextService cityContext) : Controller
{
    private DemoProject? Site
    {
        get
        {
            var slug = cityContext.Current.Slug;
            if (!DemoWorkspaceStore.Cities.Contains(slug)) slug = "chennai"; // before a city has ever been picked
            return DemoWorkspaceStore.ProjectByName(DemoWorkspaceStore.AdminPortalProject(slug));
        }
    }

    private string Who() => User.Identity?.Name ?? "admin";

    public IActionResult Index()
    {
        if (Site is not { } site) return NotFound();
        ViewBag.Project = site;
        return View(DemoWorkspaceStore.TicketsOf(site.ClientId, site.Id));
    }

    [HttpPost, ValidateAntiForgeryToken]
    public IActionResult Create(string? title, string? body)
    {
        if (Site is not { } site) return NotFound();
        title = (title ?? string.Empty).Trim();
        body = (body ?? string.Empty).Trim();

        if (title.Length is 0 || title.Length > DemoWorkspaceStore.TitleMax)
            TempData["Error"] = $"Enter a ticket title of up to {DemoWorkspaceStore.TitleMax} characters.";
        else if (body.Length > DemoWorkspaceStore.TextMax)
            TempData["Error"] = $"Keep the description under {DemoWorkspaceStore.TextMax} characters.";
        else
        {
            var ticket = DemoWorkspaceStore.RaiseTicket(site.ClientId, site.Id, title, body, Who(), DemoWorkspaceStore.AdminPortalSource);
            DemoClientStore.LogActivity(site.ClientId, $"Ticket raised on {site.Name}: {title}");
            return RedirectToAction(nameof(Details), new { number = ticket!.Number });
        }
        return RedirectToAction(nameof(Index));
    }

    public IActionResult Details(int number)
    {
        if (Site is not { } site) return NotFound();
        var ticket = DemoWorkspaceStore.TicketOfProject(site.Id, number);
        if (ticket is null) return NotFound();
        ViewBag.Project = site;
        return View(ticket);
    }

    /// <summary><c>action</c> is "comment", "close" (comment, then close) or "reopen".</summary>
    [HttpPost, ValidateAntiForgeryToken]
    public IActionResult Comment(int number, string? body, string? action)
    {
        if (Site is not { } site || DemoWorkspaceStore.TicketOfProject(site.Id, number) is null) return NotFound();
        body = (body ?? string.Empty).Trim();

        bool? setOpen = action switch { "close" => false, "reopen" => true, _ => null };
        if (body.Length > DemoWorkspaceStore.TextMax) TempData["Error"] = $"Keep the comment under {DemoWorkspaceStore.TextMax} characters.";
        else if (body.Length == 0 && setOpen is null) TempData["Error"] = "Write a comment first.";
        else DemoWorkspaceStore.Reply(site.ClientId, number, Who(), body, setOpen);
        return RedirectToAction(nameof(Details), new { number });
    }
}
