using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using TeamOmnifield.Web.Services;
using TeamOmnifield.Web.ViewModels;

namespace TeamOmnifield.Web.Controllers.Platform;

/// <summary>
/// Consultant portal: the delivery pipeline for restaurant clients. Uses the
/// in-memory demo store, so nothing here reads or writes the restaurant database.
/// </summary>
[Area("Platform"), Authorize(Roles = "Developer")]
public class DashboardController : Controller
{
    public IActionResult Index() => View();
}

[Area("Platform"), Authorize(Roles = "Developer")]
public class ClientsController : Controller
{
    public IActionResult Index(string? q) 
    {
        ViewBag.Query = q ?? string.Empty;
        return View();
    }

    public IActionResult Details(string id)
    {
        var client = DemoClientStore.ById(id);
        return client is null ? NotFound() : View(client);
    }
}

[Area("Platform"), Authorize(Roles = "Developer")]
public class OnboardingController : Controller
{
    [HttpGet]
    public IActionResult Index() => View(new NewClientViewModel());

    [HttpPost, ValidateAntiForgeryToken]
    public IActionResult Index(NewClientViewModel model)
    {
        if (!ModelState.IsValid) return View(model);

        var domain = model.Domain.Trim().ToLowerInvariant();
        var adminDomain = model.AdminDomain.Trim().ToLowerInvariant();
        var clients = DemoClientStore.All();

        bool InUse(string host) => clients.Any(x =>
            x.Domain.Equals(host, StringComparison.OrdinalIgnoreCase) ||
            x.ResolvedAdminDomain.Equals(host, StringComparison.OrdinalIgnoreCase));

        if (InUse(domain)) ModelState.AddModelError(nameof(model.Domain), "This name already exist please enter different name");
        if (InUse(adminDomain)) ModelState.AddModelError(nameof(model.AdminDomain), "This name already exist please enter different name");
        if (!ModelState.IsValid) return View(model);

        var client = DemoClientStore.Add(
            model.Name.Trim(),
            (model.City ?? string.Empty).Trim(),
            model.Contact.Trim(),
            model.ContactEmail.Trim(),
            model.Domain.Trim().ToLowerInvariant(),
            model.AdminDomain.Trim().ToLowerInvariant());

        return RedirectToAction("Details", "Clients", new { area = "Platform", id = client.Id });
    }
}

[Area("Platform"), Authorize(Roles = "Developer")]
public class DomainsController : Controller
{
    public IActionResult Index() => View();
}

[Area("Platform"), Authorize(Roles = "Developer")]
public class DeploymentsController : Controller
{
    public IActionResult Index() => View();

    [HttpPost, ValidateAntiForgeryToken]
    public IActionResult Move(string id, ClientStage stage)
    {
        DemoClientStore.MoveTo(id, stage);
        return RedirectToAction(nameof(Index));
    }
}
