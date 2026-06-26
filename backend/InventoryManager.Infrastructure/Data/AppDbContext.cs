using InventoryManager.Core.Models;
using Microsoft.EntityFrameworkCore;

namespace InventoryManager.Infrastructure.Data;

public class AppDbContext(DbContextOptions<AppDbContext> options) : DbContext(options)
{
    public DbSet<InventoryItem> InventoryItems => Set<InventoryItem>();
    public DbSet<ItemImage> ItemImages => Set<ItemImage>();
    public DbSet<Investor> Investors => Set<Investor>();
    public DbSet<InvestorPayment> InvestorPayments => Set<InvestorPayment>();
    public DbSet<Scout> Scouts => Set<Scout>();
    public DbSet<Expense> Expenses => Set<Expense>();

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
            entity.Property(e => e.CostCode).HasMaxLength(5);
            entity.Property(e => e.ImageUrl).HasMaxLength(500);
            entity.Property(e => e.State)
                  .HasConversion<string>()
                  .HasMaxLength(20)
                  .HasDefaultValue(ItemState.Processing);
            entity.Property(e => e.CreatedAt).HasDefaultValueSql("CURRENT_TIMESTAMP(6)");
            entity.Property(e => e.UpdatedAt)
                  .HasDefaultValueSql("CURRENT_TIMESTAMP(6)")
                  .ValueGeneratedOnAddOrUpdate();
        });

        modelBuilder.Entity<Investor>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.HasIndex(e => e.Email).IsUnique();
            entity.Property(e => e.Name).HasMaxLength(255).IsRequired();
            entity.Property(e => e.Email).HasMaxLength(255).IsRequired();
            entity.Property(e => e.FundingTag).HasMaxLength(50).IsRequired();
            entity.Property(e => e.FundsInvested).HasPrecision(10, 2);
            entity.Property(e => e.ProfitSharePercent).HasPrecision(5, 2);
            entity.Property(e => e.CreatedAt).HasDefaultValueSql("CURRENT_TIMESTAMP(6)");
        });

        modelBuilder.Entity<InvestorPayment>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.HasIndex(e => e.InvestorId);
            entity.Property(e => e.Amount).HasPrecision(10, 2).IsRequired();
            entity.Property(e => e.Method).HasMaxLength(100).IsRequired();
            entity.Property(e => e.Notes).HasColumnType("TEXT");
            entity.Property(e => e.CreatedAt).HasDefaultValueSql("CURRENT_TIMESTAMP(6)");
            entity.HasOne(e => e.Investor)
                  .WithMany()
                  .HasForeignKey(e => e.InvestorId)
                  .OnDelete(DeleteBehavior.Cascade);
        });

        modelBuilder.Entity<Scout>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.HasIndex(e => e.Email).IsUnique();
            entity.Property(e => e.Name).HasMaxLength(255).IsRequired();
            entity.Property(e => e.Email).HasMaxLength(255).IsRequired();
            entity.Property(e => e.TagId).HasMaxLength(50).IsRequired();
            entity.Property(e => e.ProfitSharePercent).HasPrecision(5, 2);
            entity.Property(e => e.CreatedAt).HasDefaultValueSql("CURRENT_TIMESTAMP(6)");
        });

        modelBuilder.Entity<Expense>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.Property(e => e.Type).HasConversion<string>().HasMaxLength(30).IsRequired();
            entity.Property(e => e.Title).HasMaxLength(255).IsRequired();
            entity.Property(e => e.Amount).HasPrecision(10, 2);
            entity.Property(e => e.PaymentMethod).HasMaxLength(100);
            entity.Property(e => e.Notes).HasColumnType("TEXT");
            entity.Property(e => e.Address).HasMaxLength(500);
            entity.Property(e => e.ReceiptData).HasColumnType("LONGBLOB");
            entity.Property(e => e.ReceiptContentType).HasMaxLength(100);
            entity.Property(e => e.CreatedAt).HasDefaultValueSql("CURRENT_TIMESTAMP(6)");
            entity.Ignore(e => e.ExpenseCode);
        });

        modelBuilder.Entity<ItemImage>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.HasIndex(e => e.ItemSku);
            entity.Property(e => e.ItemSku).HasMaxLength(50).IsRequired();
            entity.Property(e => e.ImageData).HasColumnType("LONGBLOB").IsRequired();
            entity.Property(e => e.ContentType).HasMaxLength(100).IsRequired();
            entity.Property(e => e.CreatedAt).HasDefaultValueSql("CURRENT_TIMESTAMP(6)");
        });
    }
}
