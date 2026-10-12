using Microsoft.EntityFrameworkCore;
using TeamOmnifield.Web.Models;

namespace TeamOmnifield.Web.Data;

public class AppDbContext(DbContextOptions<AppDbContext> options) : DbContext(options)
{
    public DbSet<Category> Categories => Set<Category>();
    public DbSet<Product> Products => Set<Product>();
    public DbSet<Order> Orders => Set<Order>();
    public DbSet<OrderItem> OrderItems => Set<OrderItem>();
    public DbSet<AdminUser> AdminUsers => Set<AdminUser>();
    public DbSet<Customer> Customers => Set<Customer>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<Category>().HasIndex(x => x.Name).IsUnique();
        modelBuilder.Entity<Product>().Property(x => x.Price).HasPrecision(12, 2);
        modelBuilder.Entity<Order>().HasIndex(x => x.OrderNumber).IsUnique();
        modelBuilder.Entity<Order>().Property(x => x.Subtotal).HasPrecision(12, 2);
        modelBuilder.Entity<Order>().Property(x => x.DeliveryFee).HasPrecision(12, 2);
        modelBuilder.Entity<Order>().Property(x => x.Total).HasPrecision(12, 2);
        modelBuilder.Entity<OrderItem>().Property(x => x.UnitPrice).HasPrecision(12, 2);
        modelBuilder.Entity<OrderItem>().Property(x => x.LineTotal).HasPrecision(12, 2);
        modelBuilder.Entity<AdminUser>().HasIndex(x => x.Email).IsUnique();
        modelBuilder.Entity<Customer>().HasIndex(x => x.Email).IsUnique();
    }
}
