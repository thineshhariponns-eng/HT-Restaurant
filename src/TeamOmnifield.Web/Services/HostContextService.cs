namespace TeamOmnifield.Web.Services;

public enum SiteHost { Restaurant, Admin, TeamOmnifield, Unknown }

public class HostContextService(IHttpContextAccessor accessor)
{
    public SiteHost Current
    {
        get
        {
            var host = accessor.HttpContext?.Request.Host.Host.ToLowerInvariant();
            return host switch
            {
                "htrestaurant.com" or "www.htrestaurant.com" => SiteHost.Restaurant,
                "admin.htrestaurant.com" => SiteHost.Admin,
                "teamomnifield.ai" => SiteHost.TeamOmnifield,
                _ => SiteHost.Unknown
            };
        }
    }
}
