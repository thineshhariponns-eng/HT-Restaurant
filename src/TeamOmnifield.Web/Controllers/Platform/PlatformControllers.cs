using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using TeamOmnifield.Web.Services;
using TeamOmnifield.Web.ViewModels;

namespace TeamOmnifield.Web.Controllers.Platform;

/// <summary>
/// Omnifield platform portal: where clients are created, managed and tracked through delivery.
/// Client records are saved through <see cref="ClientDirectory"/>; each client's projects,
/// tickets, deployments and changes are still held in memory.
/// </summary>
[Area("Platform"), Authorize(Roles = "Developer")]
public class DashboardController : Controller
{
    public IActionResult Index() => View();
}

[Area("Platform"), Authorize(Roles = "Developer")]
public class ClientsController(ClientDirectory directory) : Controller
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

    [HttpGet]
    public IActionResult Edit(string id)
    {
        var client = DemoClientStore.ById(id);
        if (client is null) return NotFound();
        return View(new EditClientViewModel
        {
            Id = client.Id, Name = client.Name, City = client.City, Contact = client.Contact,
            ContactEmail = client.ContactEmail, Domain = client.Domain, AdminDomain = client.ResolvedAdminDomain,
        });
    }

    [HttpPost, ValidateAntiForgeryToken]
    public async Task<IActionResult> Edit(EditClientViewModel model)
    {
        if (DemoClientStore.ById(model.Id) is null) return NotFound();
        if (!ModelState.IsValid) return View(model);

        var domain = model.Domain.Trim().ToLowerInvariant();
        var adminDomain = model.AdminDomain.Trim().ToLowerInvariant();
        if (await directory.HostInUseAsync(domain, model.Id)) ModelState.AddModelError(nameof(model.Domain), "Another client already uses this hostname.");
        if (await directory.HostInUseAsync(adminDomain, model.Id)) ModelState.AddModelError(nameof(model.AdminDomain), "Another client already uses this hostname.");
        if (domain == adminDomain) ModelState.AddModelError(nameof(model.AdminDomain), "The admin hostname must differ from the customer hostname.");
        if (!ModelState.IsValid) return View(model);

        await directory.UpdateAsync(model.Id, model.Name.Trim(), (model.City ?? string.Empty).Trim(),
            model.Contact.Trim(), model.ContactEmail.Trim(), domain, adminDomain);
        TempData["Notice"] = "Client details saved.";
        return RedirectToAction(nameof(Details), new { id = model.Id });
    }

    [HttpPost, ValidateAntiForgeryToken]
    public async Task<IActionResult> SetStage(string id, ClientStage stage)
    {
        if (!Enum.IsDefined(stage)) return BadRequest();
        if (!await directory.SetStageAsync(id, stage)) return NotFound();
        TempData["Notice"] = $"Moved to {DemoClientStore.Label(stage)}.";
        return RedirectToAction(nameof(Details), new { id });
    }

    [HttpPost, ValidateAntiForgeryToken]
    public async Task<IActionResult> SetStatus(string id, bool active)
    {
        if (!await directory.SetActiveAsync(id, active)) return NotFound();
        TempData["Notice"] = active ? "Workspace reactivated." : "Workspace suspended.";
        return RedirectToAction(nameof(Details), new { id });
    }

    [HttpPost, ValidateAntiForgeryToken]
    public async Task<IActionResult> Delete(string id)
    {
        var client = DemoClientStore.ById(id);
        if (client is null) return NotFound();
        if (!await directory.DeleteAsync(id))
        {
            Fail($"{client.Name} is this application's own client and cannot be deleted.");
            return RedirectToAction(nameof(Details), new { id });
        }
        TempData["Notice"] = $"{client.Name} was deleted.";
        return RedirectToAction(nameof(Index));
    }

    [HttpPost, ValidateAntiForgeryToken]
    public IActionResult AddProject(string id, string? name)
    {
        if (DemoClientStore.ById(id) is null) return NotFound();
        name = (name ?? string.Empty).Trim();
        if (name.Length is 0 or > 80) Fail("Enter a project name of up to 80 characters.");
        else DemoWorkspaceStore.AddProject(id, name);
        return RedirectToAction(nameof(Details), new { id });
    }

    public IActionResult Project(string id, string projectId)
    {
        var client = DemoClientStore.ById(id);
        var project = DemoWorkspaceStore.ProjectById(id, projectId);
        if (client is null || project is null) return NotFound();
        ViewBag.Client = client;
        return View(project);
    }

    [HttpPost, ValidateAntiForgeryToken]
    public IActionResult RaiseTicket(string id, string projectId, string? title, string? body)
    {
        title = (title ?? string.Empty).Trim();
        body = (body ?? string.Empty).Trim();
        if (DemoWorkspaceStore.ProjectById(id, projectId) is null) return NotFound();

        if (title.Length is 0 || title.Length > DemoWorkspaceStore.TitleMax)
            Fail($"Enter a ticket title of up to {DemoWorkspaceStore.TitleMax} characters.");
        else if (body.Length > DemoWorkspaceStore.TextMax)
            Fail($"Keep the description under {DemoWorkspaceStore.TextMax} characters.");
        else
        {
            var ticket = DemoWorkspaceStore.RaiseTicket(id, projectId, title, body, Who());
            return RedirectToAction(nameof(Ticket), new { id, number = ticket!.Number });
        }
        return RedirectToAction(nameof(Project), new { id, projectId });
    }

    public IActionResult Ticket(string id, int number)
    {
        var client = DemoClientStore.ById(id);
        var ticket = DemoWorkspaceStore.TicketByNumber(id, number);
        if (client is null || ticket is null) return NotFound();
        ViewBag.Client = client;
        return View(ticket);
    }

    /// <summary>The comment box: <c>action</c> is "comment", "close" (comment, then close) or "reopen".</summary>
    [HttpPost, ValidateAntiForgeryToken]
    public IActionResult Comment(string id, int number, string? body, string? action)
    {
        body = (body ?? string.Empty).Trim();
        if (body.Length > DemoWorkspaceStore.TextMax)
        {
            Fail($"Keep the comment under {DemoWorkspaceStore.TextMax} characters.");
            return RedirectToAction(nameof(Ticket), new { id, number });
        }

        bool? setOpen = action switch { "close" => false, "reopen" => true, _ => null };
        if (body.Length == 0 && setOpen is null)
        {
            Fail("Write a comment first.");
            return RedirectToAction(nameof(Ticket), new { id, number });
        }
        return DemoWorkspaceStore.Reply(id, number, Who(), body, setOpen)
            ? RedirectToAction(nameof(Ticket), new { id, number })
            : NotFound();
    }

    [HttpPost, ValidateAntiForgeryToken]
    public IActionResult Deploy(string id, string projectId, string? version, string? outcome, string? notes)
    {
        version = (version ?? string.Empty).Trim();
        notes = (notes ?? string.Empty).Trim();
        if (DemoWorkspaceStore.ProjectById(id, projectId) is null) return NotFound();

        if (version.Length is 0 or > 40) Fail("Enter a version of up to 40 characters, for example v1.2.0.");
        else if (notes.Length > 500) Fail("Keep deployment notes under 500 characters.");
        else DemoWorkspaceStore.Deploy(id, projectId, version, outcome == "failed" ? DeployState.Failed : DeployState.Live, notes, Who());
        return RedirectToAction(nameof(Project), new { id, projectId });
    }

    [HttpPost, ValidateAntiForgeryToken]
    public IActionResult LogChange(string id, string projectId, string? what, string? before, string? after)
    {
        what = (what ?? string.Empty).Trim();
        before = (before ?? string.Empty).Trim();
        after = (after ?? string.Empty).Trim();
        if (DemoWorkspaceStore.ProjectById(id, projectId) is null) return NotFound();

        if (what.Length is 0 or > 120) Fail("Say what changed, in up to 120 characters.");
        else if (before.Length > 500 || after.Length > 500) Fail("Keep before and after under 500 characters each.");
        else DemoWorkspaceStore.LogChange(id, projectId, what, before, after, Who());
        return RedirectToAction(nameof(Project), new { id, projectId });
    }

    private string Who() => User.Identity?.Name ?? "consultant";

    private void Fail(string message) => TempData["Error"] = message;
}

[Area("Platform"), Authorize(Roles = "Developer")]
public class OnboardingController(ClientDirectory directory) : Controller
{
    [HttpGet]
    public IActionResult Index() => View(new NewClientViewModel());

    [HttpPost, ValidateAntiForgeryToken]
    public async Task<IActionResult> Index(NewClientViewModel model)
    {
        if (!ModelState.IsValid) return View(model);

        var domain = model.Domain.Trim().ToLowerInvariant();
        var adminDomain = model.AdminDomain.Trim().ToLowerInvariant();

        if (await directory.HostInUseAsync(domain)) ModelState.AddModelError(nameof(model.Domain), "This name already exist please enter different name");
        if (await directory.HostInUseAsync(adminDomain)) ModelState.AddModelError(nameof(model.AdminDomain), "This name already exist please enter different name");
        if (domain == adminDomain) ModelState.AddModelError(nameof(model.AdminDomain), "The admin hostname must differ from the customer hostname.");
        if (!ModelState.IsValid) return View(model);

        var client = await directory.CreateAsync(
            model.Name.Trim(),
            (model.City ?? string.Empty).Trim(),
            model.Contact.Trim(),
            model.ContactEmail.Trim(),
            domain,
            adminDomain);

        TempData["Notice"] = $"{client.Name} was created.";
        return RedirectToAction("Details", "Clients", new { area = "Platform", id = client.Id });
    }
}

[Area("Platform"), Authorize(Roles = "Developer")]
public class DomainsController : Controller
{
    public IActionResult Index() => View();
}

[Area("Platform"), Authorize(Roles = "Developer")]
public class DeploymentsController(ClientDirectory directory) : Controller
{
    public IActionResult Index() => View();

    [HttpPost, ValidateAntiForgeryToken]
    public async Task<IActionResult> Move(string id, ClientStage stage)
    {
        if (Enum.IsDefined(stage)) await directory.SetStageAsync(id, stage);
        return RedirectToAction(nameof(Index));
    }

    [HttpPost, ValidateAntiForgeryToken]
    public IActionResult MoveTicket(string clientId, int number, ClientStage stage)
    {
        DemoWorkspaceStore.MoveTicket(clientId, number, stage);
        return RedirectToAction(nameof(Index));
    }
}
