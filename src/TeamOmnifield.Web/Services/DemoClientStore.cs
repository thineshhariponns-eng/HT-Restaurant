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

    static DemoClientStore() => SeedRealClient();

    /// <summary>
    /// This portal manages one real client: HT Restaurant itself. No fictional sample clients,
    /// tickets, deployments or changes are seeded - everything else in the portal is built from
    /// real activity (tickets raised from the admin portal, deployments and changes logged here).
    /// </summary>
    private static void SeedRealClient()
    {
        var client = new DemoClient
        {
            Id = "c-1", Code = "CL-001", Name = "HT Restaurant", City = "Chennai, Hyderabad & Kolkata",
            Contact = "Harsha Robba", ContactEmail = "harsha@htrestaurant.com",
            Domain = "htrestaurant.com", AdminDomain = "admin.htrestaurant.com",
            Stage = ClientStage.Production, Progress = 100,
        };
        Clients.Add(client);
        // One project per city; tickets raised from the admin portal route to the selected city's project.
        DemoWorkspaceStore.AddProject(client.Id, "htrestaurant.chennai.com");
        DemoWorkspaceStore.AddProject(client.Id, "htrestaurant.hyderabad.com");
        DemoWorkspaceStore.AddProject(client.Id, "htrestaurant.kolkata.com");
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

    /// <summary>A ticket has no progress number of its own, so its stage stands in for one on the Dashboard.</summary>
    public static int StageProgress(ClientStage stage) => stage switch
    {
        ClientStage.New => 0,
        ClientStage.Onboarding => 25,
        ClientStage.Development => 50,
        ClientStage.Review => 75,
        _ => 100,
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

    /// <summary>Drops an entry into "Recent activity" on the Dashboard, e.g. when a ticket is raised.</summary>
    public static void LogActivity(string clientId, string eventText)
    {
        lock (Gate)
        {
            var client = Clients.SingleOrDefault(x => x.Id == clientId);
            if (client is null) return;
            Activity.Insert(0, new ActivityEntry(DateTime.Now.ToString("HH:mm"), client.Name, eventText));
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
