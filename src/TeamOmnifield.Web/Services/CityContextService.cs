namespace TeamOmnifield.Web.Services;

public record CityInfo(string Slug, string Name, string Street, string HouseNumber, string StateZip, string Email)
{
    public string Address => $"{HouseNumber}, {Street}, {Name}, {StateZip}";
    public string AddressLine1 => $"{HouseNumber}, {Street},";
    public string AddressLine2 => $"{Name}, {StateZip}";
}

// Resolves the kitchen (name, address, email) the visitor picked from the Locations pop-up, remembered in a cookie
// so the header/footer of every area (customer storefront, Admin, Platform) show the same one.
public class CityContextService(IHttpContextAccessor accessor)
{
    public const string CookieName = "City";

    public static readonly IReadOnlyDictionary<string, CityInfo> Cities = new Dictionary<string, CityInfo>
    {
        ["chennai"] = new("chennai", "Chennai", "Mount Road, Guindy", "24", "Tamil Nadu 600032", "info@htrestaurantchennai.in"),
        ["hyderabad"] = new("hyderabad", "Hyderabad", "Road No. 3, Banjara Hills", "18", "Telangana 500034", "info@htrestauranthyderabad.in"),
        ["kolkata"] = new("kolkata", "Kolkata", "Park Street", "9", "West Bengal 700016", "info@htrestaurantkolkata.in"),
    };

    // Shown everywhere until a visitor picks one of the cities above.
    public static readonly CityInfo DefaultCity = new("erode", "Erode", "Perundurai Road", "142", "Tamil Nadu 638011", "hello@htrestauranterode.in");

    public CityInfo Current
    {
        get
        {
            var slug = accessor.HttpContext?.Request.Cookies[CookieName];
            return slug is not null && Cities.TryGetValue(slug, out var city) ? city : DefaultCity;
        }
    }
}
