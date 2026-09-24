namespace TeamOmnifield.Web.Services;

public enum DeployState { NotDeployed, Live, Failed }

public class DemoProject
{
    public string Id { get; set; } = string.Empty;
    public string ClientId { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
    public DateTime CreatedUtc { get; set; } = DateTime.UtcNow;
}

public class DemoDeployment
{
    public string ProjectId { get; set; } = string.Empty;
    public string Version { get; set; } = string.Empty;
    public DeployState State { get; set; }
    public string Notes { get; set; } = string.Empty;
    public string By { get; set; } = string.Empty;
    public DateTime DeployedUtc { get; set; } = DateTime.UtcNow;
}

public class DemoChange
{
    public string ProjectId { get; set; } = string.Empty;
    public string What { get; set; } = string.Empty;
    public string Before { get; set; } = string.Empty;
    public string After { get; set; } = string.Empty;
    public string By { get; set; } = string.Empty;
    public DateTime ChangedUtc { get; set; } = DateTime.UtcNow;
}

public record TicketComment(string Author, string Body, DateTime PostedUtc, string? Event = null);

public class DemoTicket
{
    public int Number { get; set; }
    public string ProjectId { get; set; } = string.Empty;
    public string Title { get; set; } = string.Empty;
    public string Author { get; set; } = string.Empty;
    public bool IsOpen { get; set; } = true;
    /// <summary>Where the ticket was raised from, e.g. the restaurant's admin portal. Empty when raised by the consultant.</summary>
    public string Source { get; set; } = string.Empty;
    public DateTime CreatedUtc { get; set; } = DateTime.UtcNow;
    /// <summary>The opening post is the first entry; later entries are replies and open/close events.</summary>
    public List<TicketComment> Thread { get; set; } = [];
}

/// <summary>
/// Projects, tickets, deployments and change history for each consultant-portal
/// client. In memory like <see cref="DemoClientStore"/>, so it resets on restart.
/// </summary>
public static class DemoWorkspaceStore
{
    /// <summary>The project that receives tickets raised from the restaurant admin portal.</summary>
    public const string AdminPortalProject = "htrestaurant.chennai.com";
    public const string AdminPortalSource = "Admin portal";

    public const int TitleMax = 120;
    public const int TextMax = 4000;

    private static readonly Lock Gate = new();
    private static readonly List<DemoProject> Projects = [];
    private static readonly List<DemoTicket> Tickets = [];
    private static readonly List<DemoDeployment> Deployments = [];
    private static readonly List<DemoChange> Changes = [];
    private static int nextProject = 1;
    private static int nextTicket = 1;

    public static string StateLabel(DeployState state) => state switch
    {
        DeployState.Live => "Live",
        DeployState.Failed => "Failed",
        _ => "Not deployed",
    };

    /// <summary>Every client gets its two sites up front: what customers see and what the restaurant runs.</summary>
    public static void SeedDefaults(string clientId)
    {
        AddProject(clientId, "Customer website");
        AddProject(clientId, "Admin portal");
    }

    /// <summary>Sample tickets, deployments and changes for the clients seeded by <see cref="DemoClientStore"/> (c-1 Urban Tandoor, c-2 Coastal Kitchen, c-3 Spice Garden, c-4 HT Restaurant).</summary>
    public static void SeedSampleWork()
    {
        DateTime Ago(double days, double hours = 0) => DateTime.UtcNow.AddDays(-days).AddHours(-hours);

        string Site(string clientId, string name) => ProjectsOf(clientId).Single(x => x.Name == name).Id;
        var urbanSite = Site("c-1", "Customer website");
        var urbanAdmin = Site("c-1", "Admin portal");
        var coastalSite = Site("c-2", "Customer website");
        var coastalAdmin = Site("c-2", "Admin portal");
        var spiceSite = Site("c-3", "Customer website");
        var spiceAdmin = Site("c-3", "Admin portal");
        var spiceLoyalty = AddProject("c-3", "Loyalty programme").Id;
        var htChennai = AddProject("c-4", "htrestaurant.chennai.com").Id;
        var htHyderabad = AddProject("c-4", "htrestaurant.hyderabad.com").Id;

        lock (Gate)
        {
            void Deploy(string project, string version, DeployState state, string notes, double days, string by = "developer") =>
                Deployments.Add(new DemoDeployment { ProjectId = project, Version = version, State = state, Notes = notes, By = by, DeployedUtc = Ago(days) });

            void Change(string project, string what, string before, string after, double days) =>
                Changes.Add(new DemoChange { ProjectId = project, What = what, Before = before, After = after, By = "developer", ChangedUtc = Ago(days) });

            void Ticket(string project, string title, string author, double days, string body, bool open, params (string Author, string Text, double Days)[] replies)
            {
                var ticket = new DemoTicket { Number = nextTicket++, ProjectId = project, Title = title, Author = author, IsOpen = open, CreatedUtc = Ago(days) };
                ticket.Thread.Add(new TicketComment(author, body, Ago(days)));
                foreach (var (who, text, d) in replies) ticket.Thread.Add(new TicketComment(who, text, Ago(d)));
                if (!open) ticket.Thread.Add(new TicketComment("developer", string.Empty, Ago(days / 2), "closed this ticket"));
                Tickets.Add(ticket);
            }

            // Urban Tandoor: onboarding, nothing live yet.
            Deploy(urbanSite, "v0.1.0", DeployState.Failed, "First staging push. Build failed on missing menu images.", 2);
            Change(urbanSite, "Hero banner", "Placeholder stock photo", "Tandoor grill photo from the client", 2);
            Ticket(urbanSite, "Add vegetarian filter to the menu", "Meera Iyer", 2,
                "Guests keep asking which dishes are vegetarian.\n\n- Add a **Veg only** toggle above the menu\n- Show a green dot next to veg dishes", true,
                ("developer", "Scoped. Will ship with the next staging build.", 1));

            // Coastal Kitchen: in development, staging live.
            Deploy(coastalSite, "v0.4.0", DeployState.Live, "Menu and cart working on staging.", 6);
            Deploy(coastalSite, "v0.5.0", DeployState.Failed, "Payment provider keys missing on staging.", 3);
            Deploy(coastalSite, "v0.5.1", DeployState.Live, "Payment keys added. Checkout works end to end.", 2);
            Deploy(coastalAdmin, "v0.2.0", DeployState.Live, "Order queue and menu editor.", 4);
            Change(coastalSite, "Delivery fee", "Flat 40", "Free above 500, otherwise 40", 5);
            Change(coastalSite, "Brand colours", "Default gold on dark", "Teal and cream to match the logo", 4);
            Change(coastalAdmin, "Order sound", "Silent", "Chime when a new order arrives", 3);
            Ticket(coastalSite, "Checkout button hidden on small phones", "Arjun Nair", 5,
                "On a 360px wide phone the **Place order** button sits under the keyboard.\n\n1. Add item to cart\n2. Open checkout\n3. Tap the phone field", false,
                ("developer", "Reproduced. Button is now sticky at the bottom of the screen.", 4),
                ("Arjun Nair", "Confirmed fixed on my phone, thanks.", 3));
            Ticket(coastalAdmin, "Need a way to mark a dish sold out", "Arjun Nair", 1,
                "During lunch we run out of dishes. Can staff switch a dish to `sold out` without deleting it?", true);
            Ticket(coastalSite, "Show opening hours in the footer", "Arjun Nair", 0.5,
                "> Mon-Sat 11:00 to 23:00, Sun 12:00 to 22:00\n\nPlease add this to the footer and the contact page.", true,
                ("developer", "Which timezone should the closing time use for the \"open now\" badge?", 0.3));

            // Spice Garden: live in production.
            Deploy(spiceSite, "v1.0.0", DeployState.Live, "Launch.", 30);
            Deploy(spiceSite, "v1.1.0", DeployState.Live, "Order tracking page.", 14);
            Deploy(spiceSite, "v1.2.0", DeployState.Live, "Pickup orders and coupon codes.", 3);
            Deploy(spiceAdmin, "v1.0.0", DeployState.Live, "Launch.", 30);
            Deploy(spiceAdmin, "v1.1.0", DeployState.Failed, "Migration timed out. Rolled back.", 9);
            Deploy(spiceAdmin, "v1.1.1", DeployState.Live, "Migration split into two steps.", 8);
            Change(spiceSite, "Order tracking", "Customers phoned to ask about orders", "Live status page with a link in the confirmation email", 14);
            Change(spiceSite, "Order types", "Delivery only", "Delivery and pickup", 3);
            Change(spiceAdmin, "Dashboard", "Total orders only", "Orders, revenue and top dishes for the day", 8);
            Ticket(spiceSite, "Coupon code not applied to pickup orders", "Priya Raman", 4,
                "Coupon `WELCOME10` works for delivery but is ignored when I choose **Pickup**.", false,
                ("developer", "Found it: the discount was only calculated on the delivery path. Fixed in v1.2.0.", 3));
            Ticket(spiceAdmin, "Export orders to a spreadsheet", "Priya Raman", 2,
                "My accountant wants a monthly export.\n\n- Date range picker\n- CSV is fine", true,
                ("developer", "Planned for v1.3.0.", 1));
            Ticket(spiceSite, "Typo on the About page", "Priya Raman", 6, "It says \"Chenai\" instead of \"Chennai\".", false);
            Ticket(spiceLoyalty, "Kick-off: points per order", "developer", 1,
                "Draft rules to agree with the client:\n\n- [x] 1 point per 10 spent\n- [ ] Points expire after 12 months\n- [ ] Redeem at checkout", true);

            // HT Restaurant: one storefront per city. Chennai is settled, Hyderabad is newer and still bedding in.
            Deploy(htChennai, "v1.0.0", DeployState.Live, "Chennai launch: menu, cart, delivery and pickup.", 45);
            Deploy(htChennai, "v1.1.0", DeployState.Live, "Order tracking and email confirmations.", 28);
            Deploy(htChennai, "v1.2.0", DeployState.Failed, "Turnstile secret missing in production. Rolled back.", 10);
            Deploy(htChennai, "v1.2.1", DeployState.Live, "Turnstile secret added. Bot check on login and checkout.", 9);
            Deploy(htChennai, "v1.3.0", DeployState.Live, "Festival menu section and coupon codes.", 2);
            Deploy(htHyderabad, "v0.9.0", DeployState.Live, "Staging build for the Hyderabad menu review.", 20);
            Deploy(htHyderabad, "v1.0.0", DeployState.Live, "Hyderabad launch: biryani menu and delivery zones.", 12);
            Deploy(htHyderabad, "v1.0.1", DeployState.Failed, "Migration for delivery zones timed out on the shared database.", 4);
            Change(htChennai, "Delivery fee", "Flat 40", "Free above 500, otherwise 40", 20);
            Change(htChennai, "Login screen", "Separate admin and developer logins in the menu", "Single login that routes by role", 8);
            Change(htChennai, "Festival menu", "Regular menu only", "Seasonal section pinned above the regular menu", 2);
            Change(htHyderabad, "Signature dish", "Chicken biryani listed with the mains", "Hyderabadi dum biryani featured in the hero banner", 12);
            Change(htHyderabad, "Delivery zones", "One zone across the city", "Three zones: Banjara Hills, Gachibowli and Secunderabad", 5);
            Change(htHyderabad, "Opening hours", "11:00 to 23:00 daily", "11:00 to 23:30 on Fri and Sat", 3);
            Ticket(htChennai, "Order confirmation email lands in spam", "Harsha Robba", 7,
                "Several customers say the **order confirmation** email is in their spam folder.\n\n- Seen on Gmail and Outlook\n- Sender is `orders@htrestaurant.com`", false,
                ("developer", "SPF and DKIM records were missing for the sending domain. Added both.", 6),
                ("Harsha Robba", "Test order went to the inbox. Thanks.", 5));
            Ticket(htChennai, "Add a Tamil language option", "Harsha Robba", 3,
                "Our regular guests would like the menu in Tamil.\n\n1. Language switch in the header\n2. Dish names and descriptions\n3. Keep prices unchanged", true,
                ("developer", "Need the Tamil dish names from the kitchen before we start.", 2));
            Ticket(htChennai, "Coupon FESTIVE20 still accepted after it expired", "Harsha Robba", 1,
                "The code was meant to end on Sunday but a customer used it on Monday.", true);
            Ticket(htHyderabad, "Delivery zones page shows the wrong fee", "Harsha Robba", 4,
                "Gachibowli shows a fee of 40 but it should be 60.\n\n> Banjara Hills 40, Gachibowli 60, Secunderabad 50", true,
                ("developer", "Fee table was copied from Chennai. Fixing it in v1.0.2 once the migration is retried.", 3));
            Ticket(htHyderabad, "Biryani photos are too large on mobile", "Harsha Robba", 9,
                "The menu takes several seconds to load on 4G.", false,
                ("developer", "Images are now resized and served as WebP. Page is about 1.2 MB lighter.", 8));
            Ticket(htHyderabad, "Kitchen printer prints orders twice", "Harsha Robba", 0.5,
                "Since the last release every new order prints two tickets.", true);
        }
    }

    public static DemoProject AddProject(string clientId, string name)
    {
        lock (Gate)
        {
            var project = new DemoProject { Id = $"p-{nextProject++}", ClientId = clientId, Name = name };
            Projects.Add(project);
            return project;
        }
    }

    public static List<DemoProject> ProjectsOf(string clientId)
    {
        lock (Gate) return [.. Projects.Where(x => x.ClientId == clientId)];
    }

    public static DemoProject? ProjectById(string clientId, string projectId)
    {
        lock (Gate) return Projects.SingleOrDefault(x => x.Id == projectId && x.ClientId == clientId);
    }

    public static DemoProject? ProjectByName(string name)
    {
        lock (Gate) return Projects.FirstOrDefault(x => x.Name == name);
    }

    public static string ProjectName(string projectId)
    {
        lock (Gate) return Projects.SingleOrDefault(x => x.Id == projectId)?.Name ?? "Unknown project";
    }

    // ----- tickets -----

    /// <summary>Newest first.</summary>
    public static List<DemoTicket> TicketsOf(string clientId, string? projectId = null)
    {
        lock (Gate)
        {
            var ids = Projects.Where(x => x.ClientId == clientId && (projectId is null || x.Id == projectId)).Select(x => x.Id).ToHashSet();
            return [.. Tickets.Where(x => ids.Contains(x.ProjectId)).OrderByDescending(x => x.Number)];
        }
    }

    public static DemoTicket? TicketByNumber(string clientId, int number)
    {
        lock (Gate)
        {
            var ticket = Tickets.SingleOrDefault(x => x.Number == number);
            return ticket is not null && Projects.Any(p => p.Id == ticket.ProjectId && p.ClientId == clientId) ? Clone(ticket) : null;
        }
    }

    /// <summary>One ticket of one project, or null. Lets a portal that owns a single project keep out of its siblings' tickets.</summary>
    public static DemoTicket? TicketOfProject(string projectId, int number)
    {
        lock (Gate)
        {
            var ticket = Tickets.SingleOrDefault(x => x.Number == number && x.ProjectId == projectId);
            return ticket is null ? null : Clone(ticket);
        }
    }

    public static DemoTicket? RaiseTicket(string clientId, string projectId, string title, string body, string author, string source = "")
    {
        lock (Gate)
        {
            if (!Projects.Any(x => x.Id == projectId && x.ClientId == clientId)) return null;
            var ticket = new DemoTicket { Number = nextTicket++, ProjectId = projectId, Title = title, Author = author, Source = source };
            ticket.Thread.Add(new TicketComment(author, body, DateTime.UtcNow));
            Tickets.Add(ticket);
            return Clone(ticket);
        }
    }

    /// <summary>Adds a reply (when there is text) and optionally closes or reopens the ticket, as the comment box does.</summary>
    public static bool Reply(string clientId, int number, string author, string body, bool? setOpen)
    {
        lock (Gate)
        {
            var ticket = Tickets.SingleOrDefault(x => x.Number == number);
            if (ticket is null || !Projects.Any(p => p.Id == ticket.ProjectId && p.ClientId == clientId)) return false;

            if (body.Length > 0) ticket.Thread.Add(new TicketComment(author, body, DateTime.UtcNow));
            if (setOpen is { } open && open != ticket.IsOpen)
            {
                ticket.IsOpen = open;
                ticket.Thread.Add(new TicketComment(author, string.Empty, DateTime.UtcNow, open ? "reopened this ticket" : "closed this ticket"));
            }
            return true;
        }
    }

    private static DemoTicket Clone(DemoTicket t) => new()
    {
        Number = t.Number, ProjectId = t.ProjectId, Title = t.Title, Author = t.Author,
        IsOpen = t.IsOpen, Source = t.Source, CreatedUtc = t.CreatedUtc, Thread = [.. t.Thread],
    };

    // ----- deployments -----

    /// <summary>Newest first.</summary>
    public static List<DemoDeployment> DeploymentsOf(string projectId)
    {
        lock (Gate) return [.. Deployments.Where(x => x.ProjectId == projectId).OrderByDescending(x => x.DeployedUtc)];
    }

    public static DemoDeployment? LatestDeployment(string projectId)
    {
        lock (Gate) return Deployments.Where(x => x.ProjectId == projectId).OrderByDescending(x => x.DeployedUtc).FirstOrDefault();
    }

    public static bool Deploy(string clientId, string projectId, string version, DeployState state, string notes, string by)
    {
        lock (Gate)
        {
            if (!Projects.Any(x => x.Id == projectId && x.ClientId == clientId)) return false;
            Deployments.Add(new DemoDeployment { ProjectId = projectId, Version = version, State = state, Notes = notes, By = by });
            return true;
        }
    }

    // ----- changes -----

    /// <summary>Newest first.</summary>
    public static List<DemoChange> ChangesOf(string clientId, string? projectId = null)
    {
        lock (Gate)
        {
            var ids = Projects.Where(x => x.ClientId == clientId && (projectId is null || x.Id == projectId)).Select(x => x.Id).ToHashSet();
            return [.. Changes.Where(x => ids.Contains(x.ProjectId)).OrderByDescending(x => x.ChangedUtc)];
        }
    }

    public static bool LogChange(string clientId, string projectId, string what, string before, string after, string by)
    {
        lock (Gate)
        {
            if (!Projects.Any(x => x.Id == projectId && x.ClientId == clientId)) return false;
            Changes.Add(new DemoChange { ProjectId = projectId, What = what, Before = before, After = after, By = by });
            return true;
        }
    }
}
