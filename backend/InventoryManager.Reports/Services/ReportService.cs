using InventoryManager.Core.Interfaces;
using InventoryManager.Core.Models;
using QuestPDF.Fluent;
using QuestPDF.Helpers;
using QuestPDF.Infrastructure;

namespace InventoryManager.Reports.Services;

public class ReportService(IInventoryRepository repository) : IReportService
{
    static ReportService()
    {
        QuestPDF.Settings.License = LicenseType.Community;
    }

    public async Task<byte[]> GenerateAllTimeInventoryReportAsync()
    {
        var (items, _) = await repository.GetFilteredAsync("all", null, null, 1, int.MaxValue);
        return BuildInventoryPdf("All Time Inventory", items);
    }

    public async Task<byte[]> GenerateCurrentInventoryReportAsync()
    {
        var (items, _) = await repository.GetFilteredAsync(null, null, null, 1, int.MaxValue);
        return BuildInventoryPdf("Current Inventory", items);
    }

    public async Task<byte[]> GenerateRevenueReportAsync()
    {
        var (items, _) = await repository.GetFilteredAsync(nameof(ItemState.Sold), null, null, 1, int.MaxValue);
        return BuildRevenuePdf(items);
    }

    private static byte[] BuildInventoryPdf(string title, IEnumerable<InventoryItem> items)
    {
        var grouped = items.GroupBy(i => i.State.ToString()).ToList();

        return Document.Create(container =>
        {
            container.Page(page =>
            {
                page.Size(PageSizes.A4.Landscape());
                page.Margin(20);
                page.Header().Text(title).Bold().FontSize(16);
                page.Content().Column(col =>
                {
                    foreach (var group in grouped)
                    {
                        col.Item().PaddingTop(10).Text(group.Key).Bold().FontSize(12);
                        col.Item().Table(table =>
                        {
                            table.ColumnsDefinition(cols =>
                            {
                                cols.RelativeColumn(2);
                                cols.RelativeColumn(4);
                                cols.RelativeColumn(2);
                                cols.RelativeColumn(2);
                                cols.RelativeColumn(2);
                                cols.RelativeColumn(2);
                            });

                            table.Header(header =>
                            {
                                foreach (var h in new[] { "SKU", "Title", "Type", "List $", "Acq $", "Profit $" })
                                    header.Cell().Background("#ddd").Padding(4).Text(h).Bold().FontSize(8);
                            });

                            foreach (var item in group.OrderBy(i => i.Sku))
                            {
                                table.Cell().Padding(4).Text(item.Sku).FontSize(8);
                                table.Cell().Padding(4).Text(item.Title).FontSize(8);
                                table.Cell().Padding(4).Text(item.Type ?? "").FontSize(8);
                                table.Cell().Padding(4).Text(item.ListPrice?.ToString("C") ?? "").FontSize(8);
                                table.Cell().Padding(4).Text(item.AcquisitionCost?.ToString("C") ?? "").FontSize(8);
                                table.Cell().Padding(4).Text(item.Profit?.ToString("C") ?? "").FontSize(8);
                            }
                        });
                    }
                });
                page.Footer().AlignRight().Text(t =>
                {
                    t.Span("Generated ").FontSize(8);
                    t.Span(DateTime.UtcNow.ToString("yyyy-MM-dd")).FontSize(8);
                });
            });
        }).GeneratePdf();
    }

    private static byte[] BuildRevenuePdf(IEnumerable<InventoryItem> soldItems)
    {
        var byMonth = soldItems
            .Where(i => i.DateSold.HasValue)
            .OrderBy(i => i.DateSold)
            .GroupBy(i => new { i.DateSold!.Value.Year, i.DateSold!.Value.Month })
            .ToList();

        var grandRevenue = soldItems.Sum(i => i.SoldPrice ?? 0);
        var grandProfit = soldItems.Sum(i => i.Profit ?? 0);

        return Document.Create(container =>
        {
            container.Page(page =>
            {
                page.Size(PageSizes.A4.Landscape());
                page.Margin(20);
                page.Header().Text("Revenue Report").Bold().FontSize(16);
                page.Content().Column(col =>
                {
                    foreach (var month in byMonth)
                    {
                        var label = new DateTime(month.Key.Year, month.Key.Month, 1).ToString("MMMM yyyy");
                        col.Item().PaddingTop(10).Text(label).Bold().FontSize(11);
                        col.Item().Table(table =>
                        {
                            table.ColumnsDefinition(cols =>
                            {
                                cols.RelativeColumn(2);
                                cols.RelativeColumn(4);
                                cols.RelativeColumn(2);
                                cols.RelativeColumn(2);
                                cols.RelativeColumn(2);
                            });

                            table.Header(header =>
                            {
                                foreach (var h in new[] { "SKU", "Title", "Date Sold", "Revenue", "Profit" })
                                    header.Cell().Background("#ddd").Padding(4).Text(h).Bold().FontSize(8);
                            });

                            foreach (var item in month)
                            {
                                table.Cell().Padding(4).Text(item.Sku).FontSize(8);
                                table.Cell().Padding(4).Text(item.Title).FontSize(8);
                                table.Cell().Padding(4).Text(item.DateSold?.ToString("MM/dd/yyyy") ?? "").FontSize(8);
                                table.Cell().Padding(4).Text(item.SoldPrice?.ToString("C") ?? "").FontSize(8);
                                table.Cell().Padding(4).Text(item.Profit?.ToString("C") ?? "").FontSize(8);
                            }
                        });

                        var mRevenue = month.Sum(i => i.SoldPrice ?? 0);
                        var mProfit = month.Sum(i => i.Profit ?? 0);
                        col.Item().AlignRight().Text($"Month subtotal — Revenue: {mRevenue:C}  Profit: {mProfit:C}").FontSize(9).Bold();
                    }

                    col.Item().PaddingTop(20)
                        .Background("#eee").Padding(8)
                        .Text($"Grand Total — Revenue: {grandRevenue:C}  Profit: {grandProfit:C}")
                        .Bold().FontSize(11);
                });
                page.Footer().AlignRight().Text(t =>
                {
                    t.Span("Generated ").FontSize(8);
                    t.Span(DateTime.UtcNow.ToString("yyyy-MM-dd")).FontSize(8);
                });
            });
        }).GeneratePdf();
    }
}
