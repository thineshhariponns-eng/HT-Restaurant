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
    /// <summary>False while the workspace is suspended.</summary>
    public bool IsActive { get; set; } = true;
    /// <summary>The client this application itself serves. It cannot be deleted.</summary>
    public bool IsBuiltIn { get; set; }
    public int Progress { get; set; }
    public DateTime CreatedUtc { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedUtc { get; set; } = DateTime.UtcNow;

    /// <summary>Whatever admin host was configured, else the default derived from the domain.</summary>
    public string ResolvedAdminDomain =>
        string.IsNullOrWhiteSpace(AdminDomain) ? $"admin.{Domain.Split('.')[0]}.local" : AdminDomain;
}

public record ActivityEntry(string Time, string Client, string Event);

/// <summary>
/// The platform portal's in-memory view of its clients. The records themselves are stored in the
/// database and written through <see cref="ClientDirectory"/>; this copy is what the views read.
/// Activity entries are not stored, so they reset when the process restarts.
/// </summary>
public static class DemoClientStore
{
    private static readonly Lock Gate = new();

    private static readonly List<DemoClient> Clients = [];

    private static readonly List<ActivityEntry> Activity = [];

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

    /// <summary>A client's progress follows its stage; a brand new client still shows a sliver.</summary>
    public static int ProgressOf(ClientStage stage) => Math.Max(10, StageProgress(stage));

    /// <summary>Replaces the whole list with what the database holds. Called once at startup.</summary>
    public static void Hydrate(IEnumerable<DemoClient> clients)
    {
        lock (Gate)
        {
            Clients.Clear();
            Clients.AddRange(clients);
        }
    }

    /// <summary>Adds a client, or swaps in its updated record, and notes what happened in "Recent activity".</summary>
    public static void Put(DemoClient client, string eventText)
    {
        lock (Gate)
        {
            var index = Clients.FindIndex(x => x.Id == client.Id);
            if (index < 0) Clients.Insert(0, client);
            else Clients[index] = client;
            Activity.Insert(0, new ActivityEntry(DateTime.Now.ToString("HH:mm"), client.Name, eventText));
        }
    }

    public static void Remove(string id)
    {
        lock (Gate)
        {
            var client = Clients.SingleOrDefault(x => x.Id == id);
            if (client is null) return;
            Clients.Remove(client);
            Activity.Insert(0, new ActivityEntry(DateTime.Now.ToString("HH:mm"), client.Name, "Client deleted"));
        }
    }
}
