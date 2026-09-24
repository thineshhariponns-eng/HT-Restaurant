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

    private static readonly List<DemoClient> Clients = [];

    private static readonly List<ActivityEntry> Activity = [];

    /// <summary>The delivery pipeline, in order. Drives the board and the checklist.</summary>
    public static readonly ClientStage[] Pipeline =
        [ClientStage.New, ClientStage.Onboarding, ClientStage.Development, ClientStage.Review, ClientStage.Production];

    static DemoClientStore() => SeedSampleClients();

    /// <summary>Three sample clients at different stages, with projects, tickets, deployments and changes, so the portal has something to show.</summary>
    private static void SeedSampleClients()
    {
        (string Name, string City, string Contact, string Email, string Domain, string Admin, ClientStage Stage, int Progress, int DaysAgo)[] samples =
        [
            ("Urban Tandoor", "Bengaluru", "Meera Iyer", "meera@urbantandoor.in", "urbantandoor.local", "admin.urbantandoor.local", ClientStage.Onboarding, 35, 3),
            ("Coastal Kitchen", "Kochi", "Arjun Nair", "arjun@coastalkitchen.in", "coastalkitchen.local", "admin.coastalkitchen.local", ClientStage.Development, 60, 12),
            ("Spice Garden", "Chennai", "Priya Raman", "priya@spicegarden.in", "spicegarden.local", "admin.spicegarden.local", ClientStage.Production, 100, 40),
            ("HT Restaurant", "Chennai & Hyderabad", "Harsha Robba", "harsha@htrestaurant.com", "htrestaurant.com", "admin.htrestaurant.com", ClientStage.Production, 100, 60),
        ];

        foreach (var s in samples)
        {
            var next = Clients.Count + 1;
            var created = DateTime.UtcNow.AddDays(-s.DaysAgo);
            Clients.Insert(0, new DemoClient
            {
                Id = $"c-{next}", Code = $"CL-{next:000}", Name = s.Name, City = s.City, Contact = s.Contact,
                ContactEmail = s.Email, Domain = s.Domain, AdminDomain = s.Admin, Stage = s.Stage,
                Progress = s.Progress, CreatedUtc = created, UpdatedUtc = DateTime.UtcNow.AddDays(-s.DaysAgo / 4.0),
            });
            Activity.Insert(0, new ActivityEntry(created.ToLocalTime().ToString("HH:mm"), s.Name, "Client created"));
            Activity.Insert(0, new ActivityEntry(DateTime.Now.AddMinutes(-next * 17).ToString("HH:mm"), s.Name, $"Moved to {Label(s.Stage)}"));
            // HT Restaurant runs one site per city instead of the two default projects.
            if (s.Domain != "htrestaurant.com") DemoWorkspaceStore.SeedDefaults($"c-{next}");
        }

        DemoWorkspaceStore.SeedSampleWork();
    }

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
            DemoWorkspaceStore.SeedDefaults(client.Id);
            return client;
        }
    }
}
