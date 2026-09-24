using Microsoft.AspNetCore.Authentication.Cookies;
using Microsoft.AspNetCore.DataProtection;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using TeamOmnifield.Web.Data;
using TeamOmnifield.Web.Models;
using TeamOmnifield.Web.Services;

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddControllersWithViews();
builder.Services.AddDbContext<AppDbContext>(options =>
    options.UseNpgsql(builder.Configuration.GetConnectionString("DefaultConnection")));
builder.Services.AddHttpContextAccessor();
builder.Services.AddSession(options =>
{
    options.IdleTimeout = TimeSpan.FromHours(4);
    options.Cookie.HttpOnly = true;
    options.Cookie.IsEssential = true;
});
builder.Services.AddAuthentication(CookieAuthenticationDefaults.AuthenticationScheme)
    .AddCookie(options =>
    {
        options.LoginPath = "/Account/Login";
        options.AccessDeniedPath = "/Account/Denied";
        options.Cookie.Name = "TeamOmnifield.Admin";
        options.ExpireTimeSpan = TimeSpan.FromHours(8);
        options.SlidingExpiration = true;
    });
builder.Services.AddAuthorization();
builder.Services.AddScoped<IPasswordHasher<AdminUser>, PasswordHasher<AdminUser>>();
builder.Services.AddScoped<OrderService>();
builder.Services.AddScoped<CartService>();
builder.Services.AddScoped<HostContextService>();
builder.Services.AddScoped<CityContextService>();
builder.Services.AddHttpClient<TurnstileService>();
// Persist to the mounted volume (see docker-compose.yml) so a container rebuild/restart doesn't invalidate
// every visitor's session, login and CSRF cookies - previously keys lived in the ephemeral container filesystem.
builder.Services.AddDataProtection()
    .SetApplicationName("TeamOmnifield.Web")
    .PersistKeysToFileSystem(new DirectoryInfo("/root/.aspnet/DataProtection-Keys"));

var app = builder.Build();

// The consultant demo data is seeded by DemoClientStore's static constructor. The admin portal only
// reads the workspace store, so touch it once at startup rather than depend on which page is hit first.
_ = DemoClientStore.All();

using (var scope = app.Services.CreateScope())
{
    var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
    var hasher = scope.ServiceProvider.GetRequiredService<IPasswordHasher<AdminUser>>();
    await DbInitializer.InitializeAsync(db, hasher);
}

app.UseExceptionHandler("/Home/Error");
// Skip /api and /health: they must keep returning plain JSON/empty 404s, not an HTML page, for API callers.
app.UseWhen(
    ctx => !ctx.Request.Path.StartsWithSegments("/api") && !ctx.Request.Path.StartsWithSegments("/health"),
    branch => branch.UseStatusCodePagesWithReExecute("/error/{0}"));
app.UseStaticFiles();
app.UseRouting();
app.UseSession();
app.UseAuthentication();
app.UseAuthorization();

app.MapGet("/health", async (AppDbContext db) =>
{
    var databaseOk = await db.Database.CanConnectAsync();
    return databaseOk ? Results.Ok(new { status = "healthy", database = "connected" }) : Results.StatusCode(503);
});

app.MapGet("/api/orders/{orderNumber}", async (string orderNumber, OrderService orders) =>
{
    var order = await orders.GetByOrderNumberAsync(orderNumber);
    return order is null ? Results.NotFound() : Results.Ok(new
    {
        order.OrderNumber, order.CustomerName, order.Status, order.Subtotal, order.DeliveryFee, order.Total,
        order.CreatedUtc,
        Items = order.Items.Select(x => new { x.ProductNameSnapshot, x.UnitPrice, x.Quantity, x.LineTotal })
    });
});

app.MapControllerRoute(name: "areas", pattern: "{area:exists}/{controller=Dashboard}/{action=Index}/{id?}");
app.MapControllerRoute(name: "default", pattern: "{controller=Home}/{action=Index}/{id?}");

app.Run();

public partial class Program { }
