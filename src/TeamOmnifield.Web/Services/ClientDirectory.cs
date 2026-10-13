using Microsoft.EntityFrameworkCore;
using TeamOmnifield.Web.Data;
using TeamOmnifield.Web.Models;

namespace TeamOmnifield.Web.Services;

/// <summary>
/// Creates and manages platform clients. Every change is saved to the database first and then
/// mirrored into <see cref="DemoClientStore"/>, which the portal's views read.
/// </summary>
public class ClientDirectory(AppDbContext db)
{
    /// <summary>Seeds HT Restaurant on an empty table, then loads every client and its starting projects.</summary>
    public static async Task LoadAsync(AppDbContext db)
    {
        if (!await db.PlatformClients.AnyAsync())
        {
            db.PlatformClients.Add(new PlatformClient
            {
                Name = "HT Restaurant", City = "Chennai, Hyderabad & Kolkata",
                Contact = "Harsha Robba", ContactEmail = "harsha@htrestaurant.com",
                Domain = "htrestaurant.com", AdminDomain = "admin.htrestaurant.com",
                Stage = ClientStage.Production, IsBuiltIn = true,
            });
            await db.SaveChangesAsync();
        }

        var clients = (await db.PlatformClients.AsNoTracking().OrderByDescending(x => x.Id).ToListAsync())
            .Select(ToDemo).ToList();
        DemoClientStore.Hydrate(clients);

        foreach (var client in clients.OrderBy(x => x.CreatedUtc))
        {
            if (!client.IsBuiltIn)
            {
                DemoWorkspaceStore.SeedDefaults(client.Id);
                continue;
            }
            // One project per city; tickets raised from the admin portal route to the selected city's project.
            foreach (var city in DemoWorkspaceStore.Cities)
                DemoWorkspaceStore.AddProject(client.Id, DemoWorkspaceStore.AdminPortalProject(city));
        }
    }

    /// <summary>True when another client already uses this host as its customer or admin domain.</summary>
    public Task<bool> HostInUseAsync(string host, string? exceptClientId = null)
    {
        var except = DbId(exceptClientId);
        return db.PlatformClients.AnyAsync(x => x.Id != except && (x.Domain == host || x.AdminDomain == host));
    }

    public async Task<DemoClient> CreateAsync(string name, string city, string contact, string contactEmail, string domain, string adminDomain)
    {
        var row = new PlatformClient
        {
            Name = name, City = city, Contact = contact, ContactEmail = contactEmail,
            Domain = domain, AdminDomain = adminDomain,
        };
        db.PlatformClients.Add(row);
        await db.SaveChangesAsync();

        var client = ToDemo(row);
        DemoClientStore.Put(client, "Client created");
        DemoWorkspaceStore.SeedDefaults(client.Id);
        return client;
    }

    public Task<bool> UpdateAsync(string id, string name, string city, string contact, string contactEmail, string domain, string adminDomain) =>
        ChangeAsync(id, "Details updated", row =>
        {
            row.Name = name;
            row.City = city;
            row.Contact = contact;
            row.ContactEmail = contactEmail;
            row.Domain = domain;
            row.AdminDomain = adminDomain;
        });

    public Task<bool> SetStageAsync(string id, ClientStage stage) =>
        ChangeAsync(id, $"Moved to {DemoClientStore.Label(stage)}", row => row.Stage = stage);

    public Task<bool> SetActiveAsync(string id, bool active) =>
        ChangeAsync(id, active ? "Workspace reactivated" : "Workspace suspended", row => row.IsActive = active);

    /// <summary>Deletes a client and its workspace. The built-in client is refused.</summary>
    public async Task<bool> DeleteAsync(string id)
    {
        var row = await db.PlatformClients.FindAsync(DbId(id));
        if (row is null || row.IsBuiltIn) return false;
        db.PlatformClients.Remove(row);
        await db.SaveChangesAsync();

        DemoClientStore.Remove(id);
        DemoWorkspaceStore.RemoveClient(id);
        return true;
    }

    private async Task<bool> ChangeAsync(string id, string eventText, Action<PlatformClient> change)
    {
        var row = await db.PlatformClients.FindAsync(DbId(id));
        if (row is null) return false;
        change(row);
        row.UpdatedUtc = DateTime.UtcNow;
        await db.SaveChangesAsync();
        DemoClientStore.Put(ToDemo(row), eventText);
        return true;
    }

    /// <summary>Portal ids look like "c-12"; anything else matches no row.</summary>
    private static int DbId(string? id) =>
        id is not null && id.StartsWith("c-") && int.TryParse(id.AsSpan(2), out var value) ? value : 0;

    private static DemoClient ToDemo(PlatformClient row) => new()
    {
        Id = $"c-{row.Id}", Code = $"CL-{row.Id:000}",
        Name = row.Name, City = row.City, Contact = row.Contact, ContactEmail = row.ContactEmail,
        Domain = row.Domain, AdminDomain = row.AdminDomain,
        Stage = row.Stage, IsActive = row.IsActive, IsBuiltIn = row.IsBuiltIn,
        Progress = DemoClientStore.ProgressOf(row.Stage),
        CreatedUtc = row.CreatedUtc, UpdatedUtc = row.UpdatedUtc,
    };
}
