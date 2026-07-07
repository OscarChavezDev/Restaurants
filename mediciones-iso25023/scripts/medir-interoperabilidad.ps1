# =============================================================================
# Medición de INTEROPERABILIDAD — ISO/IEC 25023 Tabla 8 (CIn-1-G, CIn-2-G, CIn-3-S)
# Requiere el stack corriendo (docker compose up -d).
# Salidas: resultados/interoperabilidad_detalle.csv y _resumen.csv
# =============================================================================
param(
    [string]$BaseUrl = 'http://localhost:8080/api',
    [string]$AdminEmail = 'admin@tingo-restaurants.com',
    [string]$AdminPassword = 'Admin@1234!'
)

. (Join-Path $PSScriptRoot 'comun.ps1')

Write-Host "=== Medicion de interoperabilidad (ISO/IEC 25023, Tabla 8) ===" -ForegroundColor Cyan
Write-Host "Entorno: $BaseUrl"
$fecha = Get-Date -Format 'yyyy-MM-dd HH:mm:ss'
$detalle = @()

# --- Autenticación (necesaria para CIn-1 formato JWT y CIn-3 interfaces) ----
$token = Get-TokenAdmin -BaseUrl $BaseUrl -Email $AdminEmail -Password $AdminPassword
if ($null -eq $token) {
    Write-Host "ERROR: no se pudo iniciar sesion como admin. Esta el stack corriendo?" -ForegroundColor Red
    exit 1
}
$authHeaders = @{ Authorization = "Bearer $token" }

# =============================================================================
# CIn-1-G — Intercambiabilidad de formatos de datos (B = 3)
# =============================================================================
Write-Host "`n[CIn-1-G] Formatos de datos..." -ForegroundColor Yellow

# Formato 1: JSON con envelope ApiResponse
$r = Invoke-Medicion -Metodo 'GET' -Url "$BaseUrl/v1/restaurants?page=0&size=1"
$ok1 = $false
if ($r.Estado -eq 200 -and (Test-EsJson $r.Cuerpo)) {
    $j = $r.Cuerpo | ConvertFrom-Json
    if ($null -ne $j.PSObject.Properties['success'] -and $null -ne $j.PSObject.Properties['data']) { $ok1 = $true }
}
$detalle += [pscustomobject]@{ medida='CIn-1-G'; item='JSON envelope ApiResponse'; prueba='GET /v1/restaurants'; estado_http=$r.Estado; resultado=$(if ($ok1) {'INTERCAMBIABLE'} else {'FALLA'}); evidencia='JSON valido con campos success y data' }

# Formato 2: OpenAPI 3 (JSON)
$r = Invoke-Medicion -Metodo 'GET' -Url "$BaseUrl/v3/api-docs"
$ok2 = $false
if ($r.Estado -eq 200 -and (Test-EsJson $r.Cuerpo)) {
    $j = $r.Cuerpo | ConvertFrom-Json
    if ($null -ne $j.PSObject.Properties['openapi']) { $ok2 = $true }
}
$detalle += [pscustomobject]@{ medida='CIn-1-G'; item='OpenAPI 3 (contrato JSON)'; prueba='GET /v3/api-docs'; estado_http=$r.Estado; resultado=$(if ($ok2) {'INTERCAMBIABLE'} else {'FALLA'}); evidencia='JSON valido con campo openapi' }

# Formato 3: JWT (RFC 7519): 3 segmentos Base64
$ok3 = (($token -split '\.').Count -eq 3)
$detalle += [pscustomobject]@{ medida='CIn-1-G'; item='JWT (RFC 7519)'; prueba='POST /v1/auth/login -> accessToken'; estado_http=200; resultado=$(if ($ok3) {'INTERCAMBIABLE'} else {'FALLA'}); evidencia='Token con estructura header.payload.signature' }

$a1 = @($ok1, $ok2, $ok3 | Where-Object { $_ }).Count
Write-Host "  CIn-1-G: A=$a1 B=3 X=$([math]::Round($a1/3.0, 4))"

# =============================================================================
# CIn-2-G — Suficiencia del protocolo de intercambio de datos (B = 3)
# =============================================================================
Write-Host "`n[CIn-2-G] Protocolos de intercambio..." -ForegroundColor Yellow

# Protocolo 1: HTTP/1.1 REST
$r = Invoke-Medicion -Metodo 'GET' -Url "$BaseUrl/v1/restaurants?page=0&size=1"
$p1 = ($r.Estado -eq 200)
$detalle += [pscustomobject]@{ medida='CIn-2-G'; item='HTTP/1.1 (REST)'; prueba='GET /v1/restaurants'; estado_http=$r.Estado; resultado=$(if ($p1) {'SOPORTADO'} else {'FALLA'}); evidencia='Respuesta 200 sobre HTTP' }

# Protocolo 2: Bearer JWT (RFC 6750): con token 200, sin token 401/403
$rCon = Invoke-Medicion -Metodo 'GET' -Url "$BaseUrl/v1/integration/restaurants" -Cabeceras $authHeaders
$rSin = Invoke-Medicion -Metodo 'GET' -Url "$BaseUrl/v1/integration/restaurants"
$p2 = ($rCon.Estado -eq 200 -and ($rSin.Estado -eq 401 -or $rSin.Estado -eq 403))
$detalle += [pscustomobject]@{ medida='CIn-2-G'; item='Autenticacion Bearer JWT (RFC 6750)'; prueba='GET /v1/integration/restaurants con y sin token'; estado_http="$($rCon.Estado)/$($rSin.Estado)"; resultado=$(if ($p2) {'SOPORTADO'} else {'FALLA'}); evidencia='200 con token; 401/403 sin token' }

# Protocolo 3: CORS preflight
$corsHeaders = @{ Origin = 'http://localhost:3000'; 'Access-Control-Request-Method' = 'GET' }
$r = Invoke-Medicion -Metodo 'OPTIONS' -Url "$BaseUrl/v1/restaurants" -Cabeceras $corsHeaders
$p3 = $false
if ($r.Estado -ge 200 -and $r.Estado -lt 300 -and $null -ne $r.CabecerasResp) {
    if ($r.CabecerasResp['Access-Control-Allow-Origin']) { $p3 = $true }
}
$detalle += [pscustomobject]@{ medida='CIn-2-G'; item='CORS (preflight)'; prueba='OPTIONS /v1/restaurants con Origin'; estado_http=$r.Estado; resultado=$(if ($p3) {'SOPORTADO'} else {'FALLA'}); evidencia='Cabecera Access-Control-Allow-Origin presente' }

$a2 = @($p1, $p2, $p3 | Where-Object { $_ }).Count
Write-Host "  CIn-2-G: A=$a2 B=3 X=$([math]::Round($a2/3.0, 4))"

# =============================================================================
# CIn-3-S — Adecuación de interfaces externas (B = 3, /v1/integration/**)
# =============================================================================
Write-Host "`n[CIn-3-S] Interfaces externas (/v1/integration)..." -ForegroundColor Yellow

# Interfaz 1: catálogo para Turismo/Transporte
$r = Invoke-Medicion -Metodo 'GET' -Url "$BaseUrl/v1/integration/restaurants?page=0&size=5" -Cabeceras $authHeaders
$i1 = ($r.Estado -eq 200 -and (Test-EsJson $r.Cuerpo))
$detalle += [pscustomobject]@{ medida='CIn-3-S'; item='Catalogo de restaurantes (Turismo/Transporte)'; prueba='GET /v1/integration/restaurants'; estado_http=$r.Estado; resultado=$(if ($i1) {'FUNCIONAL'} else {'FALLA'}); evidencia='200 + envelope JSON' }

# Obtener un id real de restaurante desde el catálogo público
$idRestaurante = $null
$rPub = Invoke-Medicion -Metodo 'GET' -Url "$BaseUrl/v1/restaurants?page=0&size=1"
if ($rPub.Estado -eq 200 -and (Test-EsJson $rPub.Cuerpo)) {
    $j = $rPub.Cuerpo | ConvertFrom-Json
    $datos = $j.data
    if ($null -ne $datos) {
        if ($null -ne $datos.PSObject.Properties['content'] -and @($datos.content).Count -gt 0) {
            $idRestaurante = $datos.content[0].id
        } elseif (@($datos).Count -gt 0 -and $null -ne @($datos)[0].PSObject.Properties['id']) {
            $idRestaurante = @($datos)[0].id
        }
    }
}

# Interfaz 2: disponibilidad de un restaurante (Hoteles)
if ($null -ne $idRestaurante) {
    $r = Invoke-Medicion -Metodo 'GET' -Url "$BaseUrl/v1/integration/restaurants/$idRestaurante/availability" -Cabeceras $authHeaders
    $i2 = ($r.Estado -eq 200 -and (Test-EsJson $r.Cuerpo))
    $est2 = $r.Estado
} else {
    $i2 = $false; $est2 = 'SIN_ID'
}
$detalle += [pscustomobject]@{ medida='CIn-3-S'; item='Disponibilidad de restaurante (Hoteles)'; prueba="GET /v1/integration/restaurants/{id}/availability"; estado_http=$est2; resultado=$(if ($i2) {'FUNCIONAL'} else {'FALLA'}); evidencia='200 + envelope JSON con datos del restaurante' }

# Interfaz 3: restaurantes cerca de un evento (Eventos)
$eventId = [guid]::NewGuid().ToString()
$r = Invoke-Medicion -Metodo 'GET' -Url "$BaseUrl/v1/integration/restaurants/near-event/${eventId}?radiusKm=3.0" -Cabeceras $authHeaders
$i3 = ($r.Estado -eq 200 -and (Test-EsJson $r.Cuerpo))
$detalle += [pscustomobject]@{ medida='CIn-3-S'; item='Restaurantes cerca de evento (Eventos)'; prueba='GET /v1/integration/restaurants/near-event/{eventId}'; estado_http=$r.Estado; resultado=$(if ($i3) {'FUNCIONAL'} else {'FALLA'}); evidencia='200 + envelope JSON (lista, hoy vacia)' }

$a3 = @($i1, $i2, $i3 | Where-Object { $_ }).Count
Write-Host "  CIn-3-S: A=$a3 B=3 X=$([math]::Round($a3/3.0, 4))"

# =============================================================================
# Exportar resultados
# =============================================================================
$carpeta = Get-CarpetaResultados

$resumen = @(
    [pscustomobject]@{ id='CIn-1-G'; nombre='Intercambiabilidad de formatos de datos'; A=$a1; B=3; X=[math]::Round($a1/3.0, 4); interpretacion='1.0 = todos los formatos especificados son intercambiables'; fecha=$fecha; entorno=$BaseUrl }
    [pscustomobject]@{ id='CIn-2-G'; nombre='Suficiencia del protocolo de intercambio de datos'; A=$a2; B=3; X=[math]::Round($a2/3.0, 4); interpretacion='1.0 = todos los protocolos especificados estan soportados'; fecha=$fecha; entorno=$BaseUrl }
    [pscustomobject]@{ id='CIn-3-S'; nombre='Adecuacion de interfaces externas'; A=$a3; B=3; X=[math]::Round($a3/3.0, 4); interpretacion='1.0 = todas las interfaces externas son funcionales'; fecha=$fecha; entorno=$BaseUrl }
)

Write-Host "`nResultados:" -ForegroundColor Green
Export-Resultado -Filas $detalle -Ruta (Join-Path $carpeta 'interoperabilidad_detalle.csv')
Export-Resultado -Filas $resumen -Ruta (Join-Path $carpeta 'interoperabilidad_resumen.csv')
$resumen | Format-Table id, A, B, X -AutoSize
