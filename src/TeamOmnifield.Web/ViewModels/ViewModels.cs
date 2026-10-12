using System.ComponentModel.DataAnnotations;
using TeamOmnifield.Web.Models;

namespace TeamOmnifield.Web.ViewModels;

public class CartLineViewModel
{
    public int ProductId { get; set; }
    public string Name { get; set; } = string.Empty;
    public decimal UnitPrice { get; set; }
    public int Quantity { get; set; }
    public decimal LineTotal => UnitPrice * Quantity;
}

public class CartViewModel
{
    public List<CartLineViewModel> Items { get; set; } = [];
    public decimal Subtotal => Items.Sum(x => x.LineTotal);
    public decimal DeliveryFee { get; set; }
    public decimal Total => Subtotal + DeliveryFee;
}

public class CheckoutViewModel
{
    [Required, StringLength(100)] public string CustomerName { get; set; } = string.Empty;
    [Required(ErrorMessage = "Enter your 10-digit mobile number.")]
    [RegularExpression(@"^[0-9]{10}$", ErrorMessage = "Phone number must be exactly 10 digits.")]
    public string Phone { get; set; } = string.Empty;
    [Required, StringLength(500)] public string DeliveryAddress { get; set; } = string.Empty;
    [StringLength(500)] public string? Notes { get; set; }
}

public class LoginViewModel
{
    [Required(ErrorMessage = "Enter your email address.")]
    [EmailAddress(ErrorMessage = "Enter a valid email address.")]
    public string Email { get; set; } = string.Empty;

    [Required(ErrorMessage = "Enter your password.")]
    [DataType(DataType.Password)]
    [RegularExpression(@"^(?=.*[^a-zA-Z0-9]).{8,}$", ErrorMessage = "Password must have at least 8 characters long with one special character.")]
    public string Password { get; set; } = string.Empty;
}

public class CustomerLoginViewModel
{
    [Required(ErrorMessage = "Enter your email address.")]
    [EmailAddress(ErrorMessage = "Enter a valid email address.")]
    public string Email { get; set; } = string.Empty;

    [Required(ErrorMessage = "Enter your password.")]
    [DataType(DataType.Password)]
    [RegularExpression(@"^(?=.*[^a-zA-Z0-9]).{8,}$", ErrorMessage = "Password must have at least 8 characters long with one special character.")]
    public string Password { get; set; } = string.Empty;

    public bool RememberMe { get; set; }
}

public class CustomerRegisterViewModel
{
    [Required(ErrorMessage = "Enter your full name."), StringLength(100)]
    public string FullName { get; set; } = string.Empty;

    [Required(ErrorMessage = "Enter your email address."), StringLength(160)]
    [EmailAddress(ErrorMessage = "Enter a valid email address.")]
    public string Email { get; set; } = string.Empty;

    [Required(ErrorMessage = "Enter your 10-digit mobile number.")]
    [RegularExpression(@"^[0-9]{10}$", ErrorMessage = "Phone number must be exactly 10 digits.")]
    public string Phone { get; set; } = string.Empty;

    [Required(ErrorMessage = "Create a password.")]
    [DataType(DataType.Password)]
    [MinLength(8, ErrorMessage = "Password must have at least 8 characters long with one special character.")]
    [RegularExpression(@"^(?=.*[^a-zA-Z0-9]).+$", ErrorMessage = "Password must include at least one special character.")]
    public string Password { get; set; } = string.Empty;

    [Required(ErrorMessage = "Confirm your password.")]
    [DataType(DataType.Password)]
    [Compare(nameof(Password), ErrorMessage = "The two passwords do not match.")]
    public string ConfirmPassword { get; set; } = string.Empty;
}

public class ResetPasswordViewModel
{
    [Required(ErrorMessage = "Enter your username (email address).")]
    [EmailAddress(ErrorMessage = "Enter a valid email address.")]
    public string Email { get; set; } = string.Empty;

    [Required(ErrorMessage = "Enter a new password.")]
    [DataType(DataType.Password)]
    [MinLength(8, ErrorMessage = "Password must have at least 8 characters long with one special character.")]
    [RegularExpression(@"^(?=.*[^a-zA-Z0-9]).+$")]
    public string NewPassword { get; set; } = string.Empty;

    [Required(ErrorMessage = "Confirm your new password.")]
    [DataType(DataType.Password)]
    [Compare(nameof(NewPassword), ErrorMessage = "The two passwords do not match.")]
    public string ConfirmPassword { get; set; } = string.Empty;
}

public class ProductEditViewModel
{
    public int Id { get; set; }
    [Required, StringLength(120)] public string Name { get; set; } = string.Empty;
    [StringLength(500)] public string Description { get; set; } = string.Empty;
    [Range(0.01, 100000)] public decimal Price { get; set; }
    [StringLength(500)] public string ImageUrl { get; set; } = string.Empty;
    [Required] public int CategoryId { get; set; }
    public bool IsAvailable { get; set; } = true;
}

public class DashboardViewModel
{
    public int TotalOrdersToday { get; set; }
    public decimal SalesToday { get; set; }
    public int PendingOrders { get; set; }
    public int PreparingOrders { get; set; }
    public int ReadyOrders { get; set; }
    public int DeliveredOrders { get; set; }
    public int CancelledOrders { get; set; }
    public List<MenuHighlightViewModel> MenuHighlights { get; set; } = [];
}

public class MenuHighlightViewModel
{
    public string Name { get; set; } = string.Empty;
    public string ImageUrl { get; set; } = string.Empty;
}

public class OrderListItemViewModel
{
    public int Id { get; set; }
    public string OrderNumber { get; set; } = string.Empty;
    public string CustomerName { get; set; } = string.Empty;
    public string Phone { get; set; } = string.Empty;
    public decimal Total { get; set; }
    public OrderStatus Status { get; set; }
    public DateTime CreatedUtc { get; set; }
}

public class OrderHistoryViewModel
{
    public string Phone { get; set; } = string.Empty;
    /// <summary>True once a lookup has run, so the page can tell "no results" from "not asked yet".</summary>
    public bool Searched { get; set; }
    public List<OrderListItemViewModel> Orders { get; set; } = [];
}

public class NewClientViewModel
{
    [Required, StringLength(120)] public string Name { get; set; } = string.Empty;
    [StringLength(80)] public string? City { get; set; }
    [Required, StringLength(120)] public string Contact { get; set; } = string.Empty;
    [Required, EmailAddress, StringLength(160)] public string ContactEmail { get; set; } = string.Empty;
    [Required, StringLength(160)]
    [RegularExpression(@"^[a-z0-9]([a-z0-9-]*[a-z0-9])?(\.[a-z0-9]([a-z0-9-]*[a-z0-9])?)+$", ErrorMessage = "Use a hostname such as spicegarden.com — lowercase, no protocol.")]
    public string Domain { get; set; } = string.Empty;
    [Required, StringLength(160)]
    [RegularExpression(@"^[a-z0-9]([a-z0-9-]*[a-z0-9])?(\.[a-z0-9]([a-z0-9-]*[a-z0-9])?)+$", ErrorMessage = "Use a hostname such as admin.spicegarden.local — lowercase, no protocol.")]
    public string AdminDomain { get; set; } = string.Empty;
}
