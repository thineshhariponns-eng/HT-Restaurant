namespace TeamOmnifield.Web.Services;

public enum ClientStage { New, Onboarding, Development, Review, Production }

public class DemoClient
{
    public string Id { get; set; } = string.Empty;
    public string Code { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
    public string City { get; set; } = string.Empty;
    public string Contact { get; set; } = string.Empty;
    public string ContactEmail { get; set; } = string.Empty;
    public string Domain { get; set; } = string.Empty;
    public string? AdminDomain { get; set; }
    public ClientStage Stage { get; set; } = ClientStage.New;
    public int Progress { get; set; }
    public DateTime CreatedUtc { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedUtc { get; set; } = DateTime.UtcNow;

    /// <summary>Whatever admin host was configured, else the default derived from the domain.</summary>
    public string ResolvedAdminDomain =>
        string.IsNullOrWhiteSpace(AdminDomain) ? $"admin.{Domain.Split('.')[0]}.local" : AdminDomain;
}

public record ActivityEntry(string Time, string Client, string Event);

/// <summary>
/// Demo data for the consultant portal. Held in memory on purpose: this portal
/// tracks delivery work, not restaurant data, so it touches no database table.
/// Everything resets when the process restarts.
/// </summary>
public static class DemoClientStore
{
    private static readonly Lock Gate = new();

    private static readonly List<DemoClient> Clients =
    [
        new() { Id = "c-1", Code = "CL-001", Name = "HT Restaurant", City = "Erode", Contact = "Admin", ContactEmail = "admin@htrestaurant.com", Domain = "htrestaurant.com", Stage = ClientStage.Production, Progress = 100, CreatedUtc = new DateTime(2026, 9, 10), UpdatedUtc = new DateTime(2026, 9, 16) },
        new() { Id = "c-2", Code = "CL-002", Name = "Spice Garden", City = "Salem", Contact = "Meena R", ContactEmail = "meena@spicegarden.com", Domain = "spicegarden.com", Stage = ClientStage.Onboarding, Progress = 45, CreatedUtc = new DateTime(2026, 9, 11), UpdatedUtc = new DateTime(2026, 9, 16) },
        new() { Id = "c-3", Code = "CL-003", Name = "Coastal Bites", City = "Kochi", Contact = "Anand P", ContactEmail = "anand@coastalbites.com", Domain = "coastalbites.com", Stage = ClientStage.Development, Progress = 70, CreatedUtc = new DateTime(2026, 9, 5), UpdatedUtc = new DateTime(2026, 9, 15) },
        new() { Id = "c-4", Code = "CL-004", Name = "Urban Tiffin", City = "Coimbatore", Contact = "Vikram S", ContactEmail = "vikram@urbantiffin.com", Domain = "urbantiffin.com", Stage = ClientStage.Development, Progress = 60, CreatedUtc = new DateTime(2026, 9, 4), UpdatedUtc = new DateTime(2026, 9, 15) },
        new() { Id = "c-5", Code = "CL-005", Name = "Royal Curry", City = "Madurai", Contact = "Fathima N", ContactEmail = "fathima@royalcurry.com", Domain = "royalcurry.com", Stage = ClientStage.Review, Progress = 85, CreatedUtc = new DateTime(2026, 8, 28), UpdatedUtc = new DateTime(2026, 9, 12) },
        new() { Id = "c-6", Code = "CL-006", Name = "Green Leaf Cafe", City = "Tiruppur", Contact = "Joseph K", ContactEmail = "joseph@greenleafcafe.com", Domain = "greenleafcafe.com", Stage = ClientStage.New, Progress = 10, CreatedUtc = new DateTime(2026, 9, 9), UpdatedUtc = new DateTime(2026, 9, 10) },
    ];

    private static readonly List<ActivityEntry> Activity =
    [
        new("21:05", "Spice Garden", "Admin hostname configured"),
        new("20:42", "Coastal Bites", "Moved to Development"),
        new("19:30", "HT Restaurant", "Onboarding completed"),
        new("18:12", "Urban Tiffin", "Menu import reviewed"),
        new("17:04", "Royal Curry", "Sent to Review"),
    ];

    /// <summary>The delivery pipeline, in order. Drives the board and the checklist.</summary>
    public static readonly ClientStage[] Pipeline =
        [ClientStage.New, ClientStage.Onboarding, ClientStage.Development, ClientStage.Review, ClientStage.Production];

    public static string Label(ClientStage stage) => stage switch
    {
        ClientStage.New => "New",
        ClientStage.Onboarding => "Onboarding",
        ClientStage.Development => "Development",
        ClientStage.Review => "QA / Review",
        _ => "Production",
    };

    /// <summary>How many onboarding steps each stage has signed off.</summary>
    public static int StepsDone(ClientStage stage) => stage switch
    {
        ClientStage.New => 1,
        ClientStage.Onboarding => 2,
        ClientStage.Development => 3,
        ClientStage.Review => 5,
        _ => 6,
    };

    public static readonly string[] Steps =
        ["Client created", "Domain configured", "Customer UI", "Admin UI", "QA review", "Production"];

    public static List<DemoClient> All()
    {
        lock (Gate) return [.. Clients];
    }

    public static DemoClient? ById(string id)
    {
        lock (Gate) return Clients.SingleOrDefault(x => x.Id == id);
    }

    public static int CountOf(ClientStage stage)
    {
        lock (Gate) return Clients.Count(x => x.Stage == stage);
    }

    public static List<ActivityEntry> RecentActivity()
    {
        lock (Gate) return [.. Activity];
    }

    public static List<ActivityEntry> ActivityFor(string clientName)
    {
        lock (Gate) return [.. Activity.Where(x => x.Client == clientName)];
    }

    public static void MoveTo(string id, ClientStage stage)
    {
        lock (Gate)
        {
            var client = Clients.SingleOrDefault(x => x.Id == id);
            if (client is null) return;
            client.Stage = stage;
            client.UpdatedUtc = DateTime.UtcNow;
            Activity.Insert(0, new ActivityEntry(DateTime.Now.ToString("HH:mm"), client.Name, $"Moved to {Label(stage)}"));
        }
    }

    public static DemoClient Add(string name, string city, string contact, string contactEmail, string domain, string adminDomain)
    {
        lock (Gate)
        {
            var next = Clients.Count + 1;
            var client = new DemoClient
            {
                Id = $"c-{next}",
                Code = $"CL-{next:000}",
                Name = name,
                City = city,
                Contact = contact,
                ContactEmail = contactEmail,
                Domain = domain,
                AdminDomain = adminDomain,
                Stage = ClientStage.New,
                Progress = 10,
            };
            Clients.Insert(0, client);
            Activity.Insert(0, new ActivityEntry(DateTime.Now.ToString("HH:mm"), name, "Client created"));
            return client;
        }
    }
}
