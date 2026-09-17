using System.Text.Json;
using Microsoft.AspNetCore.Http;

namespace TeamOmnifield.Web.Services;

public class CartService(IHttpContextAccessor accessor)
{
    private const string Key = "TEAMOMNIFIELD_CART";
    public Dictionary<int, int> Get() => JsonSerializer.Deserialize<Dictionary<int, int>>(accessor.HttpContext?.Session.GetString(Key) ?? "{}") ?? [];
    public void Save(Dictionary<int, int> cart) => accessor.HttpContext!.Session.SetString(Key, JsonSerializer.Serialize(cart));
    public void Clear() => accessor.HttpContext!.Session.Remove(Key);
}
