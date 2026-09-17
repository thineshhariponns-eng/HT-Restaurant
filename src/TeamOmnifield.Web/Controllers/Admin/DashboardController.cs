using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using TeamOmnifield.Web.Services;

namespace TeamOmnifield.Web.Controllers.Admin;

[Area("Admin"), Authorize]
public class DashboardController(OrderService orders) : Controller
{
    public async Task<IActionResult> Index() => View(await orders.GetDashboardAsync());
}
