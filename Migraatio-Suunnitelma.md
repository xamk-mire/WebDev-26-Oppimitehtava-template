## Moisture-Sim-App backendin migraatio ASP.NET 10 + Scalar UI -toteutukseen

### Johdanto

Tämä dokumentti ohjaa **Moisture-Sim-App** -sovelluksen nykyisen Node/Express-backendin korvaamiseen **ASP.NET Core (.NET 10)** -pohjaisella backendilla. Tietokanta (PostgreSQL) ja API-sopimus pysyvät samoina, joten olemassa oleva React-frontend toimii ilman tai vähäisillä muutoksilla. Swagger UI vaihdetaan **Scalar UI** -käyttöliittymään API-dokumentaation ja testauksen tarpeisiin.

Suunnitelma on jaettu vaiheisiin (projektin luonti, tietokanta ja EF Core, DTO:t, autentikointi, plants-endpointit, Scalar UI, konfiguraatio ja Docker). Lopussa on **tehtäväosio** backendin toimivuuden testaamiseen sekä **raportointiohjeet** Scalar UI -kuvakaappauksineen. Tehtävät suoritetaan ohjeen mukaan ja raportoidaan erillisten [Raportointiohjeiden](Raportointiohjeet.md) mukaisesti.

### Alustus

Luo tehtävää varten projektikansioon uusi webapi projekti ja nimeä se **moisture-backend-net**.

Kopioi tehtävänannon kansion **moisture-frontend** toteutus oman oppimistehtävä projekti kansiosi sisälle.

  - Halutessasi voit myös kopioida **moisture-backend** toteutuksen oppimistehtävä projekti kansiosi sisälle -> tämä tullaan korvaamaan uudella .net 10 toteutuksella tehtävän aikana, jolloin vanhaa toteutusta ei enää tarvita jatkossa. 

Oppimistehtävä projekti kansiosi rakenne pitäisi näyttää vastaavalta:

```md
oppimistehtävä-classroom-repositoriosi-nimi
├── moisture-backend (node/express toteutus VALINNAINEN)
├── moisture-backend-net (uusi .net 10 toteutus)
├── moisture-frontend (react frontend toteutus)
└── README.md
```


### Tavoite

Rakentaa uusi **ASP.NET Core (.NET 10)** -pohjainen backend, joka:

- käyttää samaa PostgreSQL-tietokantaa ja skeemaa kuin nykyinen Prisma-skeema (`User`, `Plant`, `Device`),
- tarjoaa samat REST-rajapinnat ja vastauksen muodot kuin nykyinen Express-backend (autentikointi, kasvien CRUD, kastelun togglaus, health-check),
- korvaa Swagger UI:n **Scalar UI** -dokumentaatio-/apiclient-käyttöliittymällä,
- integroituu nykyiseen frontend-sovellukseen ilman tai hyvin pienillä muutoksilla.

### Nykyinen arkkitehtuuri (Node/Express) – kerrosarkkitehtuuri

Projektin rakenne on jaettu kerroksiin: **Controllers**, **Services**, **Repositories**, **Data** sekä **Models**.

| Kerros | Kansio / sijainti | Vastuu |
|--------|-------------------|--------|
| **Controllers** | `src/controllers/*.ts` | HTTP-logiikka: pyyntöjen vastaanotto, validointi, virhekoodit ja vastauksen muotoilu. `auth.controller.ts`, `plants.controller.ts`. |
| **Services** | `src/services/*.ts` | Liiketoimintalogiikka: kasvien listaus/suodatus, kastelun togglaus, käyttäjän rekisteröinti ja kirjautuminen. Käyttää Repositories- ja Models-kerrosta. |
| **Repositories** | `src/repositories/*.ts` | Tietokantakyselyt ja -päivitykset: abstrahoi Prisma-kyselyt (esim. `plants.repo.ts` listaus, suodatus, CRUD). |
| **Data** | `src/db/prisma.ts` + `prisma/schema.prisma` | Tietokantayhteys ja skeema: PrismaClient-instantiointi, PostgreSQL-skeema malleille `User`, `Plant`, `Device`. |
| **Models** | `src/models/*.ts` | Tyyppimäärittelyt ja DTO:t: `Device`, `Plant`, `AddPlantBody`, `DeviceStatus` jne. (`types.ts`). |

Lisäksi:

- `moisture-backend/src/app.ts`: Express-sovellus, CORS, Swagger, reitit `/api/plants`, `/api/auth`, `/api/health`.
- `moisture-backend/src/server.ts`: käynnistää palvelimen portissa 8001.
- `moisture-backend/src/routes/*.ts`: reititys kontrollereihin (auth- ja plants-reitit).
- `moisture-backend/src/middleware/*.ts`: esim. autentikointi (`auth.ts`).

### Tavoiteltu arkkitehtuuri (ASP.NET 10) – sama kerrosjako

Sama kerrosarkkitehtuuri säilytetään: **Controllers**, **Services**, **Repositories**, **Data** ja **Models**.

- **Projekti**: uusi ASP.NET Core Web API -projekti, esim. `Moisture.Backend.Api` (`net10.0`).
- **Kansiot (kerrokset)**:
  - **Controllers/** – `AuthController`, `PlantsController`, `HealthController`. HTTP-logiikka, reititys ja vastaukset.
  - **Services/** – `IAuthService`, `AuthService`, `IPlantsService`, `PlantsService`. Liiketoimintalogiikka, käyttää Repositories- ja Models-kerrosta.
  - **Repositories/** – `IPlantsRepository`, `PlantsRepository` (ja vastaavat auth-tarpeeseen). Tietokantakyselyt ja -päivitykset, abstrahoi EF Core / `AppDbContext`.
  - **Data/** – `AppDbContext` (EF Core + Npgsql), tietokantayhteys, Fluent API -konfiguraatiot ja migraatiot.
  - **Models/** – entiteetit (`User`, `Plant`, `Device`) ja DTO:t (`PlantDto`, `DeviceDto`, `PagedPlantsResponseDto`, `UserDto`, `LoginResponseDto`).
  - **Configuration/** (valinnainen) – CORS-, auth- ja Scalar UI -konfiguraatio.

| Kerros | Kansio | Vastuu (ASP.NET 10) |
|--------|--------|----------------------|
| **Controllers** | `Controllers/` | HTTP-endpointit, validointi, virhekoodit. |
| **Services** | `Services/` | Liiketoimintalogiikka, käyttää Repositories- ja Models-kerrosta. |
| **Repositories** | `Repositories/` | Tietokantakyselyt ja -päivitykset, abstrahoi Data/AppDbContext. |
| **Data** | `Data/` | AppDbContext (EF Core + Npgsql), migraatiot, yhteys. |
| **Models** | `Models/` | Entiteetit ja DTO:t (API-sopimukset). |

```mermaid
flowchart LR
  frontend[React_frontend] -->|HTTP + Bearer_token| api[ASPNet_API]
  api --> authCtrl[AuthController]
  api --> plantsCtrl[PlantsController]
  api --> healthCtrl[HealthController]

  authCtrl --> authSvc[AuthService]
  plantsCtrl --> plantsSvc[PlantsService]

  authSvc --> authRepo[AuthRepository]
  plantsSvc --> plantsRepo[PlantsRepository]

  authRepo --> data[Data / AppDbContext]
  plantsRepo --> data
```

---

## Ympäristömuuttujien käyttöönotto

ASP.NET-backend lukee tietokantayhteyden ja JWT-salaisuuden **konfiguraatiosta**. Arvot tulevat joko `appsettings.json` / `appsettings.Development.json` tai **ympäristömuuttujista**. Ympäristömuuttujat ylikirjoittavat appsettings-arvot.

**Tarvittavat muuttujat**

| Muuttuja | Käyttö | Esimerkki |
|----------|--------|-----------|
| `DATABASE_URL` | PostgreSQL-yhteys (EF Core) | `postgresql://postgres:password@localhost:5432/plantsdb?schema=public` |
| `JWT_SECRET` | JWT-tokenien allekirjoitus | vähintään ~32 merkkiä, esim. `supersecretkey` kehityksessä |

Sovellus hakee ne esim. näin (`Program.cs`): `Configuration.GetConnectionString("DefaultConnection")` tai `Configuration["DATABASE_URL"]`; `Configuration["JWT_SECRET"]`.

---

### Paikallinen kehitys (`dotnet run` tai IDE)

ASP.NET **ei lue** `.env`-tiedostoja automaattisesti. Arvot täytyy antaa jollakin alla olevista tavoista.

**Vaihtoehto A: `launchSettings.json` (suositus kehitykseen)**

1. Avaa `Properties/launchSettings.json`.
2. Lisää profiiliin `environmentVariables`-osio (tai täydennä olemassa olevaa):

```json
{
  "profiles": {
    "Moisture.Backend.Api": {
      "commandName": "Project",
      "launchBrowser": true,
      "environmentVariables": {
        "ASPNETCORE_ENVIRONMENT": "Development",
        "DATABASE_URL": "postgresql://postgres:password@localhost:5432/plantsdb?schema=public",
        "JWT_SECRET": "dev-secret-change-me"
      },
      "applicationUrl": "https://localhost:63961;http://localhost:63962"
    }
  }
}
```

3. Korvaa `DATABASE_URL` ja `JWT_SECRET` oikeilla arvoillasi. **Älä commitoi oikeita salaisuuksia** – käytä kehitysavaimia tai pidä `launchSettings.json` pois julkisesta repositoriosta.
4. Käynnistä sovellus (`dotnet run` tai F5 IDE:stä). Ympäristömuuttujat tulevat käyttöön automaattisesti.

**Vaihtoehto B: Shell-ympäristö ennen `dotnet run`**

Ennen `dotnet run` -komentoa aseta muuttujat:

- **PowerShell:**
  ```powershell
  $env:DATABASE_URL = "postgresql://postgres:password@localhost:5432/plantsdb?schema=public"
  $env:JWT_SECRET = "dev-secret-change-me"
  dotnet run
  ```
- **Bash / Linux / macOS:**
  ```bash
  export DATABASE_URL="postgresql://postgres:password@localhost:5432/plantsdb?schema=public"
  export JWT_SECRET="dev-secret-change-me"
  dotnet run
  ```
- **Windows (cmd):**
  ```cmd
  set DATABASE_URL=postgresql://postgres:password@localhost:5432/plantsdb?schema=public
  set JWT_SECRET=dev-secret-change-me
  dotnet run
  ```

**Vaihtoehto C: `appsettings.Development.json`**

Voit asettaa oletusarvot `appsettings.Development.json`-tiedostoon (esim. `ConnectionStrings:DefaultConnection`, `Jwt:Key`). **Älä kirjoita oikeita salaisuuksia** versionhallintaan. Ympäristömuuttujat ylikirjoittavat nämä kuitenkin, jos ne on asetettu (A tai B).


### `.env.example` ja versionhallinta

1. **Luo `.env.example`** (repositorion juuri tai ASP.NET-projektin juuri):

   ```env
   DATABASE_URL=postgresql://user:password@host:5432/dbname?schema=public
   JWT_SECRET=your-secret-key
   ```

   Täytä oikeat muodot ilman oikeita salaisuuksia. Käyttäjät kopioivat esim. `.env.example` → `.env` ja täyttävät arvot.

2. **Lisää `.env` `.gitignore`-tiedostoon**, jotta salaisuudet eivät mene versionhallintaan:

   ```
   .env
   ```

3. **Älä commitoi** `launchSettings.json`:ia oikeilla salaisuuksilla, jos repositorio on julkinen. Vaihtoehtona käytetään vain kehitysarvot tai `launchSettings` jätetään pois repositoriosta.

---

### Yhteenveto: milloin mikin menetelmä

| Tilanne | Miten ympäristömuuttujat otetaan käyttöön |
|---------|-------------------------------------------|
| **Paikallinen kehitys** (Visual Studio / `dotnet run`) | `launchSettings.json` (A) tai shell-export (B) ennen `dotnet run` |
| **Tuotanto** | Käytä pilvipalvelun / CI-ympäristön muuttujia; älä tallenna salaisuuksia tiedostoihin versionhallinnassa. |

Kun muuttujat on asetettu oikein, backend käyttää niitä automaattisesti `Program.cs`:n `Configuration`-kautta (Vaihe 1 ja 2).

---

## Vaihe 1: ASP.NET-projektin luonti ja peruskonfiguraatio

- Luodaan `Moisture.Backend.Api` -projekti (Web API, `net10.0`).

### Tarvittavat NuGet-paketit ja asennuskomennot

Projekti tulee sisältämään seuraavat NuGet-paketit. Asenna ne **projektikansion** (`moisture-backend-net`) sisältä käsin. Versiot vastaavat .NET 10 -stackia ja kuvassa esitettyjä paketteja.

| Paketti | Versio | Käyttötarkoitus |
|---------|--------|------------------|
| `Microsoft.AspNetCore.Authentication.JwtBearer` | 10.0.2 | JWT Bearer -autentikointi API-endpointeille. |
| `Microsoft.AspNetCore.OpenApi` | 10.0.2 | OpenAPI-kuvauksen tuottaminen ASP.NET Core -sovellukselle. |
| `Microsoft.EntityFrameworkCore.Design` | 10.0.2 | EF Core -suunnittelutyökalut (migraatiot, scaffold). |
| `Npgsql.EntityFrameworkCore.PostgreSQL` | 10.0.0 | Entity Framework Core -provideri PostgreSQL-tietokannalle. |
| `Scalar.AspNetCore` | 2.12.24 | Scalar UI API-dokumentaation ja -testauksen käyttöliittymäksi (Swagger UI:n korvike). |
| `Swashbuckle.AspNetCore` | 10.1.0 | Swagger/OpenAPI JSON:n generointi; Scalar UI lukee tätä. |

**Asennuskomennot** (suorita projektikansiossa, esim. `moisture-backend-net`):

```bash
cd moisture-backend-net

dotnet add package Microsoft.AspNetCore.Authentication.JwtBearer --version 10.0.2
dotnet add package Microsoft.AspNetCore.OpenApi --version 10.0.2
dotnet add package Microsoft.EntityFrameworkCore.Design --version 10.0.2
dotnet add package Npgsql.EntityFrameworkCore.PostgreSQL --version 10.0.0
dotnet add package Scalar.AspNetCore --version 2.12.24
dotnet add package Swashbuckle.AspNetCore --version 10.1.0
```

Voit asentaa kaikki yhdellä komennolla (PowerShell):

```powershell
dotnet add package Microsoft.AspNetCore.Authentication.JwtBearer --version 10.0.2; `
dotnet add package Microsoft.AspNetCore.OpenApi --version 10.0.2; `
dotnet add package Microsoft.EntityFrameworkCore.Design --version 10.0.2; `
dotnet add package Npgsql.EntityFrameworkCore.PostgreSQL --version 10.0.0; `
dotnet add package Scalar.AspNetCore --version 2.12.24; `
dotnet add package Swashbuckle.AspNetCore --version 10.1.0
```

- **Luodaan** ensin projekti (`dotnet new webapi -n Moisture.Backend.Api -o moisture-backend-net` tms.), sen jälkeen asennuskomennot.
- Jos paketit on jo lisätty (esim. Visual Studion Package Managerilla), voit tarkistaa versiot `dotnet list package` tai `.csproj`-tiedostosta.

---

- Alla esimerkki `Program.cs`-tiedoston sisällöstä, jossa on peruskonfiguraatio:

```csharp
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using Microsoft.OpenApi;
using Moisture.Backend.Api.Data;
using Moisture.Backend.Api.Repositories;
using Moisture.Backend.Api.Services;
using Scalar.AspNetCore;
using System.Text;

var builder = WebApplication.CreateBuilder(args);

// Controllers-kerros käyttöön
builder.Services.AddControllers();

// TODO: Määritä EF Core + PostgreSQL

// CORS (esim. React-frontendille)
builder.Services.AddCors(options =>
{
    options.AddDefaultPolicy(policy =>
    {
        policy.WithOrigins("http://localhost:5173")
              .AllowAnyHeader()
              .AllowAnyMethod();
    });
});

// JWT-autentikointi
var jwtKey = builder.Configuration["JWT_SECRET"] ?? "dev-secret-change-me";
var keyBytes = Encoding.UTF8.GetBytes(jwtKey);

builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(options =>
    {
        options.TokenValidationParameters = new TokenValidationParameters
        {
            ValidateIssuer = false,
            ValidateAudience = false,
            ValidateIssuerSigningKey = true,
            IssuerSigningKey = new SymmetricSecurityKey(keyBytes)
        };
    });

// Swagger / OpenAPI (Scalar UI hyödyntää tätä)
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen(c =>
{
    c.SwaggerDoc("v1", new OpenApiInfo { Title = "Plants API", Version = "v1" });
});

// TODO: rekisteröi Data, Repositories, Services -kerrokset (esim. AddDbContext, AddScoped<...>)

// Repositories-kerros

// Services-kerros


var app = builder.Build();

// Kehitysympäristössä Swagger JSON
if (app.Environment.IsDevelopment())
{
    app.MapSwagger("/openapi/{documentName}.json");
    app.MapScalarApiReference(); // /scalar
}

app.UseRouting();

app.UseCors();

app.UseAuthentication();
app.UseAuthorization();

app.MapControllers(); // /api/* reitit Controllers-kerroksesta

app.Run("http://0.0.0.0:8001");
```

Selitykset lyhyesti:
- **AddControllers**: ottaa Controllers-kerroksen käyttöön (`AuthController`, `PlantsController`, `HealthController`).
- **AddCors + UseCors**: sallii selaimen pyynnöt esim. `http://localhost:5173`-originista, kuten nykyinen Express/CORS.
- **AddAuthentication + AddJwtBearer**: määrittää JWT-pohjaisen autentikoinnin käyttäen `JWT_SECRET`-avainta. Arvot asetetaan kohdan [Ympäristömuuttujien käyttöönotto](#ympäristömuuttujien-käyttöönotto) mukaisesti.
- **SwaggerGen + UseSwagger**: tuottaa OpenAPI JSON:n, jota Scalar UI voi lukea.
- **UseRouting / MapControllers**: reitittää `/api/...`-pyynnöt controllereille.
- **MapGet("/api/health", ...)**: tarjoaa health-check-endpointin samassa muodossa kuin nykyinen Node-backend.
- **app.Run("http://0.0.0.0:8001")**: palvelin käynnistyy portissa **8001**, jolloin frontendin konfiguraatiota ei tarvitse muuttaa.

---

## Vaihe 2: Tietokanta ja EF Core -mallinnus (Data + Models)

Tavoite: määritellä tietokantaentiteetit ja EF Core -konteksti niin, että käytetään samaa PostgreSQL-tietokantaa kuin nykyisessä Prisma-skeemassa (`User`, `Plant`, `Device`). Tiedostorakenne ja esimerkkikoodi perustuvat **moisture-backend** -toteutukseen.

**Paketit (.csproj)**

Tarvittavat paketit (mukaan lukien `Npgsql.EntityFrameworkCore.PostgreSQL`) on listattu ja asennettu [Vaihe 1: Tarvittavat NuGet-paketit ja asennuskomennot](#tarvittavat-nuget-paketit-ja-asennuskomennot). `Microsoft.EntityFrameworkCore` tulee Npgsql-paketin riippuvuutena. Esimerkki `Moisture.Backend.Api.csproj` -osion sisällöstä:

```xml
<ItemGroup>
  <PackageReference Include="Microsoft.AspNetCore.Authentication.JwtBearer" Version="10.0.2" />
  <PackageReference Include="Microsoft.AspNetCore.OpenApi" Version="10.0.2" />
  <PackageReference Include="Microsoft.EntityFrameworkCore.Design" Version="10.0.2" />
  <PackageReference Include="Npgsql.EntityFrameworkCore.PostgreSQL" Version="10.0.0" />
  <PackageReference Include="Scalar.AspNetCore" Version="2.12.24" />
  <PackageReference Include="Swashbuckle.AspNetCore" Version="10.1.0" />
</ItemGroup>
```

**Luotavat tiedostot ja sisältö**

### 2.1 `Models/Entities/User.cs`

Luodaan kansio `Models/Entities/` ja tiedosto `User.cs`. Käyttäjäentiteetti (auth):

```csharp
namespace Moisture.Backend.Api.Models.Entities;

public class User
{
    public int Id { get; set; }
    public string Email { get; set; } = default!;
    public string PasswordHash { get; set; } = default!;
    public string Name { get; set; } = default!;
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}
```

- `Email`: yksilöllinen; unique-indeksi määritellään `AppDbContext`:ssä Fluent APIlla.
- `PasswordHash`: salasanan hash (esim. ASP.NET Identity `PasswordHasher`). Prisma-skeemassa sarake voi olla `password`; tarvittaessa mapataan `[Column("password")]` tai Fluent API.

### 2.2 `Models/Entities/Device.cs`

Laiteentiteetti ja status-enum. Enum vastaa Prisman `Status` (ok / fault / offline):

```csharp
namespace Moisture.Backend.Api.Models.Entities;

public enum DeviceStatus
{
    Ok,
    Fault,
    Offline
}

public class Device
{
    public int Id { get; set; }
    public DeviceStatus Status { get; set; } = DeviceStatus.Ok;
    public int Battery { get; set; }
    public bool Watering { get; set; }
    public int Moisture { get; set; }

    public int PlantId { get; set; }
    public Plant Plant { get; set; } = default!;

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
}
```

- `PlantId`: viite kasviin; 1–1-suhde konfiguroidaan `AppDbContext`:ssä.
- Prisma-skeemassa `moisture` on `Float`; tässä `int`. Jos jaetaan sama tietokanta, voi olla tarpeen käyttää `double`/`float` tai sarakemapping.

### 2.3 `Models/Entities/Plant.cs`

Kasvientiteetti ja viittaus laitteeseen:

```csharp
namespace Moisture.Backend.Api.Models.Entities;

public class Plant
{
    public int Id { get; set; }
    public string Name { get; set; } = default!;
    public string Species { get; set; } = default!;
    public string? Location { get; set; }
    public string? Notes { get; set; }

    public Device Device { get; set; } = default!;

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
}
```

- `Location` ja `Notes` valinnaisia; `Device` 1–1-navigaatio.

### 2.4 `Data/AppDbContext.cs`

Luodaan kansio `Data/` ja tiedosto `AppDbContext.cs`. EF Core -konteksti, `DbSet`:it ja Fluent API -konfiguraatiot:

```csharp
using Microsoft.EntityFrameworkCore;
using Moisture.Backend.Api.Models.Entities;

namespace Moisture.Backend.Api.Data;

public class AppDbContext(DbContextOptions<AppDbContext> options) : DbContext(options)
{
    public DbSet<User> Users => Set<User>();
    public DbSet<Plant> Plants => Set<Plant>();
    public DbSet<Device> Devices => Set<Device>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        modelBuilder.Entity<User>(entity =>
        {
            entity.HasKey(u => u.Id);
            entity.HasIndex(u => u.Email).IsUnique();
        });

        modelBuilder.Entity<Plant>(entity =>
        {
            entity.HasKey(p => p.Id);

            entity.HasOne(p => p.Device)
                .WithOne(d => d.Plant)
                .HasForeignKey<Device>(d => d.PlantId)
                .OnDelete(DeleteBehavior.Cascade);
        });

        modelBuilder.Entity<Device>(entity =>
        {
            entity.HasKey(d => d.Id);
        });
    }
}
```

- **User**: avain `Id`, yksilöllinen indeksi `Email`:lle.
- **Plant–Device**: 1–1-suhde, `Device.PlantId` vierasavaimena. `OnDelete(DeleteBehavior.Cascade)` vastaa Prisman `onDelete: Cascade`.
- **Device**: vain avain; enum `DeviceStatus` tallennetaan oletuksena numerona. Jos tietokannassa on pg-enum tai merkkijono, käytä tarvittaessa `.HasConversion(...)`.

### 2.5 Tietokantayhteys ja DI (Program.cs)

Lisää `Program.cs`:ään Data-kerros ja yhteysmerkkijono:

- Yhteysmerkkijono: `Configuration.GetConnectionString("DefaultConnection")` tai `Configuration["DATABASE_URL"]` (ympäristömuuttuja). Arvot asetetaan kohdan [Ympäristömuuttujien käyttöönotto](#ympäristömuuttujien-käyttöönotto) mukaisesti.
- Rekisteröi `AppDbContext`: `AddDbContext<AppDbContext>(options => options.UseNpgsql(connectionString))`. Suodata `UseNpgsql`-kutsu eholla, jos `connectionString` on tyhjä (kehitystilanteet).

Esimerkki:

```csharp
using Microsoft.EntityFrameworkCore;
using Moisture.Backend.Api.Data;

// ...

var connectionString =
    builder.Configuration.GetConnectionString("DefaultConnection") ??
    builder.Configuration["DATABASE_URL"];

builder.Services.AddDbContext<AppDbContext>(options =>
{
    if (!string.IsNullOrWhiteSpace(connectionString))
    {
        options.UseNpgsql(connectionString);
    }
});
```

### 2.6 Migraatiot ja yhteensopivuus Prisma-skeeman kanssa

- **EF Core -migraatiot**: jos luot taulut EF:llä, aja `dotnet ef migrations add InitialCreate` ja `dotnet ef database update`. Tällöin taulut noudattavat EF:n oletusarvoja (esim. sarakkeenimet PascalCase).
- **Olemassa oleva Prisma-skeema**: jos käytät jo olemassa olevaa tietokantaa (Prisma-migraatiot), taulujen ja sarakkeiden nimet noudattavat Prismaa (usein camelCase). Tällöin käytä Fluent API -konfiguraatiota tai `[Column("sarakkeenimi")]` -attribuutteja, jotta EF mappaa oikeisiin sarakkeisiin. Tarkista erityisesti `User` (esim. `password` vs `PasswordHash`), aikaleimat (`createdAt` / `updatedAt`) ja `Device.Moisture` (float vs int).

**Vaihe 2 yhteenveto**

| Tiedosto | Vastuu |
|----------|--------|
| `Models/Entities/User.cs` | Käyttäjäentiteetti |
| `Models/Entities/Device.cs` | `DeviceStatus`-enum, laiteentiteetti |
| `Models/Entities/Plant.cs` | Kasvientiteetti, navigaatio `Device` |
| `Data/AppDbContext.cs` | DbSets, Fluent API (avaimet, indeksit, 1–1-suhde) |
| `Program.cs` | Connection string, `AddDbContext` + `UseNpgsql` |
| `*.csproj` | `Npgsql.EntityFrameworkCore.PostgreSQL` -paketti |

---

## Vaihe 3: DTO:t ja API-sopimuksen säilyttäminen (Models)

Tavoite: vastaukset pysyvät yhteensopivina nykyisen Nodella toteutetun API:n kanssa. DTO:t sijoitetaan **Models**-kerrokseen. Tiedostorakenne ja esimerkkikoodi perustuvat **moisture-backend** -toteutukseen.

**API-sopimus (yhteenveto):**

- **Auth**: `POST /api/auth/register` → `201` + `{ id, email, name }`; `POST /api/auth/login` → `200` + `{ token, user: { id, email, name } }`.
- **Kasvit**: `GET /api/plants` → `{ total, offset, limit, items }`; `GET /api/plants/{id}` → `Plant` tai `404`; `POST /api/plants` → `201` + luotu `Plant`; `POST /api/plants/{id}/water` → `200` + päivitetty `Plant`; `DELETE /api/plants/{id}` → `204` tai virhekoodit.

**Luotavat tiedostot ja sisältö**

### 3.1 `Models/Dtos/AuthDtos.cs`

Luodaan kansio `Models/Dtos/` ja tiedosto `AuthDtos.cs`. Sisältää rekisteröinti-/kirjautumis-pyynnöt ja -vastaukset:

```csharp
namespace Moisture.Backend.Api.Models.Dtos;

public record UserDto(
    int Id,
    string Email,
    string Name
);

public record LoginResponseDto(
    string Token,
    UserDto User
);

public record RegisterRequestDto(
    string Email,
    string Password,
    string Name
);

public record LoginRequestDto(
    string Email,
    string Password
);
```

- `UserDto`: API-vastauksissa käytettävä käyttäjä-ilman salasanaa (`id`, `email`, `name`).
- `LoginResponseDto`: login-vastaus (`token`, `user`). Controller voi serialisoida myös anonymilla objektilla `{ token, user }` halutessaan.
- `RegisterRequestDto` / `LoginRequestDto`: `POST /api/auth/register`- ja `POST /api/auth/login`-bodyt.

### 3.2 `Models/Dtos/PlantDtos.cs`

Luodaan tiedosto `Models/Dtos/PlantDtos.cs`. Sisältää kasvi- ja laite-DTO:t sekä extension-muunnoksen entiteetistä DTO:ksi:

```csharp
using Moisture.Backend.Api.Models.Entities;

namespace Moisture.Backend.Api.Models.Dtos;

public record DeviceDto(
    int Id,
    string Status,
    int Battery,
    bool Watering,
    int Moisture
);

public record PlantDto(
    int Id,
    string Name,
    string Species,
    string? Location,
    string? Notes,
    DeviceDto Device
);

public record PagedPlantsResponseDto(
    int Total,
    int Offset,
    int Limit,
    IReadOnlyList<PlantDto> Items
);

public static class PlantMapping
{
    public static PlantDto ToDto(this Plant plant)
    {
        var d = plant.Device;
        return new PlantDto(
            plant.Id,
            plant.Name,
            plant.Species,
            plant.Location,
            plant.Notes,
            new DeviceDto(
                d.Id,
                d.Status.ToString().ToLowerInvariant(),
                d.Battery,
                d.Watering,
                d.Moisture
            )
        );
    }
}
```

- `DeviceDto`: `status` merkkijonona (`ok` / `fault` / `offline`). (Tämä muutetaan myöhemmin enum:ksi kokonaan)
- `PlantDto`: kasvi ja sisäkkäinen `device`; `location` ja `notes` ovat valinnaisia.
- `PagedPlantsResponseDto`: `GET /api/plants` -vastaus (`total`, `offset`, `limit`, `items`).
- `PlantMapping.ToDto`: EF Core -`Plant`-entiteetti (ja `Device`) muunnetaan DTOiksi. **Services**-kerros käyttää tätä; repositories palauttavat edelleen entiteettejä.

**Vaihe 3 yhteenveto**

| Tiedosto | Vastuu |
|----------|--------|
| `Models/Dtos/AuthDtos.cs` | Auth-pyyntö-/vastaus-DTO:t |
| `Models/Dtos/PlantDtos.cs` | Kasvi-/laite-DTO:t, `PagedPlantsResponseDto`, `PlantMapping.ToDto` |

---

## Vaihe 4: Autentikointi ja JWT (Controllers, Services, Repositories, Models)

Tavoite: rekisteröinti ja kirjautuminen `POST /api/auth/*` -endpointteina, JWT-pohjainen suojaus kasvi-endpointeille. **Auth**- ja **Health**-endpointit jäävät ilman `[Authorize]`; **Plants** suojataan. Luotavat tiedostot ja esimerkkikoodi vastaavat **moisture-backend** -toteutusta.

**JWT-konfiguraatio (Program.cs)**

Vaihe 1:ssä (tai tässä vaiheessa) varmistetaan:

- `builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme).AddJwtBearer(...)` käyttäen salaisuutta `JWT_SECRET` (tai `Jwt:Key`).
- Tokenissa claimit `id` ja `email`, voimassaoloaika 2 h.

**Luotavat tiedostot ja sisältö**

### 4.1 `Repositories/IAuthRepository.cs`

Rajapinta käyttäjähakuun ja -lisäykseen:

```csharp
using Moisture.Backend.Api.Models.Entities;

namespace Moisture.Backend.Api.Repositories;

public interface IAuthRepository
{
    Task<User?> GetByEmailAsync(string email, CancellationToken cancellationToken = default);
    Task<User> AddAsync(User user, CancellationToken cancellationToken = default);
}
```

### 4.2 `Repositories/AuthRepository.cs`

Toteutus EF Core / `AppDbContext` -pohjalla:

```csharp
using Microsoft.EntityFrameworkCore;
using Moisture.Backend.Api.Data;
using Moisture.Backend.Api.Models.Entities;

namespace Moisture.Backend.Api.Repositories;

public class AuthRepository(AppDbContext db) : IAuthRepository
{
    public Task<User?> GetByEmailAsync(string email, CancellationToken cancellationToken = default)
        => db.Users.FirstOrDefaultAsync(u => u.Email == email, cancellationToken);

    public async Task<User> AddAsync(User user, CancellationToken cancellationToken = default)
    {
        db.Users.Add(user);
        await db.SaveChangesAsync(cancellationToken);
        return user;
    }
}
```

### 4.3 `Services/IAuthService.cs`

Rajapinta rekisteröinnille ja kirjautumiselle:

```csharp
using Moisture.Backend.Api.Models.Dtos;

namespace Moisture.Backend.Api.Services;

public interface IAuthService
{
    Task<UserDto> RegisterAsync(RegisterRequestDto request, CancellationToken cancellationToken = default);
    Task<LoginResponseDto> LoginAsync(LoginRequestDto request, CancellationToken cancellationToken = default);
}
```

### 4.4 `Services/AuthService.cs`

Logiikka: salasanan hash (esim. `Microsoft.AspNetCore.Identity.PasswordHasher<User>`), käyttäjän tarkistus, JWT:n generointi. Käyttää `IAuthRepository` ja `IConfiguration` (esim. `JWT_SECRET`).

- **Rekisteröinti**: tarkista sähköposti `GetByEmailAsync`; jos löytyy → heitä `InvalidOperationException("EMAIL_TAKEN")`. Hashaa salasana, luo `User`, tallenna `AddAsync`, palauta `UserDto`.
- **Kirjautuminen**: hae käyttäjä `GetByEmailAsync`; jos ei löydy tai salasana väärin → heitä `InvalidOperationException("INVALID_CREDENTIALS")`. Luo JWT (claimit `id`, `email`, 2 h), palauta `LoginResponseDto(token, userDto)`.

Esimerkkirunko (JWT-logiikka):

```csharp
// JWT: config["JWT_SECRET"], claims "id" ja "email", expires UTC Now + 2h
// SigningCredentials HmacSha256, JwtSecurityTokenHandler.WriteToken
```

### 4.5 `Controllers/AuthController.cs`

HTTP-endpointit, ei `[Authorize]`:

- `[ApiController]`, `[Route("api/[controller]")]` → polut `/api/auth/register` ja `/api/auth/login`.
- `POST register`: `[FromBody] RegisterRequestDto` → `IAuthService.RegisterAsync`. Jos ok → `201` ja body `UserDto` (tai `Created(string.Empty, user)`). Jos `EMAIL_TAKEN` → `Conflict` (esim. `{ error = "Email already in use" }`).
- `POST login`: `[FromBody] LoginRequestDto` → `IAuthService.LoginAsync`. Jos ok → `200` ja body `{ token, user }`. Jos `INVALID_CREDENTIALS` → `Unauthorized` (esim. `{ error = "Invalid email or password" }`).

Virhetapaukset tunnistetaan esim. `InvalidOperationException`-viestillä (`"EMAIL_TAKEN"` / `"INVALID_CREDENTIALS"`), ja kontrolleri maps ne sopiviin statuskoodeihin.

### 4.6 DI-rekisteröinnit (Program.cs)

Lisätään Repositories- ja Services-kerrokseen:

```csharp
builder.Services.AddScoped<IAuthRepository, AuthRepository>();
builder.Services.AddScoped<IAuthService, AuthService>();
```

### 4.7 Suojaus Plants-endpointeille

- **PlantsController**: lisätään luokan tasolle `[Authorize]`. Kaikki `GET/POST/DELETE /api/plants` ja `POST /api/plants/{id}/water` vaativat `Authorization: Bearer <token>` -headerin.
- **AuthController** ja **HealthController** (tai `MapGet("/api/health")`) jätetään ilman `[Authorize]`.

**Vaihe 4 yhteenveto**

| Tiedosto | Vastuu |
|----------|--------|
| `Repositories/IAuthRepository.cs` | Auth-repositoryn rajapinta |
| `Repositories/AuthRepository.cs` | Käyttäjähaku ja -lisäys DbContextillä |
| `Services/IAuthService.cs` | Auth-palvelun rajapinta |
| `Services/AuthService.cs` | Rekisteröinti, kirjautuminen, JWT-generointi |
| `Controllers/AuthController.cs` | `POST /api/auth/register`, `POST /api/auth/login` |
| `Program.cs` | `AddScoped` Auth-repo ja -service; JWT kuten Vaihe 1 |

Viimeistään tässä vaiheessa: `PlantsController` → `[Authorize]`.

---

## Vaihe 5: Plants-endpointtien logiikka (Controllers, Services, Repositories, Models)

- **Controllers**: `PlantsController` sisältää seuraavat metodit:
  - `GetAll([FromQuery] PlantsQueryParameters query)`.
  - `GetOne(int id)`.
  - `ToggleWater(int id)`.
  - `CreatePlant([FromBody] CreatePlantRequest request)`.
  - `DeletePlant(int id)`.
- **Models**: `PlantsQueryParameters` sisältää:
  - `string? Q`, `string? Status`, `bool? Watering`, `string? Species`, `string? Sort`, `string? Order`, `int Offset = 0`, `int Limit = 20`.
- Logiikka kerroksittain:
  - **Controllers**: Samat oletukset ja validoinnit kuin nykyisessä `plants.controller.ts`-toteutuksessa (mm. `limit <= 100`, sallitut `sort` ja `status` arvot). Virhepolut (`400`, `404`, `500`) vastaavina kuin Node-backendissä.
  - **Services**: `PlantsService` kutsuu `PlantsRepository`-metodeja, muuntaa entiteetit DTOiksi (Models) ja palauttaa esim. `PagedPlantsResponseDto`n.
  - **Repositories**: `PlantsRepository` tekee EF Core -kyselyt Data/AppDbContextin kautta (suodatus, järjestys, sivutus, CRUD).

---

## Vaihe 6: API-dokumentaatio Scalar UI:lla

Swagger UI korvataan **Scalar UI** -komponentilla.

- Konfiguroidaan OpenAPI-kuvaus:
  - Hyödynnetään ASP.NET 10:n endpoint-metadataa ja/tai Swashbuckle/NSwag-työkaluja OpenAPI JSON:n generoimiseksi (esim. `/api/openapi.json`).
- Lisätään Scalar UI:
  - Lisätään Scalar UI -paketti ASP.NET-projektiin (esim. `Scalar.AspNetCore` tms. ajantasainen nuget-paketti).
  - Konfiguroidaan middleware/endpoint, joka:
    - Tarjoaa selaimessa käyttöliittymän esim. polussa `/api/docs` tai `/scalar`,
    - Lukee OpenAPI JSON:n polusta `/api/openapi.json`.
- Tavoite:
  - Kehittäjät voivat jatkossakin testata ja selata APIa selaimella, mutta Swagger UI:n sijaan käytössä on moderni Scalar UI.

---

## Vaihe 7: .gitignore

Varmista, että toteuttamasi backend projektisi sisältää **.gitignore** tiedoston, ennen kuin pushaat mitään github:n.

---

## Tehtäväosio: .NET-backendin toimivuuden testaus

Tavoite on varmistaa, että ASP.NET-backend toimii oikein ja vastaa samoja API-sopimuksia kuin Node-backend. Tehtävät voi suorittaa vaiheiden 1–7 jälkeen tai vastaavassa tilanteessa.

### Esivalmistelut

- ASP.NET-backend ajossa (paikallisesti tai Dockerissa) portissa **8001**.
- **Ympäristömuuttujat käytössä:** `DATABASE_URL` ja `JWT_SECRET` asetettu oikein – ks. kohdan [Ympäristömuuttujien käyttöönotto](#ympäristömuuttujien-käyttöönotto) ohjeet (launchSettings, shell-export tai Docker `.env`). Tietokanta saavutettavissa.
- Valinnainen: React-frontend kehitystilassa (`npm run dev`) ja osoittamassa `http://localhost:8001/api`:in.

### Tehtävä 1: Health-check

- **Pyyntö**: `GET http://localhost:8001/api/health`
- **Odotus**: `200 OK`, body esim. `{ "status": "ok", "ts": "<ISO8601>" }`.
- **Työkalut**: selain, `curl`, Postman, Swagger UI / Scalar UI.

```bash
curl -s http://localhost:8001/api/health
```

### Tehtävä 2: Rekisteröinti ja kirjautuminen

**2a) Rekisteröinti**

- **Pyyntö**: `POST http://localhost:8001/api/auth/register`
- **Body** (JSON): `{ "email": "test@example.com", "password": "salasana123", "name": "Test User" }`
- **Odotus**: `201 Created`, body `{ "id": <int>, "email": "...", "name": "..." }`. Jos sähköposti jo käytössä → `409 Conflict`, `{ "error": "Email already in use" }`.

```bash
curl -s -X POST http://localhost:8001/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"salasana123","name":"Test User"}'
```

**2b) Kirjautuminen**

- **Pyyntö**: `POST http://localhost:8001/api/auth/login`
- **Body** (JSON): `{ "email": "test@example.com", "password": "salasana123" }`
- **Odotus**: `200 OK`, body `{ "token": "<JWT>", "user": { "id", "email", "name" } }`. Väärät tunnukset → `401 Unauthorized`, `{ "error": "Invalid email or password" }`.

```bash
curl -s -X POST http://localhost:8001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"salasana123"}'
```

Tallenna vastauksesta `token` ja käytä sitä seuraavissa pyynnöissä headerissa: `Authorization: Bearer <token>`.

### Tehtävä 3: Kasvi-endpointit (JWT vaaditaan)

Käytä Tehtävä 2b:n tokenia headerissa `Authorization: Bearer <token>`.

**3a) Listaa kasvit**

- **Pyyntö**: `GET http://localhost:8001/api/plants?offset=0&limit=20`
- **Odotus**: `200 OK`, body `{ "total": <int>, "offset": 0, "limit": 20, "items": [ ... ] }`. Ilman validia tokenia → `401`.

**3b) Hae yksi kasvi**

- **Pyyntö**: `GET http://localhost:8001/api/plants/{id}`
- **Odotus**: `200 OK` + yksittäinen kasvi (sis. `device`), tai `404` jos id puuttuu.

**3c) Luo kasvi**

- **Pyyntö**: `POST http://localhost:8001/api/plants`
- **Body** (JSON): kasvi DTO (mm. `name`, `species`, `location`, `notes`, `device` sis. `status`, `battery`, `watering`, `moisture`). Muoto vastaa `PlantDto` / moisture-backend -toteutusta.
- **Odotus**: `201 Created` + luotu kasvi, tai `401` jos ei tokenia.

**3d) Toggle kastelu**

- **Pyyntö**: `POST http://localhost:8001/api/plants/{id}/water`
- **Odotus**: `200 OK` + päivitetty kasvi, tai `404` jos id puuttuu.

**3e) Poista kasvi**

- **Pyyntö**: `DELETE http://localhost:8001/api/plants/{id}`
- **Odotus**: `204 No Content`, tai `404` jos id puuttuu.

Esimerkki suojatulla pyynnöllä (korvaa `TOKEN` ja `ID`):

```bash
curl -s -H "Authorization: Bearer TOKEN" http://localhost:8001/api/plants
curl -s -H "Authorization: Bearer TOKEN" http://localhost:8001/api/plants/ID
```

### Tehtävä 4: Frontendiä käyttäen

- Käynnistä React-frontend (esim. `npm run dev` moisture-frontendissä) ja varmista, että se käyttää `http://localhost:8001/api` -pohjaa.
- Testaa: rekisteröidy / kirjaudu, listaa kasvit, luo kasvi, avaa yksittäinen kasvi, kastelu-toggle, poisto.
- Tarkista, ettei konsolissa tai verkossa ilmesty virheitä (CORS, 401, 404, 500).

### Yhteenveto

| Tehtävä | Mitä testataan |
|--------|-----------------|
| 1 | Health-endpoint, backend käynnissä |
| 2 | Auth: rekisteröinti, kirjautuminen, virhekoodit |
| 3 | Plants CRUD + water-toggle, JWT-suojaus |
| 4 | Frontendi + .NET-backend yhdessä |

Kun kaikki kohdat toimivat odotetusti, .NET-backendin toimivuus on perustestattu ja se on valmis korvaamaan Node-backendin.

Voit lopuksi poistaa vanhan moisture-backend toteutuksen projektista.

Oppimistehtävä projekti repositoriosi pitäisi näyttää vastaavalta palautuksessa

```md
oppimistehtävä-classroom-repositoriosi-nimi
├── moisture-backend-net (uusi .net 10 toteutus)
├── moisture-frontend (react frontend toteutus)
└── README.md
```

---
