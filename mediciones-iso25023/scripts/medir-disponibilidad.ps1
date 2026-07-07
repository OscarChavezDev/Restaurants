# =============================================================================
# Medición de DISPONIBILIDAD — ISO/IEC 25023 Tabla 16 (RAv-1-G, RAv-2-G)
# Monitorea GET /actuator/health durante una ventana de tiempo y calcula:
#   RAv-1-G  X = tiempo disponible / tiempo programado
#   RAv-2-G  X = tiempo total de inactividad / numero de fallos
# Para que RAv-2-G tenga datos, provoca una averia controlada durante la ventana:
#   docker stop restaurants-backend   (esperar 30-60 s)   docker start restaurants-backend
# Salidas: resultados/disponibilidad_muestras.csv y _resumen.csv
# =============================================================================
param(
    [string]$BaseUrl = 'http://localhost:8080/api',
    [int]$DuracionMinutos = 10,
    [int]$IntervaloSegundos = 5,
    # Sufijo para los archivos de salida (p. ej. '_prod' para no pisar la medicion local)
    [string]$Sufijo = ''
)

. (Join-Path $PSScriptRoot 'comun.ps1')

$healthUrl = "$BaseUrl/actuator/health"
$fin = (Get-Date).AddMinutes($DuracionMinutos)
$fecha = Get-Date -Format 'yyyy-MM-dd HH:mm:ss'
$carpeta = Get-CarpetaResultados
$rutaMuestras = Join-Path $carpeta "disponibilidad_muestras$Sufijo.csv"

Write-Host "=== Medicion de disponibilidad (ISO/IEC 25023, Tabla 16) ===" -ForegroundColor Cyan
Write-Host "Endpoint: $healthUrl"
Write-Host "Ventana: $DuracionMinutos min, muestreo cada $IntervaloSegundos s. Fin estimado: $fin"
Write-Host "Sugerencia: provoca una averia controlada durante la ventana (ver docs/disponibilidad.md)`n"

# CSV incremental (sobrevive aunque se corte el script)
'timestamp,estado,http_status,latencia_ms' | Set-Content -Path $rutaMuestras -Encoding UTF8

$muestras = @()
while ((Get-Date) -lt $fin) {
    $r = Invoke-Medicion -Metodo 'GET' -Url $healthUrl -TimeoutSec ([math]::Max(2, $IntervaloSegundos - 1))
    $up = $false
    if ($r.Estado -eq 200 -and (Test-EsJson $r.Cuerpo)) {
        $j = $r.Cuerpo | ConvertFrom-Json
        if ($j.status -eq 'UP') { $up = $true }
    }
    if ($up) { $estado = 'DISPONIBLE' } else { $estado = 'NO_DISPONIBLE' }
    $ts = $r.Inicio.ToString('yyyy-MM-dd HH:mm:ss')
    "$ts,$estado,$($r.Estado),$($r.LatenciaMs)" | Add-Content -Path $rutaMuestras -Encoding UTF8
    $muestras += [pscustomobject]@{ Timestamp = $r.Inicio; Up = $up }

    if ($up) { $color = 'Green' } else { $color = 'Red' }
    Write-Host ("[{0}] {1} (HTTP {2}, {3} ms)" -f $ts, $estado, $r.Estado, $r.LatenciaMs) -ForegroundColor $color

    # Descontar la duración de la petición para mantener el ritmo de muestreo
    $espera = $IntervaloSegundos - [int]($r.LatenciaMs / 1000)
    if ($espera -gt 0 -and (Get-Date) -lt $fin) { Start-Sleep -Seconds $espera }
}

# =============================================================================
# Cálculo de métricas
# =============================================================================
$total = $muestras.Count
$upCount = @($muestras | Where-Object { $_.Up }).Count
$downCount = $total - $upCount

# RAv-1-G: cada muestra representa un intervalo de muestreo
$segProgramados = $total * $IntervaloSegundos          # B
$segDisponibles = $upCount * $IntervaloSegundos        # A
if ($segProgramados -gt 0) { $x1 = [math]::Round($segDisponibles / [double]$segProgramados, 4) } else { $x1 = 0 }

# RAv-2-G: episodios DOWN consecutivos = 1 fallo cada uno
$fallos = 0
$enFallo = $false
foreach ($m in $muestras) {
    if (-not $m.Up) {
        if (-not $enFallo) { $fallos++; $enFallo = $true }
    } else {
        $enFallo = $false
    }
}
$segInactividad = $downCount * $IntervaloSegundos      # A
if ($fallos -gt 0) { $x2 = [math]::Round($segInactividad / [double]$fallos, 2) } else { $x2 = 'N/A' }

$resumen = @(
    [pscustomobject]@{ id='RAv-1-G'; nombre='Disponibilidad del sistema'; A_seg=$segDisponibles; B_seg=$segProgramados; X=$x1; interpretacion='Proporcion del tiempo programado realmente disponible (1.0 = mejor)'; fecha=$fecha; entorno=$BaseUrl; muestras=$total; intervalo_s=$IntervaloSegundos }
    [pscustomobject]@{ id='RAv-2-G'; nombre='Tiempo medio de inactividad'; A_seg=$segInactividad; B_seg=$fallos; X=$x2; interpretacion='Segundos promedio de inactividad por fallo (0 = mejor). B = numero de fallos observados'; fecha=$fecha; entorno=$BaseUrl; muestras=$total; intervalo_s=$IntervaloSegundos }
)

Write-Host "`nResultados:" -ForegroundColor Green
Write-Host ("  Muestras: {0} (UP: {1} / DOWN: {2}) - Fallos observados: {3}" -f $total, $upCount, $downCount, $fallos)
Write-Host ("  RAv-1-G: A={0}s B={1}s X={2}" -f $segDisponibles, $segProgramados, $x1)
Write-Host ("  RAv-2-G: A={0}s B={1} fallos X={2}" -f $segInactividad, $fallos, $x2)
if ($fallos -eq 0) {
    Write-Host "  AVISO: no se observo ningun fallo; RAv-2-G queda N/A. Repite provocando una averia controlada." -ForegroundColor Yellow
}
Export-Resultado -Filas $resumen -Ruta (Join-Path $carpeta "disponibilidad_resumen$Sufijo.csv")
Write-Host ("  -> " + $rutaMuestras) -ForegroundColor DarkGray
