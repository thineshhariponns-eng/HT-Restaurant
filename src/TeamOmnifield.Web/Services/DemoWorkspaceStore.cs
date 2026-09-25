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
    /// <summary>Where the ticket sits in the same delivery pipeline as clients (see <see cref="ClientStage"/>) -
    /// shown and moved on the Deployments board, independent of open/closed.</summary>
    public ClientStage Stage { get; set; } = ClientStage.New;
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
    /// <summary>
    /// The project that receives tickets raised from the restaurant admin portal for a given city -
    /// one of "chennai", "hyderabad" or "kolkata" (see <see cref="CityContextService"/>). A ticket raised
    /// while Chennai is selected lands only in "htrestaurant.chennai.com", never in the Hyderabad or Kolkata project.
    /// </summary>
    public static string AdminPortalProject(string citySlug) => $"htrestaurant.{citySlug}.com";
    public const string AdminPortalSource = "Admin portal";

    /// <summary>City slugs that have their own project (see <see cref="CityContextService.Cities"/>).</summary>
    public static readonly string[] Cities = ["chennai", "hyderabad", "kolkata"];

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

    public record TicketSummary(DemoTicket Ticket, string ClientId, string ProjectId);

    /// <summary>Newest tickets across every client and project, for the Dashboard's "Recent tickets" panel.</summary>
    public static List<TicketSummary> RecentTickets(int count)
    {
        lock (Gate)
        {
            var byProject = Projects.ToDictionary(p => p.Id, p => p.ClientId);
            return [.. Tickets.OrderByDescending(t => t.Number).Take(count)
                .Select(t => new TicketSummary(Clone(t), byProject.GetValueOrDefault(t.ProjectId, ""), t.ProjectId))];
        }
    }

    /// <summary>Every open ticket across every client and project, for the Deployments board - unlike
    /// <see cref="RecentTickets"/> this is not capped, since a ticket must stay visible in its column
    /// no matter how many newer tickets exist.</summary>
    public static List<TicketSummary> AllOpenTickets()
    {
        lock (Gate)
        {
            var byProject = Projects.ToDictionary(p => p.Id, p => p.ClientId);
            return [.. Tickets.Where(t => t.IsOpen).OrderByDescending(t => t.Number)
                .Select(t => new TicketSummary(Clone(t), byProject.GetValueOrDefault(t.ProjectId, ""), t.ProjectId))];
        }
    }

    /// <summary>Moves a ticket to a new pipeline stage, the way a client card is dragged between Deployments columns.</summary>
    public static bool MoveTicket(string clientId, int number, ClientStage stage)
    {
        lock (Gate)
        {
            var ticket = Tickets.SingleOrDefault(x => x.Number == number);
            if (ticket is null || !Projects.Any(p => p.Id == ticket.ProjectId && p.ClientId == clientId)) return false;
            ticket.Stage = stage;
            return true;
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
        IsOpen = t.IsOpen, Stage = t.Stage, Source = t.Source, CreatedUtc = t.CreatedUtc, Thread = [.. t.Thread],
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
