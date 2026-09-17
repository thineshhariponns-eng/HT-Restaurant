using TeamOmnifield.Web.Models;
using TeamOmnifield.Web.Services;

namespace TeamOmnifield.Web.Tests;

public class OrderServiceTests
{
    [Theory]
    [InlineData(OrderStatus.Pending, OrderStatus.Confirmed, true)]
    [InlineData(OrderStatus.Pending, OrderStatus.Preparing, false)]
    [InlineData(OrderStatus.Confirmed, OrderStatus.Preparing, true)]
    [InlineData(OrderStatus.Preparing, OrderStatus.Ready, true)]
    [InlineData(OrderStatus.Ready, OrderStatus.OutForDelivery, true)]
    [InlineData(OrderStatus.OutForDelivery, OrderStatus.Delivered, true)]
    [InlineData(OrderStatus.Delivered, OrderStatus.Preparing, false)]
    [InlineData(OrderStatus.Cancelled, OrderStatus.Confirmed, false)]
    public void Status_transition_rules_are_enforced(OrderStatus current, OrderStatus next, bool expected)
    {
        Assert.Equal(expected, OrderService.IsValidTransition(current, next));
    }
}
