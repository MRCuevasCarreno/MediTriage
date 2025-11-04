using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace MediTriage.Api.Migrations
{
    /// <inheritdoc />
    public partial class AddRutAndTriageFieldsToAppointments : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "Rut",
                table: "Appointments",
                type: "nvarchar(max)",
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "Rut",
                table: "Appointments");
        }
    }
}
