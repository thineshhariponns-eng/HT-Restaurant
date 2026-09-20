using System.Collections.Generic;
using System.Net;
using System.Net.Http;
using System.Threading;
using System.Threading.Tasks;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging.Abstractions;
using TeamOmnifield.Web.Services;
using Xunit;

namespace TeamOmnifield.Web.Tests;

public class TurnstileServiceTests
{
    private static TurnstileService CreateService(string? secret, HttpMessageHandler? handler = null)
    {
        var config = new ConfigurationBuilder()
            .AddInMemoryCollection(secret is null ? [] : new Dictionary<string, string?> { ["TURNSTILE_SECRET_KEY"] = secret })
            .Build();
        var http = new HttpClient(handler ?? new StubHandler("{\"success\":true}"));
        return new TurnstileService(config, http, NullLogger<TurnstileService>.Instance);
    }

    [Fact]
    public async Task Soft_mode_accepts_when_secret_is_not_configured()
    {
        var service = CreateService(null);
        Assert.False(service.IsEnabled);
        Assert.True(await service.VerifyAsync(null, null));
    }

    [Fact]
    public async Task Strict_mode_rejects_missing_token_without_calling_siteverify()
    {
        var handler = new StubHandler("{\"success\":true}");
        var service = CreateService("test-secret", handler);
        Assert.True(service.IsEnabled);
        Assert.False(await service.VerifyAsync(null, "127.0.0.1"));
        Assert.False(await service.VerifyAsync("", "127.0.0.1"));
        Assert.Equal(0, handler.Calls);
    }

    [Fact]
    public async Task Strict_mode_accepts_valid_token()
    {
        var service = CreateService("test-secret", new StubHandler("{\"success\":true}"));
        Assert.True(await service.VerifyAsync("token", "127.0.0.1"));
    }

    [Fact]
    public async Task Strict_mode_rejects_failed_token()
    {
        var service = CreateService("test-secret", new StubHandler("{\"success\":false}"));
        Assert.False(await service.VerifyAsync("token", "127.0.0.1"));
    }

    private sealed class StubHandler(string body) : HttpMessageHandler
    {
        public int Calls { get; private set; }

        protected override Task<HttpResponseMessage> SendAsync(HttpRequestMessage request, CancellationToken cancellationToken)
        {
            Calls++;
            return Task.FromResult(new HttpResponseMessage(HttpStatusCode.OK)
            {
                Content = new StringContent(body, System.Text.Encoding.UTF8, "application/json")
            });
        }
    }
}
