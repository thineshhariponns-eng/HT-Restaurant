using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using TeamOmnifield.Web.Services;

namespace TeamOmnifield.Web.Controllers;

[Authorize]
public class TeamController(OrderService orders) : Controller
{
    public async Task<IActionResult> Index() => View(await orders.GetDashboardAsync());
}
