using System.Text.Json;

namespace TeamOmnifield.Web.Services;

public class TurnstileService(IConfiguration configuration, HttpClient httpClient, ILogger<TurnstileService> logger)
{
    private const string SiteVerifyUrl = "https://challenges.cloudflare.com/turnstile/v0/siteverify";

    public bool IsEnabled => !string.IsNullOrWhiteSpace(configuration["TURNSTILE_SECRET_KEY"]);

    public async Task<bool> VerifyAsync(string? token, string? remoteIp)
    {
        var secret = configuration["TURNSTILE_SECRET_KEY"];
        if (string.IsNullOrWhiteSpace(secret))
        {
            logger.LogWarning("TURNSTILE_SECRET_KEY is not configured; accepting submission without spam verification (soft mode)");
            return true;
        }
        if (string.IsNullOrWhiteSpace(token)) return false;

        var fields = new Dictionary<string, string> { ["secret"] = secret, ["response"] = token };
        if (!string.IsNullOrWhiteSpace(remoteIp)) fields["remoteip"] = remoteIp;

        try
        {
            using var response = await httpClient.PostAsync(SiteVerifyUrl, new FormUrlEncodedContent(fields));
            using var doc = JsonDocument.Parse(await response.Content.ReadAsStringAsync());
            return doc.RootElement.TryGetProperty("success", out var success) && success.GetBoolean();
        }
        catch (Exception ex) when (ex is HttpRequestException or JsonException or TaskCanceledException or InvalidOperationException)
        {
            logger.LogWarning("Turnstile siteverify request failed; rejecting submission");
            return false;
        }
    }
}
