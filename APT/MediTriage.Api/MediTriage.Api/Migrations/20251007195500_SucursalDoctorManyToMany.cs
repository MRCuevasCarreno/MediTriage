using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace MediTriage.Api.Migrations
{
    /// <inheritdoc />
    public partial class SucursalDoctorManyToMany : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_Sucursales_Doctors_DoctorId",
                table: "Sucursales");

            migrationBuilder.DropIndex(
                name: "IX_Sucursales_DoctorId",
                table: "Sucursales");

            migrationBuilder.DropColumn(
                name: "DoctorId",
                table: "Sucursales");

            migrationBuilder.CreateTable(
                name: "DoctorSucursal",
                columns: table => new
                {
                    DoctorsId = table.Column<int>(type: "int", nullable: false),
                    SucursalesId = table.Column<int>(type: "int", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_DoctorSucursal", x => new { x.DoctorsId, x.SucursalesId });
                    table.ForeignKey(
                        name: "FK_DoctorSucursal_Doctors_DoctorsId",
                        column: x => x.DoctorsId,
                        principalTable: "Doctors",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_DoctorSucursal_Sucursales_SucursalesId",
                        column: x => x.SucursalesId,
                        principalTable: "Sucursales",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_DoctorSucursal_SucursalesId",
                table: "DoctorSucursal",
                column: "SucursalesId");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "DoctorSucursal");

            migrationBuilder.AddColumn<int>(
                name: "DoctorId",
                table: "Sucursales",
                type: "int",
                nullable: true);

            migrationBuilder.CreateIndex(
                name: "IX_Sucursales_DoctorId",
                table: "Sucursales",
                column: "DoctorId");

            migrationBuilder.AddForeignKey(
                name: "FK_Sucursales_Doctors_DoctorId",
                table: "Sucursales",
                column: "DoctorId",
                principalTable: "Doctors",
                principalColumn: "Id");
        }
    }
}
