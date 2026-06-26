using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace InventoryManager.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddPendingSaleAndDimensions : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<decimal>(
                name: "AgreedPrice",
                table: "InventoryItems",
                type: "decimal(65,30)",
                nullable: true);

            migrationBuilder.AddColumn<decimal>(
                name: "Height",
                table: "InventoryItems",
                type: "decimal(65,30)",
                nullable: true);

            migrationBuilder.AddColumn<decimal>(
                name: "LengthDepth",
                table: "InventoryItems",
                type: "decimal(65,30)",
                nullable: true);

            migrationBuilder.AddColumn<DateOnly>(
                name: "PendingSaleDate",
                table: "InventoryItems",
                type: "date",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "PendingSaleMethod",
                table: "InventoryItems",
                type: "longtext",
                nullable: true)
                .Annotation("MySql:CharSet", "utf8mb4");

            migrationBuilder.AddColumn<string>(
                name: "PendingSaleTime",
                table: "InventoryItems",
                type: "longtext",
                nullable: true)
                .Annotation("MySql:CharSet", "utf8mb4");

            migrationBuilder.AddColumn<decimal>(
                name: "Width",
                table: "InventoryItems",
                type: "decimal(65,30)",
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "AgreedPrice",
                table: "InventoryItems");

            migrationBuilder.DropColumn(
                name: "Height",
                table: "InventoryItems");

            migrationBuilder.DropColumn(
                name: "LengthDepth",
                table: "InventoryItems");

            migrationBuilder.DropColumn(
                name: "PendingSaleDate",
                table: "InventoryItems");

            migrationBuilder.DropColumn(
                name: "PendingSaleMethod",
                table: "InventoryItems");

            migrationBuilder.DropColumn(
                name: "PendingSaleTime",
                table: "InventoryItems");

            migrationBuilder.DropColumn(
                name: "Width",
                table: "InventoryItems");
        }
    }
}
