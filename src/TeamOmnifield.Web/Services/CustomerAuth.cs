using Microsoft.AspNetCore.Authentication;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.Filters;

namespace TeamOmnifield.Web.Services;

public static class CustomerAuth
{
    public const string Scheme = "Customer";
    public const string Role = "Customer";

    /// <summary>
    /// Makes a signed-in diner the request's User on every storefront request (unless an admin is signed in).
    /// Antiforgery tokens are bound to the current user, so the user must be the same on the page that renders a
    /// form (e.g. Menu) and on the POST it submits to (e.g. Cart/Add) - otherwise the POST fails with a 400.
    /// </summary>
    public static async Task ApplyCustomerUser(HttpContext context, Func<Task> next)
    {
        if (context.User.Identity?.IsAuthenticated != true)
        {
            var result = await context.AuthenticateAsync(Scheme);
            if (result.Succeeded) context.User = result.Principal!;
        }
        await next();
    }
}

/// <summary>Requires a signed-in diner; otherwise sends the visitor to the customer login. Leaves HttpContext.User untouched.</summary>
[AttributeUsage(AttributeTargets.Class | AttributeTargets.Method)]
public sealed class CustomerOnlyAttribute : Attribute, IAsyncAuthorizationFilter
{
    public async Task OnAuthorizationAsync(AuthorizationFilterContext context)
    {
        var result = await context.HttpContext.AuthenticateAsync(CustomerAuth.Scheme);
        if (!result.Succeeded) context.Result = new ChallengeResult(CustomerAuth.Scheme);
    }
}
