using System.Security.Claims;
using Microsoft.AspNetCore.Authentication;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using TeamOmnifield.Web.Data;
using TeamOmnifield.Web.Models;
using TeamOmnifield.Web.Services;
using TeamOmnifield.Web.ViewModels;

namespace TeamOmnifield.Web.Controllers;

/// <summary>Storefront sign-in and account creation for diners. Accounts live in the Customers table.</summary>
[Route("Customer")]
public class CustomerController(AppDbContext db, IPasswordHasher<Customer> hasher) : Controller
{
    [HttpGet("Login")]
    public async Task<IActionResult> Login(string? returnUrl = null)
    {
        if (await IsSignedIn()) return RedirectAfterAuth(returnUrl);
        ViewBag.ReturnUrl = SafeReturnUrl(returnUrl);
        // A failed sign-in redirects back here (Post/Redirect/Get); the message is in TempData so a refresh clears it.
        if (TempData["CustomerLoginErrors"] is string[] errors)
            foreach (var error in errors) ModelState.AddModelError(string.Empty, error);
        return View(new CustomerLoginViewModel { Email = TempData["CustomerLoginEmail"] as string ?? string.Empty });
    }

    [HttpPost("Login"), ValidateAntiForgeryToken]
    public async Task<IActionResult> Login(CustomerLoginViewModel model, string? returnUrl = null)
    {
        if (!ModelState.IsValid)
            return LoginFailed(model, returnUrl, ModelState.Values.SelectMany(v => v.Errors).Select(e => e.ErrorMessage).Where(m => !string.IsNullOrEmpty(m)).ToArray());

        var email = Normalize(model.Email);
        var customer = await db.Customers.SingleOrDefaultAsync(x => x.Email == email && x.IsActive);
        if (customer is null || hasher.VerifyHashedPassword(customer, customer.PasswordHash, model.Password) == PasswordVerificationResult.Failed)
            return LoginFailed(model, returnUrl, ["Invalid email or password."]);

        await SignIn(customer, model.RememberMe);
        return RedirectAfterAuth(returnUrl);
    }

    [HttpGet("Register")]
    public async Task<IActionResult> Register(string? returnUrl = null)
    {
        if (await IsSignedIn()) return RedirectAfterAuth(returnUrl);
        ViewBag.ReturnUrl = SafeReturnUrl(returnUrl);
        return View(new CustomerRegisterViewModel());
    }

    [HttpPost("Register"), ValidateAntiForgeryToken]
    public async Task<IActionResult> Register(CustomerRegisterViewModel model, string? returnUrl = null)
    {
        ViewBag.ReturnUrl = SafeReturnUrl(returnUrl);
        var email = Normalize(model.Email ?? string.Empty);
        if (ModelState.IsValid && await db.Customers.AnyAsync(x => x.Email == email))
            ModelState.AddModelError(nameof(model.Email), "An account with this email already exists. Please log in.");
        if (!ModelState.IsValid) return View(model); // keeps what the diner typed (passwords are never echoed back)

        var customer = new Customer { FullName = model.FullName.Trim(), Email = email, Phone = model.Phone.Trim() };
        customer.PasswordHash = hasher.HashPassword(customer, model.Password);
        db.Customers.Add(customer);
        try
        {
            await db.SaveChangesAsync();
        }
        catch (DbUpdateException)
        {
            // Lost a race with another sign-up for the same email.
            ModelState.AddModelError(nameof(model.Email), "An account with this email already exists. Please log in.");
            return View(model);
        }

        await SignIn(customer, rememberMe: true);
        return RedirectAfterAuth(returnUrl);
    }

    [HttpPost("Logout"), ValidateAntiForgeryToken]
    public async Task<IActionResult> Logout()
    {
        await HttpContext.SignOutAsync(CustomerAuth.Scheme);
        return Redirect("/");
    }

    private static string Normalize(string email) => email.Trim().ToLowerInvariant();

    private async Task<bool> IsSignedIn() => (await HttpContext.AuthenticateAsync(CustomerAuth.Scheme)).Succeeded;

    private string? SafeReturnUrl(string? returnUrl) => !string.IsNullOrWhiteSpace(returnUrl) && Url.IsLocalUrl(returnUrl) ? returnUrl : null;

    private IActionResult RedirectAfterAuth(string? returnUrl) => Redirect(SafeReturnUrl(returnUrl) ?? "/Menu");

    private RedirectToActionResult LoginFailed(CustomerLoginViewModel model, string? returnUrl, string[] errors)
    {
        TempData["CustomerLoginErrors"] = errors;
        TempData["CustomerLoginEmail"] = model.Email ?? string.Empty;
        return RedirectToAction(nameof(Login), new { returnUrl = SafeReturnUrl(returnUrl) });
    }

    private Task SignIn(Customer customer, bool rememberMe)
    {
        var claims = new[]
        {
            new Claim(ClaimTypes.NameIdentifier, customer.Id.ToString()),
            new Claim(ClaimTypes.Name, customer.FullName),
            new Claim(ClaimTypes.Email, customer.Email),
            new Claim(ClaimTypes.Role, CustomerAuth.Role)
        };
        var principal = new ClaimsPrincipal(new ClaimsIdentity(claims, CustomerAuth.Scheme));
        return HttpContext.SignInAsync(CustomerAuth.Scheme, principal, new AuthenticationProperties { IsPersistent = rememberMe });
    }
}
