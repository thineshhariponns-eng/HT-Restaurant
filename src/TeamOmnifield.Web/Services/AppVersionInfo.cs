using System.Globalization;
using System.Reflection;

namespace TeamOmnifield.Web.Services;

// Version and deployment time shown in the footer. Both are baked into the assembly at build time.
public static class AppVersionInfo
{
    private static readonly Assembly Assembly = typeof(Program).Assembly;

    public static string Version { get; } = Assembly.GetName().Version?.ToString(3) ?? "1.0.0";

    public static DateTime? DeployedUtc { get; } =
        Assembly.GetCustomAttributes<AssemblyMetadataAttribute>()
            .FirstOrDefault(a => a.Key == "BuildTimestampUtc")?.Value is { } raw
        && DateTime.TryParse(raw, CultureInfo.InvariantCulture, DateTimeStyles.RoundtripKind | DateTimeStyles.AdjustToUniversal, out var utc)
            ? utc
            : null;

    public static string Display => DeployedUtc is { } d
        ? $"v{Version} · {d.ToString("dd MMM yyyy, HH:mm", CultureInfo.InvariantCulture)} UTC"
        : $"v{Version}";
}
