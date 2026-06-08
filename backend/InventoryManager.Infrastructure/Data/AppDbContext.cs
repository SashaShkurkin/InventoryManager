using InventoryManager.Core.Models;
using Microsoft.EntityFrameworkCore;

namespace InventoryManager.Infrastructure.Data;

public class AppDbContext(DbContextOptions<AppDbContext> options) : DbContext(options)
{
    public DbSet<InventoryItem> InventoryItems => Set<InventoryItem>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<InventoryItem>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.HasIndex(e => e.Sku).IsUnique();
            entity.Property(e => e.Sku).HasMaxLength(50).IsRequired();
            entity.Property(e => e.Title).HasMaxLength(255).IsRequired();
            entity.Property(e => e.Description).HasColumnType("TEXT");
            entity.Property(e => e.AcquisitionCost).HasPrecision(10, 2);
            entity.Property(e => e.LaborCost).HasPrecision(10, 2);
            entity.Property(e => e.MaterialsCost).HasPrecision(10, 2);
            entity.Property(e => e.PrepCost).HasPrecision(10, 2);
            entity.Property(e => e.TravelCost).HasPrecision(10, 2);
            entity.Property(e => e.ListPrice).HasPrecision(10, 2);
            entity.Property(e => e.SoldPrice).HasPrecision(10, 2);
            entity.Property(e => e.Profit).HasPrecision(10, 2);
            entity.Property(e => e.Type).HasMaxLength(100);
            entity.Property(e => e.SubType).HasMaxLength(100);
            entity.Property(e => e.Style).HasMaxLength(100);
            entity.Property(e => e.Color).HasMaxLength(100);
            entity.Property(e => e.Tags).HasMaxLength(500);
            entity.Property(e => e.ImageUrl).HasMaxLength(500);
            entity.Property(e => e.State)
                  .HasConversion<string>()
                  .HasMaxLength(20)
                  .HasDefaultValue(ItemState.Processing);
            entity.Property(e => e.CreatedAt).HasDefaultValueSql("UTC_TIMESTAMP()");
            entity.Property(e => e.UpdatedAt)
                  .HasDefaultValueSql("UTC_TIMESTAMP()")
                  .ValueGeneratedOnAddOrUpdate();
        });
    }
}
