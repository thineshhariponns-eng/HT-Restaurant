using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using TeamOmnifield.Web.Services;

namespace TeamOmnifield.Web.Controllers.Admin;

/// <summary>Lets an admin pick which location's orders, counts and products-of-record they are working on.</summary>
[Area("Admin"), Authorize(Roles = "Admin")]
public class LocationController : Controller
{
    [HttpPost, ValidateAntiForgeryToken]
    public IActionResult Set(string slug, string? returnUrl)
    {
        if (CityContextService.Cities.ContainsKey(slug))
            Response.Cookies.Append(CityContextService.CookieName, slug, new CookieOptions { Expires = DateTimeOffset.UtcNow.AddYears(1), IsEssential = true, SameSite = SameSiteMode.Lax });
        // Order details of another city would 404, so only return to list-type pages.
        var target = Url.IsLocalUrl(returnUrl) && !returnUrl!.Contains("/Details", StringComparison.OrdinalIgnoreCase) && !returnUrl.Contains("/Edit", StringComparison.OrdinalIgnoreCase) ? returnUrl : "/Admin";
        return LocalRedirect(target);
    }
}
