using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using TeamOmnifield.Web.Models;

namespace TeamOmnifield.Web.Data;

public static class DbInitializer
{
    public static async Task InitializeAsync(AppDbContext db, IPasswordHasher<AdminUser> hasher)
    {
        for (var attempt = 1; attempt <= 20; attempt++)
        {
            try
            {
                await db.Database.EnsureCreatedAsync();
                break;
            }
            catch when (attempt < 20)
            {
                await Task.Delay(1000);
            }
        }

        if (!await db.Categories.AnyAsync())
        {
            var categories = new[]
            {
                new Category { Name = "Biryani", DisplayOrder = 1 },
                new Category { Name = "Starters", DisplayOrder = 2 },
                new Category { Name = "Meals", DisplayOrder = 3 },
                new Category { Name = "Beverages", DisplayOrder = 4 },
                new Category { Name = "Desserts", DisplayOrder = 5 }
            };
            db.Categories.AddRange(categories);
            await db.SaveChangesAsync();
        }

        await db.Database.ExecuteSqlRawAsync("""ALTER TABLE "Products" ADD COLUMN IF NOT EXISTS "ImageUrl" text NOT NULL DEFAULT ''""");

        {
            var categories = await db.Categories.ToDictionaryAsync(x => x.Name);
            var existingNames = (await db.Products.Select(x => x.Name).ToListAsync())
                .ToHashSet(StringComparer.OrdinalIgnoreCase);

            var missing = ProductSeeds
                .Where(seed => !existingNames.Contains(seed.Name))
                .Select(seed => new Product
                {
                    CategoryId = categories[seed.CategoryName].Id,
                    Name = seed.Name,
                    Description = seed.Description,
                    Price = seed.Price,
                    ImageUrl = ProductImages.TryGetValue(seed.Name, out var url) ? url : DefaultImage
                })
                .ToList();

            if (missing.Count > 0)
            {
                db.Products.AddRange(missing);
                await db.SaveChangesAsync();
            }

            var unpictured = await db.Products.Where(x => x.ImageUrl == "").ToListAsync();
            foreach (var product in unpictured)
            {
                product.ImageUrl = ProductImages.TryGetValue(product.Name, out var url) ? url : DefaultImage;
            }
            if (unpictured.Count > 0) await db.SaveChangesAsync();
        }

        // Seeded per account, so an existing database still picks up accounts added later.
        var seededUsers = new[]
        {
            ("admin@htrestaurant.com", "HT Restaurant Owner"),
            ("developer@htrestaurant.com", "TeamOmnifield Consultant"),
        };

        var added = false;
        foreach (var (email, displayName) in seededUsers)
        {
            if (await db.AdminUsers.AnyAsync(x => x.Email == email)) continue;
            var user = new AdminUser { Email = email, DisplayName = displayName };
            user.PasswordHash = hasher.HashPassword(user, "Admin@12345");
            db.AdminUsers.Add(user);
            added = true;
        }
        if (added) await db.SaveChangesAsync();
    }

    private const string DefaultImage = "https://loremflickr.com/640/480/indianfood,restaurant";

    private sealed record ProductSeed(string CategoryName, string Name, string Description, decimal Price);

    private static readonly ProductSeed[] ProductSeeds =
    {
        new("Biryani", "Chicken Biryani", "Aromatic basmati rice with chicken and traditional spices.", 180),
        new("Biryani", "Mutton Biryani", "Slow-cooked mutton biryani with fragrant rice.", 240),
        new("Biryani", "Egg Biryani", "Fragrant basmati rice layered with spiced boiled eggs.", 140),
        new("Biryani", "Veg Biryani", "Basmati rice cooked with mixed vegetables and biryani spices.", 150),
        new("Biryani", "Paneer Biryani", "Basmati rice with marinated paneer cubes and whole spices.", 170),
        new("Biryani", "Prawns Biryani", "Fragrant rice layered with spiced, tender prawns.", 260),

        new("Starters", "Chicken 65", "Crispy, spicy South Indian chicken starter.", 160),
        new("Starters", "Chilli Chicken", "Indo-Chinese stir-fried chicken with peppers and spicy sauce.", 170),
        new("Starters", "Chicken Lollipop", "Frenched chicken wings tossed in a spicy coating.", 180),
        new("Starters", "Fish Fry", "Crisp, spice-marinated fried fish fillets.", 190),
        new("Starters", "Paneer Tikka", "Char-grilled marinated paneer cubes with peppers and onions.", 160),
        new("Starters", "Gobi Manchurian", "Crispy cauliflower florets tossed in a tangy Manchurian sauce.", 130),

        new("Meals", "Veg Meals", "Traditional vegetarian meal with sides.", 130),
        new("Meals", "Chicken Meals", "Steamed rice served with chicken curry and traditional sides.", 170),
        new("Meals", "Fish Meals", "Steamed rice served with fish curry and traditional sides.", 180),
        new("Meals", "Egg Meals", "Steamed rice served with egg curry and traditional sides.", 140),
        new("Meals", "Mutton Meals", "Steamed rice served with mutton curry and traditional sides.", 220),

        new("Beverages", "Fresh Lime", "Refreshing lime drink.", 50),
        new("Beverages", "Mango Lassi", "Chilled yogurt drink blended with sweet mango pulp.", 70),
        new("Beverages", "Masala Chaas", "Spiced buttermilk with curry leaves and roasted cumin.", 40),
        new("Beverages", "Cold Coffee", "Creamy chilled coffee blended with milk and ice.", 80),
        new("Beverages", "Fresh Orange Juice", "Freshly squeezed orange juice, served chilled.", 70),

        new("Desserts", "Gulab Jamun", "Sweet Indian dessert made of milk solids.", 80),
        new("Desserts", "Rasmalai", "Soft paneer discs soaked in sweetened, cardamom-flavoured milk.", 90),
        new("Desserts", "Kesari", "Saffron-flavoured semolina sweet garnished with cashews.", 60),
        new("Desserts", "Vanilla Ice Cream", "Classic creamy vanilla ice cream scoop.", 70),
        new("Desserts", "Double Ka Meetha", "Fried bread pudding soaked in sweetened saffron milk.", 90)
    };

    private static readonly Dictionary<string, string> ProductImages = new()
    {
        ["Chicken Biryani"] = "https://loremflickr.com/640/480/chicken,biryani?lock=1",
        ["Mutton Biryani"] = "https://loremflickr.com/640/480/mutton,biryani?lock=2",
        ["Egg Biryani"] = "https://loremflickr.com/640/480/egg,biryani?lock=7",
        ["Veg Biryani"] = "https://loremflickr.com/640/480/vegetable,biryani?lock=8",
        ["Paneer Biryani"] = "https://loremflickr.com/640/480/paneer,biryani?lock=9",
        ["Prawns Biryani"] = "https://loremflickr.com/640/480/prawn,biryani?lock=10",

        ["Chicken 65"] = "https://loremflickr.com/640/480/chicken,fried?lock=3",
        ["Chilli Chicken"] = "https://loremflickr.com/640/480/chillichicken,indochinese?lock=11",
        ["Chicken Lollipop"] = "https://loremflickr.com/640/480/chickenwings,fried?lock=12",
        ["Fish Fry"] = "https://loremflickr.com/640/480/fishfry,indian?lock=13",
        ["Paneer Tikka"] = "https://loremflickr.com/640/480/paneertikka,grilled?lock=14",
        ["Gobi Manchurian"] = "https://loremflickr.com/640/480/gobimanchurian,cauliflower?lock=15",

        ["Veg Meals"] = "https://loremflickr.com/640/480/indian,thali?lock=4",
        ["Chicken Meals"] = "https://loremflickr.com/640/480/chickencurry,rice?lock=16",
        ["Fish Meals"] = "https://loremflickr.com/640/480/fishcurry,rice?lock=17",
        ["Egg Meals"] = "https://loremflickr.com/640/480/eggcurry,rice?lock=18",
        ["Mutton Meals"] = "https://loremflickr.com/640/480/muttoncurry,rice?lock=19",

        ["Fresh Lime"] = "https://loremflickr.com/640/480/lime,juice?lock=5",
        ["Mango Lassi"] = "https://loremflickr.com/640/480/mango,lassi?lock=20",
        ["Masala Chaas"] = "https://loremflickr.com/640/480/buttermilk,chaas?lock=21",
        ["Cold Coffee"] = "https://loremflickr.com/640/480/coldcoffee,drink?lock=22",
        ["Fresh Orange Juice"] = "https://loremflickr.com/640/480/orange,juice?lock=23",

        ["Gulab Jamun"] = "https://loremflickr.com/640/480/gulabjamun,dessert?lock=6",
        ["Rasmalai"] = "https://loremflickr.com/640/480/rasmalai,dessert?lock=24",
        ["Kesari"] = "https://loremflickr.com/640/480/kesari,sweet?lock=25",
        ["Vanilla Ice Cream"] = "https://loremflickr.com/640/480/vanilla,icecream?lock=26",
        ["Double Ka Meetha"] = "https://loremflickr.com/640/480/breadpudding,dessert?lock=27"
    };
}
