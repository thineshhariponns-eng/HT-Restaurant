using System.Security.Claims;
using Microsoft.AspNetCore.Authentication;
using Microsoft.AspNetCore.Authentication.Cookies;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using TeamOmnifield.Web.Data;
using TeamOmnifield.Web.Models;
using TeamOmnifield.Web.ViewModels;

namespace TeamOmnifield.Web.Controllers;

public class AccountController(AppDbContext db, IPasswordHasher<AdminUser> hasher) : Controller
{
    [HttpGet]
    public IActionResult Login(string? returnUrl = null)
    {
        // A failed sign-in redirects back here (Post/Redirect/Get) so a refresh never re-submits the form.
        // The message lives in TempData, which is gone after this one request - so it does not survive a refresh.
        if (TempData["LoginErrors"] is string[] errors)
            foreach (var error in errors) ModelState.AddModelError(string.Empty, error);
        return View(new LoginViewModel { Email = TempData["LoginEmail"] as string ?? string.Empty });
    }

    [HttpPost, ValidateAntiForgeryToken]
    public async Task<IActionResult> Login(LoginViewModel model, string? returnUrl = null)
    {
        if (!ModelState.IsValid)
            return LoginFailed(model, returnUrl, ModelState.Values.SelectMany(v => v.Errors).Select(e => e.ErrorMessage).Where(m => !string.IsNullOrEmpty(m)).ToArray());
        var user = await db.AdminUsers.SingleOrDefaultAsync(x => x.Email == model.Email && x.IsActive);
        if (user is null || hasher.VerifyHashedPassword(user, user.PasswordHash, model.Password) == PasswordVerificationResult.Failed)
        {
            return LoginFailed(model, returnUrl, ["Invalid email or password."]);
        }
        var role = RoleFor(user.Email);
        var claims = new[] { new Claim(ClaimTypes.NameIdentifier, user.Id.ToString()), new Claim(ClaimTypes.Name, user.DisplayName), new Claim(ClaimTypes.Email, user.Email), new Claim(ClaimTypes.Role, role) };
        await HttpContext.SignInAsync(CookieAuthenticationDefaults.AuthenticationScheme, new ClaimsPrincipal(new ClaimsIdentity(claims, CookieAuthenticationDefaults.AuthenticationScheme)));
        if (!string.IsNullOrWhiteSpace(returnUrl) && Url.IsLocalUrl(returnUrl)) return Redirect(returnUrl);
        return role == DeveloperRole
            ? RedirectToAction("Index", "Dashboard", new { area = "Platform" })
            : RedirectToAction("Index", "Dashboard", new { area = "Admin" });
    }

    private RedirectToActionResult LoginFailed(LoginViewModel model, string? returnUrl, string[] errors)
    {
        TempData["LoginErrors"] = errors;
        TempData["LoginEmail"] = model.Email ?? string.Empty;
        return RedirectToAction(nameof(Login), new { returnUrl = Url.IsLocalUrl(returnUrl) ? returnUrl : null });
    }

    [HttpGet]
    public IActionResult ForgotPassword()
    {
        if (TempData["ResetErrors"] is string[] errors)
            foreach (var error in errors) ModelState.AddModelError(string.Empty, error);
        return View(new ResetPasswordViewModel { Email = TempData["ResetEmail"] as string ?? string.Empty });
    }

    // Sets a new password for the given username. Failures redirect back (Post/Redirect/Get) so a refresh never re-submits the form.
    [HttpPost, ValidateAntiForgeryToken]
    public async Task<IActionResult> ForgotPassword(ResetPasswordViewModel model, string? returnUrl = null)
    {
        IActionResult Fail(params string[] errors)
        {
            TempData["ResetErrors"] = errors;
            TempData["ResetEmail"] = model.Email ?? string.Empty;
            return RedirectToAction(nameof(ForgotPassword), new { returnUrl = Url.IsLocalUrl(returnUrl) ? returnUrl : null });
        }

        if (!ModelState.IsValid)
            return Fail(ModelState.Values.SelectMany(v => v.Errors).Select(e => e.ErrorMessage).Where(m => !string.IsNullOrEmpty(m)).ToArray());

        var email = model.Email.Trim();
        var user = await db.AdminUsers.SingleOrDefaultAsync(x => x.Email == email && x.IsActive);
        if (user is null) return Fail("No account found for that username.");

        user.PasswordHash = hasher.HashPassword(user, model.NewPassword);
        await db.SaveChangesAsync();
        TempData["LoginNotice"] = "Your password has been updated. Sign in with your new password.";
        TempData["LoginEmail"] = user.Email;
        return RedirectToAction(nameof(Login), new { returnUrl = Url.IsLocalUrl(returnUrl) ? returnUrl : null });
    }

    [HttpPost, ValidateAntiForgeryToken]
    public async Task<IActionResult> Logout()
    {
        await HttpContext.SignOutAsync(CookieAuthenticationDefaults.AuthenticationScheme);
        return RedirectToAction(nameof(Login));
    }

    public IActionResult Denied() => View();

    public const string AdminRole = "Admin";
    public const string DeveloperRole = "Developer";

    /// <summary>The consultant account drives the platform portal; every other account is an operator.</summary>
    private static string RoleFor(string email) =>
        email.Equals("developer@htrestaurant.com", StringComparison.OrdinalIgnoreCase) ? DeveloperRole : AdminRole;
}
