using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using TeamOmnifield.Web.Services;

namespace TeamOmnifield.Web.Controllers.Admin;

[Area("Admin"), Authorize(Roles = "Admin")]
public class DashboardController(OrderService orders, CityContextService cityContext) : Controller
{
    // Counts cover only the location the admin has selected.
    public async Task<IActionResult> Index() => View(await orders.GetDashboardAsync(cityContext.Current.Slug));
}
