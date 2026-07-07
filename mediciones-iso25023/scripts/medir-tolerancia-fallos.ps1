# =============================================================================
# Medición de TOLERANCIA A FALLOS — ISO/IEC 25023 Tabla 17 (RFt-1-G, RFt-2-S, RFt-3-S)
#   RFt-1-G  Evitacion de fallos: X = fallos evitados / casos de patron de fallo
#   RFt-2-S  Redundancia de componentes: X = componentes redundantes / componentes
#   RFt-3-S  Tiempo medio de notificacion de fallo: X = promedio(Ai - Bi)
# Requiere el stack corriendo (docker compose up -d).
# Salidas: resultados/tolerancia_fallos_casos.csv, _componentes.csv y _resumen.csv
# =============================================================================
param(
    [string]$BaseUrl = 'http://localhost:8080/api',
    [string]$ComposeDir = ''
)

. (Join-Path $PSScriptRoot 'comun.ps1')

if ([string]::IsNullOrWhiteSpace($ComposeDir)) {
    # raiz del repo = dos niveles arriba de scripts/
    $ComposeDir = Split-Path -Parent (Split-Path -Parent $PSScriptRoot)
}

$fecha = Get-Date -Format 'yyyy-MM-dd HH:mm:ss'
Write-Host "=== Medicion de tolerancia a fallos (ISO/IEC 25023, Tabla 17) ===" -ForegroundColor Cyan
Write-Host "Entorno: $BaseUrl"

# =============================================================================
# RFt-1-G + RFt-3-S — Casos de patron de fallo ("casi provocando fallos")
# Fallo EVITADO = respuesta HTTP controlada 4xx (nunca 5xx ni desconexion).
# Bi = instante de inyeccion; Ai = instante de la respuesta de error -> Ai-Bi = latencia de notificacion.
# =============================================================================
Write-Host "`n[RFt-1-G / RFt-3-S] Ejecutando casos de patron de fallo..." -ForegroundColor Yellow

$uuidAleatorio = [guid]::NewGuid().ToString()
$loginUrl = "$BaseUrl/v1/auth/login"
$casos = @(
    @{ n=1;  nombre='JSON malformado';                 metodo='POST';   url=$loginUrl; cuerpo='{invalid json...'; ct='application/json' }
    @{ n=2;  nombre='Violacion de validacion';         metodo='POST';   url=$loginUrl; cuerpo=(@{ email='no-es-email'; password='' } | ConvertTo-Json -Compress); ct='application/json' }
    @{ n=3;  nombre='Credenciales incorrectas';        metodo='POST';   url=$loginUrl; cuerpo=(@{ email='admin@tingo-restaurants.com'; password='clave-incorrecta-123' } | ConvertTo-Json -Compress); ct='application/json' }
    @{ n=4;  nombre='Recurso inexistente';             metodo='GET';    url="$BaseUrl/v1/restaurants/$uuidAleatorio"; cuerpo=$null; ct=$null }
    @{ n=5;  nombre='Identificador con tipo invalido'; metodo='GET';    url="$BaseUrl/v1/restaurants/no-es-uuid";     cuerpo=$null; ct=$null }
    @{ n=6;  nombre='Ruta inexistente';                metodo='GET';    url="$BaseUrl/v1/ruta-que-no-existe";         cuerpo=$null; ct=$null }
    @{ n=7;  nombre='Acceso sin autenticacion';        metodo='GET';    url="$BaseUrl/v1/integration/restaurants";    cuerpo=$null; ct=$null }
    @{ n=8;  nombre='Token corrupto';                  metodo='GET';    url="$BaseUrl/v1/integration/restaurants";    cuerpo=$null; ct=$null; cabeceras=@{ Authorization='Bearer token.corrupto.basura' } }
    @{ n=9;  nombre='Metodo HTTP no soportado';        metodo='DELETE'; url=$loginUrl; cuerpo=$null; ct=$null }
    @{ n=10; nombre='Content-Type incorrecto';         metodo='POST';   url=$loginUrl; cuerpo='email=admin&password=123'; ct='text/plain' }
    @{ n=11; nombre='Parametro fuera de rango';        metodo='GET';    url="$BaseUrl/v1/restaurants?page=-1&size=10"; cuerpo=$null; ct=$null }
    @{ n=12; nombre='Cuerpo vacio requerido';          metodo='POST';   url=$loginUrl; cuerpo=''; ct='application/json' }
)

$filasCasos = @()
$evitados = 0
$latencias = @()
foreach ($c in $casos) {
    $cab = $null
    if ($c.ContainsKey('cabeceras')) { $cab = $c.cabeceras }
    if ($null -ne $c.ct) {
        $r = Invoke-Medicion -Metodo $c.metodo -Url $c.url -Cuerpo $c.cuerpo -ContentType $c.ct -Cabeceras $cab
    } else {
        $r = Invoke-Medicion -Metodo $c.metodo -Url $c.url -Cabeceras $cab
    }
    $esJson = Test-EsJson $r.Cuerpo
    $evitado = ($r.Estado -ge 400 -and $r.Estado -lt 500)
    if ($evitado) { $evitados++; $veredicto = 'EVITADO' } else { $veredicto = 'NO_EVITADO' }
    $latSeg = [math]::Round($r.LatenciaMs / 1000.0, 3)
    $latencias += $latSeg

    $filasCasos += [pscustomobject]@{
        caso = $c.n
        patron_de_fallo = $c.nombre
        peticion = "$($c.metodo) $($c.url)"
        estado_http = $r.Estado
        respuesta_json = $(if ($esJson) { 'SI' } else { 'NO' })
        veredicto = $veredicto
        Bi_inyeccion = $r.Inicio.ToString('HH:mm:ss.fff')
        latencia_notificacion_s = $latSeg
        error_conexion = $r.Error
    }
    if ($evitado) { $color = 'Green' } else { $color = 'Red' }
    Write-Host ("  Caso {0,2}: {1,-32} HTTP {2,3} -> {3} ({4} s)" -f $c.n, $c.nombre, $r.Estado, $veredicto, $latSeg) -ForegroundColor $color
}

# Verificar que el sistema sigue operativo tras la bateria completa
$rSalud = Invoke-Medicion -Metodo 'GET' -Url "$BaseUrl/actuator/health"
$sigueVivo = ($rSalud.Estado -eq 200)
if ($sigueVivo) { $msgVivo = 'UP (ningun caso tumbo el servicio)' } else { $msgVivo = "PROBLEMA: health respondio $($rSalud.Estado)" }
Write-Host "`n  Salud post-bateria: $msgVivo"

$b1 = $casos.Count
$x1 = [math]::Round($evitados / [double]$b1, 4)

# RFt-3-S: promedio de latencias de notificacion (Ai - Bi) en segundos
$n = $latencias.Count
$suma = [math]::Round(($latencias | Measure-Object -Sum).Sum, 3)
$x3 = [math]::Round($suma / [double]$n, 3)

# =============================================================================
# RFt-2-S — Redundancia de componentes (inventario Docker Compose)
# =============================================================================
Write-Host "`n[RFt-2-S] Inventario de componentes..." -ForegroundColor Yellow

$servicios = @()
try {
    $salida = & docker compose --project-directory $ComposeDir config --services 2>$null
    if ($LASTEXITCODE -eq 0 -and $null -ne $salida) {
        $servicios = @($salida | Where-Object { -not [string]::IsNullOrWhiteSpace($_) } | ForEach-Object { $_.Trim() })
    }
} catch {}
if ($servicios.Count -eq 0) {
    # Respaldo si docker no esta disponible: componentes conocidos del compose
    $servicios = @('postgres', 'backend', 'frontend', 'adminer')
    Write-Host "  (docker no disponible; usando inventario conocido del docker-compose.yml)" -ForegroundColor DarkYellow
}

$filasComponentes = @()
$redundantes = 0
foreach ($s in $servicios) {
    $instancias = 1
    try {
        $ps = & docker compose --project-directory $ComposeDir ps -q $s 2>$null
        if ($LASTEXITCODE -eq 0 -and $null -ne $ps) { $instancias = @($ps | Where-Object { $_ }).Count }
        if ($instancias -lt 1) { $instancias = 1 }
    } catch {}
    $esRedundante = ($instancias -gt 1)
    if ($esRedundante) { $redundantes++ }
    $filasComponentes += [pscustomobject]@{
        componente = $s
        instancias = $instancias
        redundante = $(if ($esRedundante) { 'SI' } else { 'NO' })
        observacion = 'Entorno local Docker Compose. En produccion: Neon (BD replicada gestionada), Vercel (frontend multi-nodo), Render free (1 instancia backend).'
    }
    Write-Host ("  {0,-10} instancias: {1}  redundante: {2}" -f $s, $instancias, $(if ($esRedundante) { 'SI' } else { 'NO' }))
}
$b2 = $servicios.Count
$x2 = [math]::Round($redundantes / [double]$b2, 4)

# =============================================================================
# Exportar resultados
# =============================================================================
$carpeta = Get-CarpetaResultados

$resumen = @(
    [pscustomobject]@{ id='RFt-1-G'; nombre='Evitacion de fallos'; A=$evitados; B=$b1; X=$x1; interpretacion='Proporcion de patrones de fallo controlados (1.0 = mejor). Sistema siguio UP tras la bateria: ' + $(if ($sigueVivo) {'SI'} else {'NO'}); fecha=$fecha; entorno=$BaseUrl }
    [pscustomobject]@{ id='RFt-2-S'; nombre='Redundancia de componentes'; A=$redundantes; B=$b2; X=$x2; interpretacion='Proporcion de componentes instalados de forma redundante (entorno local; ver _componentes.csv para produccion)'; fecha=$fecha; entorno=$BaseUrl }
    [pscustomobject]@{ id='RFt-3-S'; nombre='Tiempo medio de notificacion de fallo'; A="suma=$suma s"; B="n=$n"; X=$x3; interpretacion='Segundos promedio entre inyeccion del fallo (Bi) y su reporte al consumidor (Ai). Cerca de 0 = mejor'; fecha=$fecha; entorno=$BaseUrl }
)

Write-Host "`nResultados:" -ForegroundColor Green
Export-Resultado -Filas $filasCasos -Ruta (Join-Path $carpeta 'tolerancia_fallos_casos.csv')
Export-Resultado -Filas $filasComponentes -Ruta (Join-Path $carpeta 'tolerancia_fallos_componentes.csv')
Export-Resultado -Filas $resumen -Ruta (Join-Path $carpeta 'tolerancia_fallos_resumen.csv')
$resumen | Format-Table id, A, B, X -AutoSize
