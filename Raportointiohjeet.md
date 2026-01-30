# Raportointiohjeet: .NET-backendin testaus ja Scalar UI -kuvakaappaukset

Näillä ohjeilla raportoidaan [Migraatio-Suunnitelmassa](Migraatio-Suunnitelma.md) olevan **Tehtäväosion** (.NET-backendin toimivuuden testaus) suoritus. Kaikki API-kutsut tehdään **Scalar UI**:lla, ja jokaisesta onnistuneesta pyynnöstä otetaan kuvakaappaus, jossa **response** on selvästi näkyvissä.

---

## 1. Yleistä

### 1.1 Scalar UI

- **Polku:** `http://localhost:8001/scalar` (tai mikäli projekti käyttää eri polkua, esim. `/api/docs`, käytä sitä).
- Backend tulee olla käynnissä portissa **8001** ennen testausta.
- Avaa Scalar UI selaimessa ja käytä sitä kaikkiin Tehtävien 1–3 API-kutsuihin.

### 1.2 Kuvakaappaukset

- **Vaaditaan** yksi kuvakaappaus **jokaisesta** alla mainitusta pyynnöstä (Tehtävät 1, 2a, 2b, 3a–3e).
- Kuvakaappauksen tulee näyttää:
  - **Pyyntö:** metodi, URL ja tarvittaessa body (esim. request-osio auki).
  - **Vastaus (response):** statuskoodi (200, 201, 204 jne.) sekä **response body** (paitsi 204 No Content, jolloin body on tyhjä).
- Otetaan siis kuva **juuri sen hetken tilasta**, jolloin kyseinen pyyntö on tehty ja vastaus näkyy Scalar UI:ssa.
- Liitä kuvakaappaukset oppimistehtävän raporttiin.

### 1.3 Autentikointi (Tehtävät 3a–3e)

- Kasvi-endpointit vaativat **JWT-tokenin** (`Authorization: Bearer <token>`).
- Kirjaudu ensin sisään (Tehtävä 2b) ja **tallenna** vastauksesta `token`.
- Aseta Scalar UI:ssa token käyttöön (esim. "Authorize" / "Authentication" – syötä `Bearer <token>` tai pelkkä token, jos työkalu pyytää sitä erikseen). Tämän jälkeen kaikki Tehtävän 3 kutsut lähetetään automaattisesti oikealla headerilla.

---

## 2. Tehtävä 1: Health-check

**Pyyntö:** `GET /api/health`

**Odotettu vastaus:**
- **Status:** `200 OK`
- **Body:** `{ "status": "ok", "ts": "<ISO8601-aikaleima>" }`

**Raportointi:**
1. Avaa Scalar UI ja tee `GET /api/health` -kutsu.
2. Varmista, että vastaus on 200 ja body näyttää `status` ja `ts`.
3. **Ota kuvakaappaus**, jossa näkyvät pyyntö ja **koko response** (status + body).

---

## 3. Tehtävä 2a: Rekisteröinti

**Pyyntö:** `POST /api/auth/register`  
**Body (JSON):** esim.
```json
{
  "email": "test@example.com",
  "password": "salasana123",
  "name": "Test User"
}
```

**Odotettu vastaus:**
- **Status:** `201 Created`
- **Body:** `{ "id": <int>, "email": "test@example.com", "name": "Test User" }`

**Raportointi:**
1. Tee Scalar UI:lla `POST /api/auth/register` -kutsu yllä olevalla (tai vastaavalla) bodella.
2. Varmista, että vastaus on 201 ja body sisältää `id`, `email` ja `name`.
3. **Ota kuvakaappaus**, jossa näkyvät pyyntö (metodi, URL, body) ja **koko response** (status + body).

---

## 4. Tehtävä 2b: Kirjautuminen

**Pyyntö:** `POST /api/auth/login`  
**Body (JSON):** esim.
```json
{
  "email": "test@example.com",
  "password": "salasana123"
}
```

**Odotettu vastaus:**
- **Status:** `200 OK`
- **Body:** `{ "token": "<JWT>", "user": { "id": <int>, "email": "...", "name": "..." } }`

**Raportointi:**
1. Tee Scalar UI:lla `POST /api/auth/login` -kutsu yllä olevalla bodella.
2. Varmista, että vastaus on 200 ja body sisältää `token` sekä `user`-objektin.
3. **Ota kuvakaappaus**, jossa näkyvät pyyntö ja **koko response** (status + body). Token voi olla kuvassa piilotettu (sumu) tai näkyvissä; tärkeää että rakenne ja `user` näkyvät.
4. **Tallenna** `token` ja aseta se Scalar UI:n Authorize / Authentication -kohtaan ennen Tehtävää 3.

---

## 5. Tehtävä 3a: Listaa kasvit

**Pyyntö:** `GET /api/plants?offset=0&limit=20`  
**Header:** `Authorization: Bearer <token>`

**Odotettu vastaus:**
- **Status:** `200 OK`
- **Body:** `{ "total": <int>, "offset": 0, "limit": 20, "items": [ ... ] }`

**Raportointi:**
1. Aseta JWT Scalar UI:hin (ks. 1.3). Tee `GET /api/plants?offset=0&limit=20` -kutsu.
2. Varmista, että vastaus on 200 ja body sisältää `total`, `offset`, `limit` ja `items`.
3. **Ota kuvakaappaus**, jossa näkyvät pyyntö ja **koko response** (status + body).

---

## 6. Tehtävä 3b: Hae yksi kasvi

**Pyyntö:** `GET /api/plants/{id}`  
**Header:** `Authorization: Bearer <token>`  
Korvaa `{id}` jollakin olemassa olevalla kasvin id:llä (esim. listauksen perusteella).

**Odotettu vastaus:**
- **Status:** `200 OK`
- **Body:** Yksittäinen kasvi (sis. `id`, `name`, `species`, `location`, `notes`, `device` jne.).

**Raportointi:**
1. Tee `GET /api/plants/{id}` -kutsu oikealla id:llä.
2. Varmista, että vastaus on 200 ja body sisältää kasvin ja `device`-objektin.
3. **Ota kuvakaappaus**, jossa näkyvät pyyntö ja **koko response** (status + body).

---

## 7. Tehtävä 3c: Luo kasvi

**Pyyntö:** `POST /api/plants`  
**Header:** `Authorization: Bearer <token>`  
**Body (JSON):** esim.
```json
{
  "name": "Testikasvi",
  "species": "Orkidea",
  "location": "Olohuone",
  "notes": "Raportointitesti",
  "device": {
    "status": "ok",
    "battery": 100,
    "watering": false,
    "moisture": 50
  }
}
```
*Huom:* Jos API odottaa `PlantDto`-tyyppistä rakennetta (mm. `id` kenttä luonnissa puuttuu), sovita body vastaamaan backendin odotusta. Muoto voi vaihdella moisture-backend-2 -toteutuksen mukaan.

**Odotettu vastaus:**
- **Status:** `201 Created`
- **Body:** Luotu kasvi (sis. `id`, `name`, `species`, `location`, `notes`, `device` jne.).

**Raportointi:**
1. Tee `POST /api/plants` -kutsu yllä olevan kaltaisella bodella.
2. Varmista, että vastaus on 201 ja body sisältää luodun kasvin (ml. `id`).
3. **Ota kuvakaappaus**, jossa näkyvät pyyntö (body mukaan lukien) ja **koko response** (status + body).
4. Voit käyttää tätä kasvia Tehtävissä 3d ja 3e (water, delete).

---

## 8. Tehtävä 3d: Toggle kastelu

**Pyyntö:** `POST /api/plants/{id}/water`  
**Header:** `Authorization: Bearer <token>`  
Korvaa `{id}` edellisessä kohdassa luodun (tai muun olemassa olevan) kasvin id:llä.

**Odotettu vastaus:**
- **Status:** `200 OK`
- **Body:** Päivitetty kasvi (sis. muuttunut `device.watering` jne.).

**Raportointi:**
1. Tee `POST /api/plants/{id}/water` -kutsu.
2. Varmista, että vastaus on 200 ja body näyttää päivitetyn kasvin.
3. **Ota kuvakaappaus**, jossa näkyvät pyyntö ja **koko response** (status + body).

---

## 9. Tehtävä 3e: Poista kasvi

**Pyyntö:** `DELETE /api/plants/{id}`  
**Header:** `Authorization: Bearer <token>`  
Korvaa `{id}` poistettavan kasvin id:llä (voit käyttää 3c:ssä luotua).

**Odotettu vastaus:**
- **Status:** `204 No Content`
- **Body:** Tyhjä (ei bodyä).

**Raportointi:**
1. Tee `DELETE /api/plants/{id}` -kutsu.
2. Varmista, että vastaus on 204 ja body on tyhjä.
3. **Ota kuvakaappaus**, jossa näkyvät pyyntö ja **response**: status **204** sekä selkeä viesti siitä, että body on tyhjä (esim. Scalar UI:n “No content” / vastaava teksti). Statuskoodin tulee olla selvästi näkyvissä.

---

## 10. Tehtävä 4: Frontendiä käyttäen

Tehtävä 4 ei käytä Scalar UI:ta vaan React-frontendia. API-kutsut tehdään selaimen kautta.

**Raportointi:**
- Kuvaile lyhyesti, mitä testasit (rekisteröinti, kirjautuminen, kasvien listaus, luonti, yksittäinen kasvi, kastelu-toggle, poisto).
- Voit lisätä **yhdestä tai useammasta** tilanteesta kuvakaappauksen **selaimesta** (esim. listaus-, luonti- tai detail-näkymä) tai **DevTools – Network -välilehdeltä**, jossa näkyy onnistunut pyyntö ja vastaus. Scalar-kuvakaappauksia **ei vaadita** Tehtävästä 4.

---

## 11. Yhteenveto – vaaditut kuvakaappaukset

| Tehtävä | Pyyntö | Odotettu status | Kuvakaappaus |
|--------|--------|------------------|--------------|
| 1 | `GET /api/health` | 200 | Pyyntö + response (status + body) |
| 2a | `POST /api/auth/register` | 201 | Pyyntö + response (status + body) |
| 2b | `POST /api/auth/login` | 200 | Pyyntö + response (status + body) |
| 3a | `GET /api/plants?offset=0&limit=20` | 200 | Pyyntö + response (status + body) |
| 3b | `GET /api/plants/{id}` | 200 | Pyyntö + response (status + body) |
| 3c | `POST /api/plants` | 201 | Pyyntö + response (status + body) |
| 3d | `POST /api/plants/{id}/water` | 200 | Pyyntö + response (status + body) |
| 3e | `DELETE /api/plants/{id}` | 204 | Pyyntö + response (status, body tyhjä) |
| 4 | Frontend | – | Ei Scalar-kuvakaappauksia; valinnainen selain/Network-kuva |

**Yhteensä vähintään 8 Scalar UI -kuvakaappauksen** (1, 2a, 2b, 3a–3e) tulee olla raportissa, ja jokaisessa on nähtävillä kyseisen pyynnön **response** (status + body, paitsi 204 kohdalla body tyhjä).

---

## 12. Viittausten ja tarkistusten tekeminen

Ennen raportin luovutusta, tarkista:

1. Backend ajossa portissa 8001, Scalar UI avattavissa.
2. Jokainen taulukon pyyntö (1, 2a, 2b, 3a–3e) on tehty Scalar UI:lla ja vastaus vastaa odotettua.
3. Jokaisesta on oma kuvakaappaus, jossa **response on selvästi näkyvissä**.
4. Tehtävä 4 on kuvattu (ja halutessaan dokumentoitu selain-/Network-kuvalla).

Näiden jälkeen raportointi ohjeiden mukaisesti on kunnossa.
